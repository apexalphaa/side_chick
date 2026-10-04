import pg from "pg";
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
await client.query(`
  INSERT INTO app_settings (key, value)
  VALUES ('global_kill_switch', '{"enabled": false}')
  ON CONFLICT (key) DO NOTHING;
`);
await client.end();
console.log("Seed complete");
