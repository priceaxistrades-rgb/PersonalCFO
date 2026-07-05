const { Client } = require('pg');

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
