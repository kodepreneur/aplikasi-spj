import fs from "node:fs";
import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { getAppConfig } from "../config";
import * as schema from "./schema";

let clientInstance: Client | null = null;
let dbInstance: LibSQLDatabase<typeof schema> | null = null;

export function getDb(): LibSQLDatabase<typeof schema> {
  if (dbInstance) return dbInstance;

  const config = getAppConfig();
  if (!fs.existsSync(config.dataDir)) {
    fs.mkdirSync(config.dataDir, { recursive: true, mode: 0o700 });
  }

  clientInstance = createClient({
    url: `file:${config.dbPath}`,
  });

  // Enable WAL mode & foreign keys for sqlite
  clientInstance.execute("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;").catch((err) => {
    console.error("Failed to execute initial PRAGMAs on sqlite:", err);
  });

  dbInstance = drizzle(clientInstance, { schema });
  return dbInstance;
}

export const db = getDb();
