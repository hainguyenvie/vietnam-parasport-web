import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
    const allowedExtensions = [
      '.pdf', '.png', '.jpg', '.jpeg', '.webp',
      '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt',
      '.vtt', '.srt',
      '.mp4', '.webm', '.mov'
    ];

    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json({ error: `Định dạng tệp ${ext} không được phép tải lên.` }, { status: 400 });
    }

    let sizeLimit = 10 * 1024 * 1024; // default 10MB
    let typeLabel = 'Tệp tin';

    const isVideo = file.type.startsWith('video/') || ['.mp4', '.webm', '.mov'].includes(ext);
    const isPdf = file.type === 'application/pdf' || ext === '.pdf';
    const isImage = file.type.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.webp'].includes(ext);
    const isOffice = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'].includes(ext);
    const isSubtitle = ['.vtt', '.srt'].includes(ext);

    if (isVideo) {
      sizeLimit = 50 * 1024 * 1024; // 50MB
      typeLabel = 'Video';
    } else if (isPdf) {
      sizeLimit = 100 * 1024 * 1024; // 100MB
      typeLabel = 'Tài liệu PDF';
    } else if (isImage) {
      sizeLimit = 10 * 1024 * 1024; // 10MB
      typeLabel = 'Hình ảnh';
    } else if (isOffice) {
      sizeLimit = 20 * 1024 * 1024; // 20MB
      typeLabel = 'Tài liệu văn phòng';
    } else if (isSubtitle) {
      sizeLimit = 10 * 1024 * 1024; // 10MB
      typeLabel = 'Tệp phụ đề';
    }

    if (file.size > sizeLimit) {
      const limitMb = sizeLimit / (1024 * 1024);
      let suggestion = '';
      if (isVideo) {
        suggestion = ' Vui lòng tải video lên YouTube/Vimeo hoặc nền tảng lưu trữ và sử dụng tùy chọn nhúng video thay thế.';
      } else if (isPdf) {
        suggestion = ' Vui lòng nén file PDF hoặc chia nhỏ tài liệu.';
      } else if (isImage) {
        suggestion = ' Vui lòng tối ưu hóa kích thước hình ảnh hoặc chuyển sang định dạng WebP.';
      } else if (isOffice) {
        suggestion = ' Vui lòng nén tệp hoặc chuyển đổi định dạng.';
      } else if (isSubtitle) {
        suggestion = ' Vui lòng tối ưu hóa hoặc rút ngắn tệp phụ đề.';
      }
      return NextResponse.json({ error: `Kích thước ${typeLabel} vượt quá giới hạn cho phép (${limitMb}MB).${suggestion}` }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save path inside private-uploads (not served statically by Next.js)
    const uploadDir = join(process.cwd(), "private-uploads");
    
    // Ensure directory exists
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (err) {
      // Ignore if directory already exists
    }

    // Generate a unique UUID filename to avoid collision and guessing
    const fileExtension = file.name.split(".").pop();
    const uniqueFilename = `${crypto.randomUUID()}.${fileExtension}`;
    const filePath = join(uploadDir, uniqueFilename);

    // Write file
    await writeFile(filePath, buffer);
    
    return NextResponse.json({
      url: `/uploads/${uniqueFilename}`,
    });
  } catch (error: any) {
    console.error("Error saving file:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}
