// packages\scraper\src\wiki.ts
export const WIKI_ORIGIN = "https://limbuscompany.wiki.gg";

export interface WikiClient {
  getText(url: string): Promise<string>;
  parseHtml(pageTitle: string): Promise<string>;
  getWikitextRaw(pageTitle: string): Promise<string>;
}

export function createWikiClient(opts: { userAgent: string; minDelayMs?: number }): WikiClient {
  const minDelayMs = opts.minDelayMs ?? 120;
  let last = 0;

  async function throttle() {
    const now = Date.now();
    const wait = Math.max(0, last + minDelayMs - now);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    last = Date.now();
  }

  async function getText(url: string): Promise<string> {
    await throttle();
    const res = await fetch(url, { headers: { "user-agent": opts.userAgent } });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return res.text();
  }

  async function parseHtml(pageTitle: string): Promise<string> {
    const u = new URL(`${WIKI_ORIGIN}/api.php`);
    u.searchParams.set("format", "json");
    u.searchParams.set("action", "parse");
    u.searchParams.set("page", pageTitle);
    u.searchParams.set("prop", "text");
    u.searchParams.set("disablelimitreport", "1");
    u.searchParams.set("disableeditsection", "1");

    const j = JSON.parse(await getText(u.toString())) as any;
    return j?.parse?.text?.["*"] ?? "";
  }

  async function getWikitextRaw(pageTitle: string): Promise<string> {
    const u = `${WIKI_ORIGIN}/wiki/${encodeURIComponent(pageTitle)}?action=raw`;
    return getText(u);
  }

  return { getText, parseHtml, getWikitextRaw };
}
