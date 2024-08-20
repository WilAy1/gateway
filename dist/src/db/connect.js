"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const env_1 = require("../utils/env");
// Create a new Pool instance
const pool = new pg_1.Pool({
    user: env_1.env.DB_USER,
    host: env_1.env.DB_HOST,
    port: parseInt(env_1.env.DB_PORT, 10), // Default PostgreSQL port
    database: env_1.env.DB_NAME,
    password: env_1.env.DB_PASS
});
exports.default = pool;
//# sourceMappingURL=connect.js.map