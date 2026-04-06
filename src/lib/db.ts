import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const globalForSql = globalThis as unknown as { sql: ReturnType<typeof neon> };
export const sql = globalForSql.sql || neon(process.env.DATABASE_URL);
if (process.env.NODE_ENV !== 'production') globalForSql.sql = sql;
