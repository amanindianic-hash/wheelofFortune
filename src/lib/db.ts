import { neon } from '@neondatabase/serverless';

type SqlClient = ReturnType<typeof neon>;
const globalForSql = globalThis as unknown as { sql: SqlClient };

function getDb(): SqlClient {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  if (!globalForSql.sql) {
    globalForSql.sql = neon(process.env.DATABASE_URL);
  }
  return globalForSql.sql;
}

// Target must be a function for the `apply` trap to fire (tagged template calls)
export const sql: SqlClient = new Proxy(function () {} as unknown as SqlClient, {
  apply(_target, _thisArg, args) {
    return (getDb() as unknown as (...a: unknown[]) => unknown)(...args);
  },
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
