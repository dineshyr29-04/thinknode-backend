const { Pool } = require('pg');
require('dotenv').config();

const sslConfig = process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false;

const localDbHosts = new Set(['localhost', '127.0.0.1', '::1']);

const connectionConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: sslConfig
    }
  : (() => {
      const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

      if (!DB_HOST || !DB_PORT || !DB_USER || !DB_PASSWORD || !DB_NAME) {
        throw new Error('Missing database environment variables. Set DATABASE_URL or DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, and DB_NAME.');
      }

      if (process.env.NODE_ENV === 'production' && localDbHosts.has(DB_HOST.trim())) {
        throw new Error('Production database host cannot be localhost. Set DATABASE_URL or use the hosted Postgres host from Render or your database provider.');
      }

      return {
        host: DB_HOST,
        port: Number(DB_PORT),
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
        ssl: sslConfig
      };
    })();

const pool = new Pool(connectionConfig);

module.exports = pool;
