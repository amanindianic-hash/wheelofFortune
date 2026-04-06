import { neon } from '@neondatabase/serverless';

type SqlClient = ReturnType<typeof neon>;

// Create a fresh client on every cold start — avoids proxy/global caching issues
// in Vercel serverless where module state may not persist between invocations.
function createSql(): SqlClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      '[db] DATABASE_URL is not set. Add it in Vercel → Project Settings → Environment Variables and redeploy.'
    );
  }
  return neon(url);
}

// Lazy singleton — reused within the same function invocation, recreated on cold starts.
let _sql: SqlClient | undefined;

function getDb(): SqlClient {
  if (!_sql) {
    _sql = createSql();
  }
  return _sql;
}

// Proxy target must be a function so the `apply` trap fires for tagged template calls:
// e.g.  sql`SELECT * FROM users`
export const sql: SqlClient = new Proxy(function () {} as unknown as SqlClient, {
  apply(_target, _thisArg, args) {
    return (getDb() as unknown as (...a: unknown[]) => unknown)(...args);
  },
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
