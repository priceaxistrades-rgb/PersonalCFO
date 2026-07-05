import pg from 'pg';
import { pool } from './src/db/index.ts'; // This might not work because of TS

// Since I can't easily import TS in a raw node script without ts-node, 
// I'll just use process.env.DATABASE_URL
const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to DB");
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "profileImage" text');
    console.log("Successfully added profileImage column");
  } catch (err) {
    console.error("Error updating DB:", err);
  } finally {
    await client.end();
  }
}

run();
