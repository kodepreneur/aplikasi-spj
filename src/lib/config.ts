import path from "node:path";

export interface AppConfig {
  port: number;
  publicUrl: URL;
  dataDir: string;
  dbPath: string;
  sessionSecret: string;
  isSecure: boolean;
}

export function getAppConfig(): AppConfig {
  const port = Number(process.env.PORT || process.env.BAPENDA_PORT || 8787);
  const rawUrl =
    process.env.PUBLIC_URL ||
    process.env.BAPENDA_PUBLIC_URL ||
    `http://localhost:${port}/`;
  const publicUrl = new URL(rawUrl.endsWith("/") ? rawUrl : `${rawUrl}/`);
  const isSecure = publicUrl.protocol === "https:";

  const rawDataDir = process.env.DATA_DIR || process.env.BAPENDA_DATA_DIR;
  const dataDir = rawDataDir
    ? path.resolve(rawDataDir)
    : path.join(process.cwd(), "data");

  const dbPath = path.join(dataDir, "bapenda.sqlite");

  const sessionSecret =
    process.env.SESSION_SECRET ||
    "default-dev-secret-key-min-32-chars-long-development-only";

  return {
    port,
    publicUrl,
    dataDir,
    dbPath,
    sessionSecret,
    isSecure,
  };
}
