// packages/core/src/baseline.ts
import { decodeOuterTeamCode } from "./teamcode";

// Default “trash can reset” code (outer string).
export const DEFAULT_RESET_TEAM_CODE =
  "H4sIAAAAAAAACnMMdEx3BAInR2cQ5ejq6AmmqSLsaGsLANDKykhgAAAA";

// Baseline payload template (70 bytes) used for:
// - default team on startup
// - reset team button
export function getBaselinePayload(): Uint8Array {
  return decodeOuterTeamCode(DEFAULT_RESET_TEAM_CODE);
}
