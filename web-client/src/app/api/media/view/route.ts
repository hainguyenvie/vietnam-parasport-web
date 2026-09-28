import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { verifySignature } from "@/utils/security";

const getContentType = (fileName: string): string => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "svg":
      return "image/svg+xml";
    case "webp":
      return "image/webp";
    case "mp4":
      return "video/mp4";
    case "webm":
      return "video/webm";
    case "vtt":
      return "text/vtt";
    case "mp3":
      return "audio/mpeg";
    default:
      return "application/octet-stream";
  }
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const file = searchParams.get("file");
    const expiresStr = searchParams.get("expires");
    const signature = searchParams.get("signature");

    if (!file || !expiresStr || !signature) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const expires = parseInt(expiresStr, 10);
    if (isNaN(expires)) {
      return NextResponse.json({ error: "Invalid expiry timestamp" }, { status: 400 });
    }

    // Verify signature and expiration
    const isValid = verifySignature(file, expires, signature);
    if (!isValid) {
      return NextResponse.json({ error: "Forbidden: Invalid or expired signature" }, { status: 403 });
    }

    // Prevent directory traversal attacks
    const safeFilename = basename(file);
    let filePath = join(process.cwd(), "private-uploads", safeFilename);
    let buffer;

    try {
      buffer = await readFile(filePath);
    } catch (err) {
      // Fallback: check public/uploads for backward compatibility with legacy comments
      try {
        filePath = join(process.cwd(), "public", "uploads", safeFilename);
        buffer = await readFile(filePath);
      } catch (fallbackErr) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }
    }

    const contentType = getContentType(safeFilename);

    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable", // Long-lived cache for immutable assets
      },
    });
  } catch (error: any) {
    console.error("Signed URL view error", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

// Simple helper to get filename basename to prevent directory traversal
function basename(path: string): string {
  return path.split(/[\\/]/).pop() || "";
}
