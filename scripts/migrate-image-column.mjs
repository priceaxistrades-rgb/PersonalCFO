/**
 * Pre-push Migration: Safely migrate `image` → `profile_image` before schema push
 * 
 * Run this BEFORE `npm run db:push` to preserve existing profile images.
 * 
 * Usage: node scripts/migrate-image-column.mjs
 */

import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ DATABASE_URL environment variable is required");
  process.exit(1);
}

const { Pool } = pg;
const pool = new Pool({ connectionString: databaseUrl });

async function migrate() {
  const client = await pool.connect();
  
  try {
    // Step 1: Check if both columns exist
    const { rows: columns } = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
        AND column_name IN ('image', 'profile_image')
    `);
    
    const hasImageColumn = columns.some(c => c.column_name === "image");
    const hasProfileImageColumn = columns.some(c => c.column_name === "profile_image");
    
    console.log("📋 Column check:");
    console.log(`   - image column exists: ${hasImageColumn}`);
    console.log(`   - profile_image column exists: ${hasProfileImageColumn}`);
    
    if (!hasImageColumn) {
      console.log("✅ No 'image' column found — nothing to migrate. Safe to push.");
      return;
    }
    
    // Step 2: Count rows with data in `image` column
    const { rows: countRows } = await client.query(`
      SELECT COUNT(*) as count FROM users WHERE image IS NOT NULL AND image != ''
    `);
    const imageCount = parseInt(countRows[0].count);
    console.log(`📊 Found ${imageCount} users with profile images in 'image' column`);
    
    if (imageCount === 0) {
      console.log("✅ No data to migrate — 'image' column is empty. Safe to push.");
      return;
    }
    
    // Step 3: Show what will be migrated
    const { rows: previewRows } = await client.query(`
      SELECT id, name, image FROM users WHERE image IS NOT NULL AND image != ''
    `);
    console.log("\n🔍 Data to migrate:");
    for (const row of previewRows) {
      console.log(`   User #${row.id} (${row.name}): ${row.image}`);
    }
    
    // Step 4: Create profile_image column if it doesn't exist
    if (!hasProfileImageColumn) {
      console.log("\n🔧 Creating 'profile_image' column...");
      await client.query(`ALTER TABLE users ADD COLUMN profile_image text`);
      console.log("✅ Created 'profile_image' column");
    }
    
    // Step 5: Copy data from image → profile_image (only where profile_image is NULL)
    const { rowCount } = await client.query(`
      UPDATE users 
      SET profile_image = image 
      WHERE image IS NOT NULL 
        AND image != '' 
        AND profile_image IS NULL
    `);
    console.log(`\n✅ Migrated ${rowCount} profile image(s) from 'image' → 'profile_image'`);
    
    // Step 6: Verify
    const { rows: verifyRows } = await client.query(`
      SELECT id, name, profile_image FROM users WHERE profile_image IS NOT NULL AND profile_image != ''
    `);
    console.log("\n✅ Verification — users with profile_image:");
    for (const row of verifyRows) {
      console.log(`   User #${row.id} (${row.name}): ${row.profile_image}`);
    }
    
    console.log("\n🎉 Migration complete! You can now safely run `npm run db:push`");
    console.log("   The 'image' column will be dropped, but data is preserved in 'profile_image'.");
    
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
