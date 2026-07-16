// packages\scraper\src\parse\wikitext.ts
function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getParamLine(src: string, key: string): string | undefined {
  const re = new RegExp(`^\\|${escapeRegExp(key)}\\s*=\\s*(.*?)\\s*$`, "mi");
  const m = src.match(re);
  return m?.[1]?.trim();
}

export function parseDateDotsToIso(dots: string): string | null {
  const m = dots.trim().match(/^(\d{4})\.(\d{2})\.(\d{2})$/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

/** Extracts the "{{Skill ...}}" template content after a parameter like |skill1=, |defense=, |skill= */
export function extractSkillBlock(src: string, paramKey: string): string | null {
  const startRe = new RegExp(`^\\|${escapeRegExp(paramKey)}\\s*=\\s*\\{\\{Skill\\b`, "mi");
  const start = src.search(startRe);
  if (start < 0) return null;

  const tail = src.slice(start);
  const idx = tail.indexOf("{{Skill");
  if (idx < 0) return null;

  let depth = 0;
  for (let i = idx; i < tail.length - 1; i++) {
    const two = tail.slice(i, i + 2);
    if (two === "{{") depth++;
    else if (two === "}}") depth--;

    if (depth === 0) return tail.slice(idx, i + 2);
  }
  return null;
}

export function getSkillParam(skillBlock: string, key: string): string | undefined {
  const re = new RegExp(`\\|${escapeRegExp(key)}\\s*=\\s*([^|}]*)`, "i");
  const m = skillBlock.match(re);
  return m?.[1]?.trim();
}
