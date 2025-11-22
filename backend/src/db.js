const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  user: "exequiel",
  password: "postgres",
  database: "petconnect",
  port: 5432
});

module.exports = pool;
