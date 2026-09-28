import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  HttpStatus,
  HttpCode,
  Logger,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import { diskStorage } from "multer";
import * as path from "path";
import * as fs from "fs";
import * as fsPromises from "fs/promises";
import * as crypto from "crypto";

// Magic byte signatures for file type verification
const MAGIC_BYTES: Record<string, { offset: number; bytes: number[] }> = {
  png: { offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47] }, // .png
  jpg: { offset: 0, bytes: [0xff, 0xd8, 0xff] }, // .jpg/.jpeg
  webp: { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] }, // .webp
  pdf: { offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] }, // .pdf
  gif: { offset: 0, bytes: [0x47, 0x49, 0x46, 0x38] }, // .gif
};

function verifyFileMagic(filePath: string, expectedType: string): boolean {
  let fd: number | null = null;
  try {
    const sig = MAGIC_BYTES[expectedType];
    if (!sig) return true; // No signature check for this type, fallback to extension

    fd = fs.openSync(filePath, "r");

    if (expectedType === "pdf") {
      // PDF header %PDF- can be anywhere within the first 1024 bytes
      const buf = Buffer.alloc(1024);
      const bytesRead = fs.readSync(fd, buf, 0, 1024, 0);
      const pdfSig = Buffer.from(sig.bytes);
      return buf.subarray(0, bytesRead).indexOf(pdfSig) !== -1;
    }

    const buf = Buffer.alloc(sig.offset + sig.bytes.length);
    fs.readSync(fd, buf, 0, buf.length, 0);
    const header = buf.slice(sig.offset, sig.offset + sig.bytes.length);
    return sig.bytes.every((byte, idx) => header[idx] === byte);
  } catch (err) {
    Logger.error(`Error verifying magic bytes for ${filePath}:`, err);
    return false;
  } finally {
    if (fd !== null) {
      try {
        fs.closeSync(fd);
      } catch (e) {
        /* ignore */
      }
    }
  }
}

import { MediaService } from "./media.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { verifySignature, getSignedUrl, sanitizeSvg } from "../../common/utils/security";

@ApiTags("Media")
@Controller("media")
export class MediaController {
  private readonly logger = new Logger(MediaController.name);

  constructor(private readonly mediaService: MediaService) {}

  @Post("upload")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Tải lên tệp tin và tự động phân loại" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
        isPublic: {
          type: "string",
          description: "true hoặc false (mặc định là false)",
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const isPublic = req.query.isPublic === "true" || req.body.isPublic === "true";
          const rootUploads = isPublic ? "./uploads/public" : "./uploads/private";

          let subfolder = "documents";
          const mime = file.mimetype || "";
          if (mime === "image/svg+xml") {
            subfolder = "svgs";
          } else if (mime.startsWith("image/")) {
            subfolder = "images";
          } else if (mime === "application/pdf") {
            subfolder = isPublic ? "documents" : "pdfs";
          }

          const destPath = path.join(rootUploads, subfolder);
          fs.mkdirSync(destPath, { recursive: true });
          cb(null, destPath);
        },
        filename: (req, file, cb) => {
          let ext = path.extname(file.originalname);
          if (!ext && file.mimetype) {
            if (file.mimetype === "image/jpeg") ext = ".jpg";
            else if (file.mimetype === "image/png") ext = ".png";
            else if (file.mimetype === "image/webp") ext = ".webp";
            else if (file.mimetype === "image/gif") ext = ".gif";
          }
          const uuid = crypto.randomUUID();
          cb(null, `${uuid}${ext}`);
        },
      }),
    })
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query("isPublic") queryIsPublic?: string
  ) {
    if (!file) {
      throw new BadRequestException("Không tìm thấy tệp tin được tải lên.");
    }

    let ext = path.extname(file.originalname).toLowerCase();
    if (!ext && file.mimetype) {
      if (file.mimetype === "image/jpeg") ext = ".jpg";
      else if (file.mimetype === "image/png") ext = ".png";
      else if (file.mimetype === "image/webp") ext = ".webp";
      else if (file.mimetype === "image/gif") ext = ".gif";
    }

    const allowedExtensions = [
      ".pdf",
      ".png",
      ".jpg",
      ".jpeg",
      ".webp",
      ".gif",
      ".svg",
      ".doc",
      ".docx",
      ".xls",
      ".xlsx",
      ".ppt",
      ".pptx",
      ".txt",
      ".vtt",
      ".srt",
      ".mp4",
      ".webm",
      ".mov",
    ];

    if (!allowedExtensions.includes(ext)) {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw new BadRequestException(`Định dạng tệp ${ext} không được phép tải lên.`);
    }

    // Check size limit dynamically
    let sizeLimit = 10 * 1024 * 1024; // default 10MB
    let typeLabel = "Tệp tin";

    const mime = file.mimetype || "";
    const isVideo = mime.startsWith("video/") || [".mp4", ".webm", ".mov"].includes(ext);
    const isPdf = mime === "application/pdf" || ext === ".pdf";
    const isImage = mime.startsWith("image/") || [".png", ".jpg", ".jpeg", ".webp"].includes(ext);
    const isOffice = [".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt"].includes(ext);
    const isSubtitle = [".vtt", ".srt"].includes(ext);

    if (isVideo) {
      sizeLimit = 50 * 1024 * 1024; // 50MB
      typeLabel = "Video";
    } else if (isPdf) {
      sizeLimit = 100 * 1024 * 1024; // 100MB
      typeLabel = "Tài liệu PDF";
    } else if (isImage) {
      sizeLimit = 10 * 1024 * 1024; // 10MB
      typeLabel = "Hình ảnh";
    } else if (isOffice) {
      sizeLimit = 20 * 1024 * 1024; // 20MB
      typeLabel = "Tài liệu văn phòng";
    } else if (isSubtitle) {
      sizeLimit = 10 * 1024 * 1024; // 10MB
      typeLabel = "Tệp phụ đề";
    }

    if (file.size > sizeLimit) {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      const limitMb = sizeLimit / (1024 * 1024);
      let suggestion = "";
      if (isVideo) {
        suggestion =
          " Vui lòng tải video lên YouTube/Vimeo hoặc nền tảng lưu trữ và sử dụng tùy chọn nhúng video thay thế.";
      } else if (isPdf) {
        suggestion = " Vui lòng nén file PDF hoặc chia nhỏ tài liệu.";
      } else if (isImage) {
        suggestion = " Vui lòng tối ưu hóa kích thước hình ảnh hoặc chuyển sang định dạng WebP.";
      } else if (isOffice) {
        suggestion = " Vui lòng nén tệp hoặc chuyển đổi định dạng.";
      } else if (isSubtitle) {
        suggestion = " Vui lòng tối ưu hóa hoặc rút ngắn tệp phụ đề.";
      }
      throw new BadRequestException(
        `Kích thước ${typeLabel} vượt quá giới hạn cho phép (${limitMb}MB).${suggestion}`
      );
    }

    const isPublic = queryIsPublic === "true";

    // Verify file content matches extension (prevent MIME type spoofing)
    const isImageExt = [".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(ext);
    if (isImageExt) {
      const isValidImage =
        verifyFileMagic(file.path, "png") ||
        verifyFileMagic(file.path, "jpg") ||
        verifyFileMagic(file.path, "webp") ||
        verifyFileMagic(file.path, "gif");
      if (!isValidImage) {
        fs.unlinkSync(file.path);
        throw new BadRequestException("Tệp tin không phải là hình ảnh hợp lệ (PNG/JPG/WebP/GIF).");
      }
    } else {
      if (ext === ".pdf" && !verifyFileMagic(file.path, "pdf")) {
        fs.unlinkSync(file.path);
        throw new BadRequestException("Tệp tin không phải là tài liệu PDF hợp lệ.");
      }
    }

    // SVG XSS Sanitization
    const mimeStr = file.mimetype || "";
    const isSvg = mimeStr === "image/svg+xml" || ext === ".svg";
    if (isSvg) {
      try {
        const content = await fsPromises.readFile(file.path, "utf8");
        const sanitized = sanitizeSvg(content);
        await fsPromises.writeFile(file.path, sanitized, "utf8");
      } catch (err) {
        this.logger.error(`Failed to sanitize SVG file ${file.path}: ${(err as Error).message}`);
        throw new BadRequestException("Không thể xử lý và khử độc file SVG.");
      }
    }

    const relativePath = path.relative(path.resolve("./uploads"), file.path).replace(/\\/g, "/");

    let url = `/uploads/${relativePath}`;
    if (!isPublic) {
      url = getSignedUrl(relativePath);
    }

    return {
      success: true,
      message: "Tải lên tệp tin thành công.",
      data: {
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: relativePath,
        url,
      },
    };
  }

  @Get("view")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Xem tệp tin bảo mật qua Signed URL" })
  async viewPrivateFile(
    @Query("file") file: string,
    @Query("expires") expires: string,
    @Query("signature") signature: string,
    @Res() res: Response
  ) {
    if (!file || !expires || !signature) {
      throw new BadRequestException("Thiếu thông số ký xác thực đường dẫn.");
    }

    const isVerified = verifySignature(file, Number(expires), signature);
    if (!isVerified) {
      throw new ForbiddenException("Đường dẫn không hợp lệ hoặc đã hết hạn.");
    }

    const safePath = path.resolve("./uploads", file);
    const privateRoot = path.resolve("./uploads/private");
    if (!safePath.startsWith(privateRoot)) {
      throw new ForbiddenException("Không thể truy cập tài nguyên ngoài vùng bảo mật.");
    }

    if (!fs.existsSync(safePath)) {
      throw new NotFoundException("Không tìm thấy tệp tin yêu cầu.");
    }

    res.sendFile(safePath, (err) => {
      if (err) {
        if (!res.headersSent) {
          res.status(HttpStatus.NOT_FOUND).json({
            success: false,
            message: "Không tìm thấy tệp tin hoặc không thể đọc tệp tin.",
          });
        }
      }
    });
  }

  @Post("lessons/:id/process-accessibility")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "ORGANIZATION_ADMIN")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Process video for STT (subtitles) and TTS (audio description) via mock API",
  })
  async processAccessibility(@Param("id") id: string) {
    return this.mediaService.processVideoAccessibility(id);
  }
}
