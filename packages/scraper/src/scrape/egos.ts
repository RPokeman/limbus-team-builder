// packages\scraper\src\scrape\egos.ts
import * as cheerio from "cheerio";
import type { WikiClient } from "../wiki";
import { fileNameFromThumbSrc, thumbUrlFromFileName } from "../portraits";

export interface EgoIndexEntry {
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
  if (i <= 0) return false;
  const ns = page.slice(0, i);
  return BAD_NAMESPACES.has(ns);
}

export async function scrapeEgoIndex(wiki: WikiClient): Promise<EgoIndexEntry[]> {
  const html = await wiki.parseHtml("List_of_E.G.O");
  const $ = cheerio.load(html);

  const out: EgoIndexEntry[] = [];
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
    if (page === "List_of_E.G.O") return;
    if (page.startsWith("List_of_")) return;

    // Only reject real namespaces like File:/Category:
    if (isBadNamespaceTitle(page)) return;

    if (seen.has(page)) return;
    seen.add(page);

    const name = ($a.attr("title") ?? page.replace(/_/g, " ")).trim();

    out.push({
      page,
      name,
      // Option A: EGOs use 130px thumbs
      portraitUrl: thumbUrlFromFileName(fileName, 130),
    });
  });

  return out;
}
