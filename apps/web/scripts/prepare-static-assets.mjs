import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.resolve(__dirname, "../../..");
const dataDir = path.join(repoRoot, "data");
const publicDir = path.join(repoRoot, "apps/web/public");
const sourceImagesDir = path.join(dataDir, "images");
const targetImagesDir = path.join(publicDir, "images");

function readJson(fileName) {
  return JSON.parse(fs.readFileSync(path.join(dataDir, fileName), "utf8"));
}

fs.mkdirSync(publicDir, { recursive: true });

const dataset = {
  identities: readJson("identities.json"),
  egos: readJson("egos.json"),
  ordinals: readJson("ordinals.json"),
};

fs.writeFileSync(path.join(publicDir, "dataset.json"), `${JSON.stringify(dataset)}\n`);

if (fs.existsSync(sourceImagesDir)) {
  fs.rmSync(targetImagesDir, { recursive: true, force: true });
  fs.cpSync(sourceImagesDir, targetImagesDir, { recursive: true });
}
