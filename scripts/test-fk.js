const { createClient } = require("@libsql/client");
const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

client.execute("PRAGMA foreign_keys")
  .then(r => console.log("foreign_keys =", r.rows[0]))
  .catch(e => console.error("Error:", e.message));
