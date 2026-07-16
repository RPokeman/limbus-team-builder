// packages\scraper\src\index.ts
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createWikiClient } from "./wiki";
import { scrapeIdentityIndex } from "./scrape/identities";
import { scrapeEgoIndex } from "./scrape/egos";
import { parseIdentityPage } from "./parse/identities";
import { parseEgoPage } from "./parse/egos";
import { buildOrdinals } from "./ordinals";

async function main() {
  const wiki = createWikiClient({
    userAgent: "limbus-team-builder-scraper/1.0",
    minDelayMs: 120,
  });

  // Resolve repo-root/data from packages/scraper
  const dataDir = resolve(process.cwd(), "../../data");

  await mkdir(dataDir, { recursive: true });

  /* ------------------ Identities ------------------ */

  const identityIndex = await scrapeIdentityIndex(wiki);
  const identities = [];

  for (const entry of identityIndex) {
    const wikitext = await wiki.getWikitextRaw(entry.page);
    identities.push(
      parseIdentityPage({
        page: entry.page,
        name: entry.name,
        wikitext,
        portraitUrl: entry.portraitUrl,
      }),
    );
  }

  await writeFile(resolve(dataDir, "identities.json"), JSON.stringify(identities, null, 2), "utf8");

  /* ------------------ EGOs ------------------ */

  const egoIndex = await scrapeEgoIndex(wiki);
  const egos = [];

  for (const entry of egoIndex) {
    const wikitext = await wiki.getWikitextRaw(entry.page);
    egos.push(
      parseEgoPage({
        page: entry.page,
        name: entry.name,
        wikitext,
        portraitUrl: entry.portraitUrl,
      }),
    );
  }

  await writeFile(resolve(dataDir, "egos.json"), JSON.stringify(egos, null, 2), "utf8");

  /* ------------------ Ordinals ------------------ */

  await buildOrdinals(dataDir);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
