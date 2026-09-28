import {
  Controller,
  Post,
  Get,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Body,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { SetGenericSettingDto } from "./dto/setting.dto";
import { SettingsService } from "./settings.service";

@Controller("settings")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getSettings() {
    return this.settingsService.getSettings();
  }

  @Post("admin/logo")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: "./uploads/settings",
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `logo-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpeg|png|jpg|svg)$/)) {
          return cb(new Error("Only image files are allowed for logo"), false);
        }
        cb(null, true);
      },
    })
  )
  async uploadLogo(@UploadedFile() file: Express.Multer.File) {
    const path = `uploads/settings/${file.filename}`;
    return this.settingsService.setLogo(path);
  }

  @Post("admin/favicon")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: "./uploads/settings",
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `favicon-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(ico|png|svg)$/)) {
          return cb(new Error("Only .ico, .png, .svg files are allowed for favicon"), false);
        }
        cb(null, true);
      },
    })
  )
  async uploadFavicon(@UploadedFile() file: Express.Multer.File) {
    const path = `uploads/settings/${file.filename}`;
    return this.settingsService.setFavicon(path);
  }

  @Post("admin/generic")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  async setGenericSetting(@Body() body: SetGenericSettingDto) {
    if (!body.key || body.value === undefined) {
      throw new BadRequestException("key and value are required");
    }
    return this.settingsService.setSetting(body.key, body.value);
  }
  @Post("admin/generic-upload")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: "./uploads/settings",
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `upload-${uniqueSuffix}${ext}`);
        },
      }),
    })
  )
  async genericUpload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("File is required");
    }
    const path = `uploads/settings/${file.filename}`;
    return { url: path };
  }
}
