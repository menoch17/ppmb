import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

console.log("Creating FTS5 virtual table...");
await client.execute(`
  CREATE VIRTUAL TABLE IF NOT EXISTS posts_fts
  USING fts5(rawtext, content='posts', content_rowid='nodeid')
`);

const BATCH = 5000;
let offset = 0;
let total = 0;

console.log("Populating FTS5 index in batches...");
while (true) {
  const rows = await client.execute({
    sql: `SELECT nodeid, rawtext FROM posts WHERE rawtext IS NOT NULL LIMIT ? OFFSET ?`,
    args: [BATCH, offset],
  });

  if (rows.rows.length === 0) break;

  const statements = rows.rows.map((row) => ({
    sql: `INSERT INTO posts_fts(rowid, rawtext) VALUES (?, ?)`,
    args: [row.nodeid, row.rawtext],
  }));

  await client.batch(statements, "write");

  total += rows.rows.length;
  offset += BATCH;
  console.log(`  Indexed ${total} posts...`);
}

console.log(`Done! Indexed ${total} posts total.`);
client.close();
