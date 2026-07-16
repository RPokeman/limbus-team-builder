// apps/web/src/screens/PreviewScreen.tsx
import React from "react";

import type { EgoRecord, IdentityRecord, OrdinalTables, TeamState } from "@limbus/core/types";

import TeamsList from "../components/preview/TeamsList";
import TeamName from "../components/preview/TeamName";
import TeamCopyPaste from "../components/preview/TeamCopyPaste";
import DetailsToggle from "../components/preview/DetailsToggle";
import TeamReset from "../components/preview/TeamReset";
import TeamPane from "../components/preview/TeamPane";
import SinCostPanel from "../components/preview/SinCostPanel";
import QuickButtons from "../components/preview/QuickButtons";

import type { StoredTeam } from "../state/teamsStorage";

type Dataset = {
  identities: IdentityRecord[];
  egos: EgoRecord[];
  ordinals: OrdinalTables;
  assetBaseUrl?: string;
};

export default function PreviewScreen(props: {
  dataset: Dataset;
  teams: StoredTeam[];
  activeTeamIndex: number;
  onSelectTeam: (idx: number) => void;

  teamState: TeamState;
  setTeamState: React.Dispatch<React.SetStateAction<TeamState>>;

  teamName: string;
  setTeamName: (name: string) => void;

  teamCode: string;
  setTeamCode: (code: string) => void;

  detailsMode: "min" | "skills" | "ego";
  setDetailsMode: (m: "min" | "skills" | "ego") => void;

  onResetTeam: () => void;

  onEnterSelector: (initialMode?: "identities" | "ego", initialSinnerIndex?: number) => void;

  teamCodeError: string | null;
}) {
  const {
    dataset,
    teams,
    activeTeamIndex,
    onSelectTeam,
    teamState,
    setTeamState,
    teamName,
    setTeamName,
    teamCode,
    setTeamCode,
    detailsMode,
    setDetailsMode,
    onResetTeam,
    onEnterSelector,
    teamCodeError,
  } = props;

  return (
    <div
      style={{
        height: "100vh",
        background: "#0b0b0d",
        color: "#eee",
        display: "grid",
        gridTemplateColumns: "260px 1fr 300px",
        gap: 12,
        padding: 12,
        boxSizing: "border-box",
        minHeight: 0,
      }}
    >
      <TeamsList teams={teams} activeIndex={activeTeamIndex} onSelect={onSelectTeam} />

      <div
        style={{
          border: "1px solid #1e1e22",
          borderRadius: 10,
          overflow: "hidden",
          background: "#0f0f13",
          display: "grid",
          gridTemplateRows: "54px 1fr",
          minHeight: 0,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto auto auto",
            gap: 10,
            alignItems: "center",
            padding: "10px 12px",
            borderBottom: "1px solid #1e1e22",
            background: "linear-gradient(180deg, #17171d, #121218)",
          }}
        >
          <TeamName name={teamName} onRename={setTeamName} />

          {/* swapped order: Details first, then copy/paste */}
          <DetailsToggle mode={detailsMode} setMode={setDetailsMode} />

          <TeamCopyPaste teamCode={teamCode} setTeamCode={setTeamCode} teamCodeError={teamCodeError} />

          <TeamReset onReset={onResetTeam} />
        </div>

        <div style={{ padding: 12, minHeight: 0, overflow: "auto" }}>
          <TeamPane
            dataset={dataset}
            team={teamState}
            detailsMode={detailsMode}
            onClickCard={(slotIndex) => onEnterSelector("identities", slotIndex)}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateRows: "auto 1fr auto", gap: 10, minHeight: 0 }}>
        <SinCostPanel dataset={dataset} team={teamState} />
        <div />
        <QuickButtons
          onAllIdentities={() => onEnterSelector("identities")}
          onAllEgos={() => onEnterSelector("ego")}
        />
      </div>
    </div>
  );
}
