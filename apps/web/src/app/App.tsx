import React, { useEffect, useRef, useState } from "react";

import type { EgoRecord, IdentityRecord, OrdinalTables, TeamState } from "@limbus/core/types";
import { DEFAULT_RESET_TEAM_CODE } from "@limbus/core/baseline";

import { setPortraits } from "../assets";

import GameViewport from "./GameViewport";
import PreviewScreen from "../screens/PreviewScreen";
import SelectorScreen from "../screens/SelectorScreen";

import type { StoredTeam } from "../state/teamsStorage";
import {
  DEFAULT_TEAMS_COUNT,
  createDefaultTeams,
  loadTeamsFromStorage,
  saveTeamsToStorage,
} from "../state/teamsStorage";

import { decodeTeamStateFromOuterCodeSafe, encodeTeamStateToOuterCode } from "../lib/teamcode/codec";
import { normalizeTeamState } from "../lib/teamcode/normalize";

type Dataset = {
  identities: (IdentityRecord & { portraitUrl?: string })[];
  egos: (EgoRecord & { portraitUrl?: string })[];
  ordinals: OrdinalTables;
  assetBaseUrl?: string;
};

type Scene = "preview" | "selector";
type DetailsMode = "min" | "skills" | "ego";

function emptyTeamState(): TeamState {
  return { slots: Array.from({ length: 12 }, () => ({ identityKey: "", egos: {} })) };
}

function buildPortraitMaps(ds: Dataset) {
  const identities: Record<string, string> = {};
  for (const rec of ds.identities as any[]) {
    const page = String(rec?.page ?? "");
    const url = String(rec?.portraitUrl ?? "");
    if (page && url) identities[page] = url;
  }

  const egos: Record<string, string> = {};
  for (const rec of ds.egos as any[]) {
    const page = String(rec?.page ?? "");
    const url = String(rec?.portraitUrl ?? "");
    if (page && url) egos[page] = url;
  }

  return { identities, egos };
}

export default function App(): JSX.Element {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [datasetError, setDatasetError] = useState<string | null>(null);

  const [teams, setTeams] = useState<StoredTeam[]>(() =>
    createDefaultTeams(DEFAULT_TEAMS_COUNT, DEFAULT_RESET_TEAM_CODE),
  );
  const [activeTeamIndex, setActiveTeamIndex] = useState<number>(0);

  const [teamState, setTeamState] = useState<TeamState>(() => emptyTeamState());
  const [teamCodeError, setTeamCodeError] = useState<string | null>(null);
  const [detailsMode, setDetailsMode] = useState<DetailsMode>("min");

  const [scene, setScene] = useState<Scene>("preview");
  const [selectorInitialSinnerIndex, setSelectorInitialSinnerIndex] = useState<number | undefined>(
    undefined,
  );
  const [selectorInitialMode, setSelectorInitialMode] = useState<"identities" | "ego" | undefined>(
    undefined,
  );

  // Prevent stale closures when switching teams quickly.
  const activeTeamIndexRef = useRef(activeTeamIndex);
  activeTeamIndexRef.current = activeTeamIndex;

  // Prevent decode-after-encode loops (decode can be lossy in practice).
  const lastInternallyEncodedCodeRef = useRef<string | null>(null);

  const activeTeam =
    teams[activeTeamIndex] ?? teams[0] ?? { name: `TEAMS #1`, code: DEFAULT_RESET_TEAM_CODE };

  const teamName = activeTeam.name;
  const teamCode = activeTeam.code;

  useEffect(() => {
    const loaded = loadTeamsFromStorage();
    if (loaded) setTeams(loaded);
  }, []);

  useEffect(() => {
    saveTeamsToStorage(teams);
  }, [teams]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setDatasetError(null);
        const res = await fetch(`${import.meta.env.BASE_URL}dataset.json`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as Dataset;
        if (cancelled) return;

        setDataset(json);
        setPortraits(buildPortraitMaps(json));
      } catch (e: any) {
        if (cancelled) return;
        setDatasetError(String(e?.message ?? e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!dataset) return;

    if (lastInternallyEncodedCodeRef.current && teamCode === lastInternallyEncodedCodeRef.current) {
      setTeamCodeError(null);
      return;
    }

    const decoded = decodeTeamStateFromOuterCodeSafe(teamCode, { ordinals: dataset.ordinals });
    if (!decoded) {
      setTeamCodeError("Invalid team code (failed to decode).");

      const fallback = decodeTeamStateFromOuterCodeSafe(DEFAULT_RESET_TEAM_CODE, {
        ordinals: dataset.ordinals,
      });

      setTeamState(normalizeTeamState(fallback ?? emptyTeamState(), dataset));
      return;
    }

    setTeamCodeError(null);
    setTeamState(normalizeTeamState(decoded, dataset));
  }, [dataset, teamCode]);

  function updateTeamAtIndex(idx: number, patch: Partial<StoredTeam>) {
    setTeams((prev) => {
      const out = prev.length
        ? [...prev]
        : createDefaultTeams(DEFAULT_TEAMS_COUNT, DEFAULT_RESET_TEAM_CODE);

      const clamped = Math.max(0, Math.min(idx, out.length - 1));
      out[clamped] = { ...out[clamped], ...patch };
      return out;
    });
  }

  function updateActiveTeam(patch: Partial<StoredTeam>) {
    updateTeamAtIndex(activeTeamIndexRef.current, patch);
  }

  function setTeamNameSafe(nextName: string) {
    updateActiveTeam({ name: nextName });
  }

  function setTeamCodeSafe(nextCode: string) {
    lastInternallyEncodedCodeRef.current = null;
    updateActiveTeam({ code: nextCode });
  }

  const setTeamStateAndSync: React.Dispatch<React.SetStateAction<TeamState>> = (updater) => {
    const targetIdx = activeTeamIndexRef.current;

    setTeamState((prev) => {
      const nextRaw = typeof updater === "function" ? (updater as any)(prev) : updater;
      if (!dataset) return nextRaw;

      const next = normalizeTeamState(nextRaw, dataset);

      try {
        const code = encodeTeamStateToOuterCode(next, { ordinals: dataset.ordinals });
        lastInternallyEncodedCodeRef.current = code;
        updateTeamAtIndex(targetIdx, { code });
      } catch {
        // If encoding fails, keep UI state but don't overwrite stored code.
      }

      return next;
    });
  };

  const onSelectTeam = (idx: number) => {
    lastInternallyEncodedCodeRef.current = null;
    setActiveTeamIndex(idx);
  };

  const onResetTeam = () => {
    lastInternallyEncodedCodeRef.current = null;
    updateActiveTeam({ name: `TEAMS #${activeTeamIndexRef.current + 1}`, code: DEFAULT_RESET_TEAM_CODE });
  };

  const onEnterSelector = (initialMode?: "identities" | "ego", initialSinnerIndex?: number) => {
    setSelectorInitialMode(initialMode);
    setSelectorInitialSinnerIndex(initialSinnerIndex);
    setScene("selector");
  };

  if (!dataset || datasetError) {
    return (
      <GameViewport>
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "grid",
            placeItems: "center",
            color: "white",
            fontFamily: "system-ui, sans-serif",
            background: "#0b0b0d",
          }}
        >
          {datasetError ? `Dataset error: ${datasetError}` : "Loading dataset..."}
        </div>
      </GameViewport>
    );
  }

  return (
    <GameViewport>
      {scene === "preview" ? (
        <PreviewScreen
          dataset={dataset}
          teams={teams}
          activeTeamIndex={activeTeamIndex}
          onSelectTeam={onSelectTeam}
          teamState={teamState}
          setTeamState={setTeamStateAndSync}
          teamName={teamName}
          setTeamName={setTeamNameSafe}
          teamCode={teamCode}
          setTeamCode={setTeamCodeSafe}
          onResetTeam={onResetTeam}
          onEnterSelector={onEnterSelector}
          detailsMode={detailsMode}
          setDetailsMode={setDetailsMode}
          teamCodeError={teamCodeError}
        />
      ) : (
        <SelectorScreen
          dataset={dataset}
          teamState={teamState}
          setTeamState={setTeamStateAndSync}
          onBack={() => setScene("preview")}
          initialSinnerIndex={selectorInitialSinnerIndex}
          initialMode={selectorInitialMode}
        />
      )}
    </GameViewport>
  );
}
