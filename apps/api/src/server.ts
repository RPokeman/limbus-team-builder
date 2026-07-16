// apps/api/src/server.ts
import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
app.use(cors());
app.use(express.json());

// ESM-safe __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// repo root: /apps/api/src -> go up 3
const ROOT = path.resolve(__dirname, "../../../");
const DATA_DIR = path.join(ROOT, "data");
const IMAGES_DIR = path.join(DATA_DIR, "images");

function readJson<T>(file: string): T {
  const p = path.join(DATA_DIR, file);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

// Load once at startup
const identities = readJson<any[]>("identities.json");
const egos = readJson<any[]>("egos.json");
const ordinals = readJson<any>("ordinals.json");

// Serve local images (types, etc.) from /images/...
// (This is still useful for /images/types/* even if portraits are remote URLs.)
if (fs.existsSync(IMAGES_DIR)) {
  app.use("/images", express.static(IMAGES_DIR));
}

// Build portrait URL lookup tables from dataset records
const portraits = {
  identities: Object.fromEntries(
    identities
      .filter((r) => r?.page && r?.portraitUrl)
      .map((r) => [String(r.page), String(r.portraitUrl)])
  ) as Record<string, string>,
  egos: Object.fromEntries(
    egos
      .filter((r) => r?.page && r?.portraitUrl)
      .map((r) => [String(r.page), String(r.portraitUrl)])
  ) as Record<string, string>,
};

// -------------------------
// API routes
// -------------------------

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/dataset", (_req, res) => {
  res.json({ identities, egos, ordinals, portraits });
});

// stubs for later
app.post("/api/encode", (_req, res) => {
  res.status(501).json({ error: "Encode endpoint not implemented." });
});

app.post("/api/decode", (_req, res) => {
  res.status(501).json({ error: "Decode endpoint not implemented." });
});

// -------------------------

const PORT = Number(process.env.PORT ?? 3001);
app.listen(PORT, () => {
  console.log(`[api] listening on http://localhost:${PORT}`);
  console.log(`[api] data dir: ${DATA_DIR}`);
  console.log(`[api] images dir: ${IMAGES_DIR}`);
});
