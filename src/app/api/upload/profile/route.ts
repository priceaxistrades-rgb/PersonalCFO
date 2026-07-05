import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/data";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

// ─── Allowed Image Types ────────────────────────────────────────

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

/**
 * Magic byte signatures for allowed image formats.
 * We check the first bytes of the file to verify it's actually an image,
 * preventing spoofed extensions (e.g., malware.html renamed to .png).
 */
const MAGIC_BYTES: { signature: Buffer; mime: string }[] = [
  { signature: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), mime: "image/png" },
  { signature: Buffer.from([0xff, 0xd8, 0xff]), mime: "image/jpeg" },
  { signature: Buffer.from([0x52, 0x49, 0x46, 0x46]), mime: "image/webp" }, // RIFF header (WebP starts with RIFF...WEBP)
];

function detectMimeFromBytes(buffer: Buffer): string | null {
  for (const { signature, mime } of MAGIC_BYTES) {
    if (buffer.length >= signature.length && buffer.subarray(0, signature.length).equals(signature)) {
      // For WebP, also check the WEBP marker at offset 8
      if (mime === "image/webp") {
        if (buffer.length >= 12 && buffer.subarray(8, 12).equals(Buffer.from("WEBP"))) {
          return mime;
        }
        continue;
      }
      return mime;
    }
  }
  return null;
}

function sanitizeFilename(name: string): string {
  // Remove any path separators or special characters
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    // ─── Size Check ──────────────────────────────────────────
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024} MB.` }, { status: 400 });
    }

    // ─── MIME Type Check (from Content-Type header) ──────────
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, and WebP images are allowed." },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ─── Magic Byte Verification (prevents extension spoofing) ─
    const detectedMime = detectMimeFromBytes(buffer);
    if (!detectedMime || !ALLOWED_MIME_TYPES.has(detectedMime)) {
      return NextResponse.json(
        { error: "File content does not match an allowed image format." },
        { status: 400 },
      );
    }

    // ─── Generate Safe Filename ──────────────────────────────
    const ext = detectedMime === "image/png" ? "png" : detectedMime === "image/jpeg" ? "jpg" : "webp";
    const hash = crypto.randomBytes(16).toString("hex");
    const filename = `profile-${user.userId}-${hash}.${ext}`;

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), "public/uploads");
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch {
      // Directory may already exist
    }

    const filePath = path.join(uploadDir, filename);

    // Verify the resolved path is still within the upload directory (prevent path traversal)
    if (!filePath.startsWith(path.resolve(uploadDir))) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    await writeFile(filePath, buffer);

    const publicPath = `/uploads/${filename}`;

    await db.update(users)
      .set({ profileImage: publicPath })
      .where(eq(users.id, user.userId));

    return NextResponse.json({ success: true, path: publicPath });
  } catch (error: unknown) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 },
    );
  }
}
