// D1 Database client wrapper

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

export interface D1PreparedStatement {
  bind(...params: any[]): D1PreparedStatement;
  all<T = any>(): Promise<D1Result<T>>;
  first<T = any>(): Promise<T | null>;
  run(): Promise<D1Response>;
}

export interface D1Result<T> {
  results: T[];
  success: boolean;
}

export interface D1Response {
  success: boolean;
  meta: any;
}

// Access the envAsyncLocalStorage set up by @cloudflare/next-on-pages
// (declared globally on globalThis in the generated _worker.js/index.js)
declare const envAsyncLocalStorage: {
  getStore(): Record<string, any> | undefined;
  run<T>(store: Record<string, any>, callback: () => T): T;
};

// Get D1 binding from Cloudflare environment
export function getDB(): D1Database {
  // 1) Direct globals (set by envAsyncLocalStorage proxy in the bundled worker)
  // @ts-ignore
  let db: D1Database | undefined = (globalThis as any).DB;
  // 2) Pull from envAsyncLocalStorage.getStore() — this is what @cloudflare/next-on-pages
  //    actually populates inside React Server Component contexts.
  if (!db) {
    try {
      // @ts-ignore
      const store = typeof envAsyncLocalStorage !== "undefined" ? envAsyncLocalStorage.getStore() : undefined;
      if (store && store.DB) db = store.DB;
    } catch {
      // Ignore — ALS not available in this context
    }
  }
  // 3) Fallback for older next-on-pages templates (process.env.DB)
  if (!db) {
    try {
      // @ts-ignore
      db = process?.env?.DB;
    } catch {
      // Ignore
    }
  }
  if (!db) {
    throw new Error("D1 binding 'DB' not available in this request context");
  }
  return db;
}