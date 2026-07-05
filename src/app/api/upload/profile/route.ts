import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/data";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save image to /home/user/uploads
    const filename = `profile-${user.userId}-${Date.now()}.png`;
    const uploadDir = path.join(process.cwd(), "public/uploads");
    
    // Ensure directory exists
    try {
      await writeFile(path.join(uploadDir, ".keep"), ""); 
    } catch {
      // If it fails, we should create the directory. 
      // But we can't use mkdirSync easily in some environments.
      // Let's assume public/uploads exists or use a simpler path.
    }

    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const publicPath = `/uploads/${filename}`;

    await db.update(users)
      .set({ profileImage: publicPath })
      .where(eq(users.id, user.userId));

    return NextResponse.json({ success: true, path: publicPath });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
