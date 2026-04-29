import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";

import { serveStatic, setupVite } from "./vite";
import { getDb } from "../db";
import { boosts } from "../../drizzle/schema";
import { and, eq, sql } from "drizzle-orm";

/* =========================
   CONFIG
========================= */
const DEFAULT_PORT = 3000;

/* =========================
   BOOST JOB
========================= */
async function expireBoostsJob() {
  try {
    const db = await getDb();
    if (!db) return;

    const now = Date.now();

    await db
      .update(boosts)
      .set({ status: "expired" })
      .where(
        and(
          eq(boosts.status, "active"),
          sql`${boosts.expiresAt} < ${now}`
        )
      );
  } catch (err) {
    console.error("[BoostExpiry] error:", err);
  }
}

function startBoostJob() {
  expireBoostsJob();
  setInterval(expireBoostsJob, 2 * 60 * 1000);
  console.log("[BoostExpiry] running every 2min");
}

/* =========================
   PORT UTIL
========================= */
function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.listen(port, () => {
      server.close(() => resolve(true));
    });

    server.on("error", () => resolve(false));
  });
}

async function findPort(start: number): Promise<number> {
  for (let p = start; p < start + 20; p++) {
    if (await isPortAvailable(p)) return p;
  }
  throw new Error("No available port found");
}

/* =========================
   EXPRESS APP SETUP
========================= */
function createApp() {
  const app = express();

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  registerOAuthRoutes(app);

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  return app;
}

/* =========================
   SERVER START
========================= */
async function start() {
  const app = createApp();
  const server = createServer(app);

  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferred = Number(process.env.PORT || DEFAULT_PORT);
  const port = await findPort(preferred);

  if (port !== preferred) {
    console.log(`Port ${preferred} busy → using ${port}`);
  }

  server.listen(port, () => {
    console.log(`Server running → http://localhost:${port}`);

    startBoostJob();
  });
}

/* =========================
   BOOT
========================= */
start().catch((err) => {
  console.error("Fatal server error:", err);
});
