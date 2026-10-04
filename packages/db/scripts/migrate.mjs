import pg from "pg";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../migrations");
const files = (await fs.readdir(dir)).filter(f => f.endsWith(".sql")).sort();
for (const file of files) {
  console.log(`Applying ${file}`);
  await client.query(await fs.readFile(path.join(dir, file), "utf8"));
}
await client.end();
