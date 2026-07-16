// packages\scraper\src\scrape\identities.ts
import * as cheerio from "cheerio";
import type { WikiClient } from "../wiki";
import { fileNameFromThumbSrc, thumbUrlFromFileName } from "../portraits";

export interface IdentityIndexEntry {
  page: string;
  name: string;
  portraitUrl: string;
}

const BAD_NAMESPACES = new Set([
  "File",
  "Category",
  "Special",
  "Help",
  "Template",
  "User",
  "MediaWiki",
  "Talk",
  "Module",
]);

function isBadNamespaceTitle(page: string): boolean {
  const i = page.indexOf(":");
  if (i <= 0) return false; // no namespace prefix
  const ns = page.slice(0, i);
  return BAD_NAMESPACES.has(ns);
}

export async function scrapeIdentityIndex(wiki: WikiClient): Promise<IdentityIndexEntry[]> {
  const html = await wiki.parseHtml("List_of_Identities");
  const $ = cheerio.load(html);

  const out: IdentityIndexEntry[] = [];
  const seen = new Set<string>();

  $("img[src*='/images/thumb/']").each((_, img) => {
    const $img = $(img);
    const src = $img.attr("src");
    if (!src) return;

    const fileName = fileNameFromThumbSrc(src);
    if (!fileName) return;

    const $a = $img.closest("a[href^='/wiki/']");
    if ($a.length === 0) return;

    const href = $a.attr("href");
    if (!href) return;

    const page = decodeURIComponent(href.replace(/^\/wiki\//, "")).split("#")[0];
    if (!page) return;

    // Skip the index page / other list pages if they show up due to self-links.
    if (page === "List_of_Identities") return;
    if (page.startsWith("List_of_")) return;

    // Only reject true namespaces like File:/Category:
    if (isBadNamespaceTitle(page)) return;

    if (seen.has(page)) return;
    seen.add(page);

    const name = ($a.attr("title") ?? page.replace(/_/g, " ")).trim();

    out.push({
      page,
      name,
      // Identities use 256px thumbs (single canonical size)
      portraitUrl: thumbUrlFromFileName(fileName, 256),
    });
  });

  return out;
}
