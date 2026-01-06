"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const host = "dpg-d5eed7re5dus73fm6lrg-a";
const user = "√";
const port = 5432;
const database = "gateway_sgdc";
const password = "5iKzIyNDKNWMDPKPa9HTag5199wJSn8Y";
// Create a new Pool instance
const pool = new pg_1.Pool({
    connectionString: "postgresql://gateway_sgdc_user:5iKzIyNDKNWMDPKPa9HTag5199wJSn8Y@dpg-d5eed7re5dus73fm6lrg-a/gateway_sgdc",
    user: user, //env.DB_USER,
    host: host, //env.DB_HOST,
    port: port, //parseInt(env.DB_PORT as string, 10), // Default PostgreSQL port
    database: database, //env.DB_NAME,
    password: password, //env.DB_PASS,
    ssl: {
        rejectUnauthorized: false
    } //false
});
exports.default = pool;
//# sourceMappingURL=connect.js.map