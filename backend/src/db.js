const { Pool } = require("pg");

const pool = new Pool({
    user: "smartcart",
    host: process.env.DB_HOST || "postgres",
    database: "smartcartdb",
    password: "admin",
    port: 5432
});

module.exports = pool;
