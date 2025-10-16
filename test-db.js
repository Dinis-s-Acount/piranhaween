import "dotenv/config";
import pool from "./lib/db.js";

const test = async () => {
  const result = await pool.query("SELECT NOW()");
  console.log(result.rows);
  process.exit();
};

test();
