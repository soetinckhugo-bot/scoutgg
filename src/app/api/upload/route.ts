import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { mkdir } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";
import { requireAdmin } from "@/lib/server/auth";
import crypto from "crypto";
import { logger } from "@/lib/logger";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ALLOWED_EXTS = [".jpg", ".jpeg", ".png", ".webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

function getSafeExtension(mimeType: string): string {
  switch (mimeType) {
    case "image/jpeg":
    case "image/jpg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    default:
      return ".jpg";
  }
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only jpg, jpeg, png, webp are allowed." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Max 5MB." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate file is actually an image by checking magic numbers
    const magic = buffer.slice(0, 4).toString("hex");
    const isJpeg = magic.startsWith("ffd8");
    const isPng = magic === "89504e47";
    const isWebp = magic.startsWith("524946") || magic.startsWith("574542");

    if (!isJpeg && !isPng && !isWebp) {
      return NextResponse.json(
        { error: "Invalid file content. File is not a valid image." },
        { status: 400 }
      );
    }

    // Force safe extension based on MIME type, ignore original filename extension
    const ext = getSafeExtension(file.type);
    const timestamp = Date.now();
    const randomId = crypto.randomBytes(8).toString("hex");
    const filename = `${timestamp}_${randomId}${ext}`;

    // Use Vercel Blob in production, local filesystem in dev
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

    if (blobToken) {
      const { url } = await put(`players/${filename}`, buffer, {
        access: "public",
        contentType: file.type,
      });
      return NextResponse.json({ url });
    }

    // Fallback to local filesystem for dev
    const uploadDir = path.join(process.cwd(), "public", "uploads", "players");
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const url = `/uploads/players/${filename}`;
    return NextResponse.json({ url });
  } catch (error) {
    logger.error("Upload error:", { error });
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
