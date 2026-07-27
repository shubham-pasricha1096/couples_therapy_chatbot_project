"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
const pg_1 = require("pg");
const config_1 = __importDefault(require("../utils/config"));
const pool = new pg_1.Pool({
    connectionString: config_1.default.databaseUrl
});
exports.pool = pool;
pool.query('SELECT NOW()')
    .then(res => console.log('✅ PostgreSQL connected:', res.rows[0]))
    .catch(err => console.error('❌ PostgreSQL error:', err));
exports.default = pool;
