// packages\scraper\src\portraits.ts
import { WIKI_ORIGIN } from "./wiki";

/**
 * Legacy: stable URL that redirects to canonical file location.
 * (Kept for compatibility, but the scraper index now uses thumb URLs instead.)
 */
export function filePathUrlFromFileName(fileName: string): string {
  return `${WIKI_ORIGIN}/wiki/Special:FilePath/${encodeURIComponent(fileName)}`;
}

/**
 * Build a direct MediaWiki thumbnail URL:
 *   /images/thumb/<FileName>/<N>px-<FileName>
 *
 * This avoids CORP issues seen with Special:FilePath/Special:Redirect.
 *
 * Note: we intentionally do NOT include any query string so caching is more effective.
 */
export function thumbUrlFromFileName(fileName: string, px: number): string {
  const safePx = Math.max(1, Math.floor(px));
  const encoded = encodeURIComponent(fileName);
  return `${WIKI_ORIGIN}/images/thumb/${encoded}/${safePx}px-${encoded}`;
}

/** Extract "<FILENAME>.png" from "/images/thumb/<FILENAME>.png/130px-..." (query stripped) */
export function fileNameFromThumbSrc(src: string): string | null {
  const withoutQuery = src.split("?")[0] ?? src;
  const s = withoutQuery.replace(/^https?:\/\/[^/]+/i, "");
  const m = s.match(/\/images\/thumb\/([^/]+?)\/\d+px-/i);
  if (!m) return null;
  return decodeURIComponent(m[1]);
}

export function isUptiedFileName(fileName: string): boolean {
  return /_uptied\./i.test(fileName);
}
