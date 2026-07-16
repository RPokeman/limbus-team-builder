// apps/web/src/state/teamsStorage.ts
export type StoredTeam = {
  name: string;
  code: string;
};

export const DEFAULT_TEAMS_COUNT = 20;

const STORAGE_KEY = "limbus_team_builder_v1_teams";

export function createDefaultTeams(count: number, resetCode: string): StoredTeam[] {
  return Array.from({ length: count }, (_, i) => ({
    name: `TEAMS #${i + 1}`,
    code: resetCode,
  }));
}

export function loadTeamsFromStorage(): StoredTeam[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;

    const normalized: StoredTeam[] = parsed
      .map((t: any) => ({ name: String(t?.name ?? ""), code: String(t?.code ?? "") }))
      .filter((t) => t.name && t.code);

    if (normalized.length === 0) return null;
    return normalized;
  } catch {
    return null;
  }
}

export function saveTeamsToStorage(teams: StoredTeam[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(teams));
  } catch {
    // ignore
  }
}
