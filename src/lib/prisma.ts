import { PrismaClient } from "@prisma/client";
import { PrismaMssql } from "@prisma/adapter-mssql";

function parseDatabaseUrl(url: string) {
  // Formato: sqlserver://host:port;database=db;user=u;password=p;...
  const withoutScheme = url.replace(/^sqlserver:\/\//, "");
  const [hostPort, ...params] = withoutScheme.split(";");
  const [server, portStr] = hostPort.split(":");
  const port = portStr ? parseInt(portStr, 10) : 1433;
  const pairs = Object.fromEntries(
    params
      .filter(Boolean)
      .map((p) => {
        const idx = p.indexOf("=");
        return [p.slice(0, idx).toLowerCase(), p.slice(idx + 1)];
      })
  );
  return {
    server,
    port,
    database: pairs["database"] ?? "",
    user: pairs["user"] ?? "",
    password: decodeURIComponent(pairs["password"] ?? ""),
    options: {
      encrypt: pairs["encrypt"] !== "false",
      trustServerCertificate: pairs["trustservercertificate"] === "true",
    },
  };
}

const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL ?? "");
const adapter = new PrismaMssql(dbConfig);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;



