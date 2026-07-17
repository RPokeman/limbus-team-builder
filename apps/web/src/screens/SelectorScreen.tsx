// apps/web/src/screens/SelectorScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";

import type { EgoRecord, IdentityRecord, OrdinalTables, TeamState, EgoTier } from "@limbus/core/types";
import { SINNER_ORDER } from "@limbus/core/types";

import { SinnerRail } from "./selector/SinnerRail";
import { ModeToggle } from "./selector/ModeToggle";
import { MiniFilterButton } from "./selector/MiniFilterButton";
import { SelectedIdentityPanel } from "./selector/SelectedIdentityPanel";
import { CatalogGrid } from "./selector/CatalogGrid";

import FilterPanel from "./selector/FilterPanel";
import {
  type SelectorMode,
  type IdentityFilterState,
  type EgoFilterState,
  EGO_TIER_ORDER,
  emptyIdentityFilters,
  emptyEgoFilters,
  recordMatchesIdentityFilters,
  recordMatchesEgoFilters,
} from "./selector/filtering";

type Dataset = {
  identities: IdentityRecord[];
  egos: EgoRecord[];
  ordinals: OrdinalTables;
  assetBaseUrl?: string;
};

type SinnerFilter = "ALL" | number;

function dateForAscending(d?: string | null): number {
  if (!d) return Number.NEGATIVE_INFINITY;
  const t = Date.parse(d);
  return Number.isFinite(t) ? t : Number.NEGATIVE_INFINITY;
}

function getIdentityKey(rec: any): string {
  return String(rec?.page ?? rec?.key ?? rec?.id ?? "");
}

function getEgoKey(rec: any): string {
  return String(rec?.page ?? rec?.key ?? rec?.id ?? "");
}

function getSinnerName(rec: any): string {
  return String(rec?.sinner ?? "");
}

function getEgoTier(rec: any): EgoTier {
  return (rec?.tier as EgoTier) ?? "ZAYIN";
}

function getIdentityRarity(rec: any): number {
  return Number(rec?.rarity ?? 0);
}

function getRecordName(rec: any): string {
  return String(rec?.name ?? rec?.page ?? "");
}

function sinnerIndexFromName(name: string): number | null {
  const idx = SINNER_ORDER.indexOf(name as any);
  return idx >= 0 ? idx : null;
}

export default function SelectorScreen(props: {
  dataset: Dataset;
  teamState: TeamState;
  setTeamState: React.Dispatch<React.SetStateAction<TeamState>>;
  onBack: () => void;

  initialSinnerIndex?: number;
  initialMode?: SelectorMode;
}) {
  const { dataset, teamState, setTeamState, onBack, initialSinnerIndex, initialMode } = props;

  const [sinnerFilter, setSinnerFilter] = useState<SinnerFilter>(
    typeof initialSinnerIndex === "number" ? initialSinnerIndex : "ALL"
  );
  const [mode, setMode] = useState<SelectorMode>(initialMode ?? "identities");
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  const [identityFilters, setIdentityFilters] = useState<IdentityFilterState>(() => emptyIdentityFilters());
  const [egoFilters, setEgoFilters] = useState<EgoFilterState>(() => emptyEgoFilters());

  const [orderedKeys, setOrderedKeys] = useState<string[]>([]);
  const [sortNonce, setSortNonce] = useState(0);

  const selectedSinnerIndex = sinnerFilter === "ALL" ? null : sinnerFilter;
  const selectedSinnerName = selectedSinnerIndex == null ? null : SINNER_ORDER[selectedSinnerIndex];

  const teamStateRef = useRef<TeamState>(teamState);
  useEffect(() => {
    teamStateRef.current = teamState;
  }, [teamState]);

  useEffect(() => {
    return () => {
      setFilterPanelOpen(false);
      setIdentityFilters(emptyIdentityFilters());
      setEgoFilters(emptyEgoFilters());
    };
  }, []);

  useEffect(() => {
    if (mode === "identities") setIdentityFilters(emptyIdentityFilters());
    else setEgoFilters(emptyEgoFilters());
    setSortNonce((n) => n + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const visibleIdentities = useMemo(() => {
    const all = dataset.identities ?? [];
    if (sinnerFilter === "ALL") return all;
    const sinnerName = SINNER_ORDER[sinnerFilter];
    return all.filter((r: any) => getSinnerName(r) === sinnerName);
  }, [dataset.identities, sinnerFilter]);

  const visibleEgos = useMemo(() => {
    const all = dataset.egos ?? [];
    if (sinnerFilter === "ALL") return all;
    const sinnerName = SINNER_ORDER[sinnerFilter];
    return all.filter((r: any) => getSinnerName(r) === sinnerName);
  }, [dataset.egos, sinnerFilter]);

  const byIdentityKey = useMemo(() => {
    const m = new Map<string, IdentityRecord>();
    for (const r of dataset.identities as any[]) m.set(getIdentityKey(r), r as any);
    return m;
  }, [dataset.identities]);

  const byEgoKey = useMemo(() => {
    const m = new Map<string, EgoRecord>();
    for (const r of dataset.egos as any[]) m.set(getEgoKey(r), r as any);
    return m;
  }, [dataset.egos]);

  const isIdentitySelected = (rec: any) => {
    const idx = sinnerIndexFromName(getSinnerName(rec));
    if (idx == null) return false;
    const curKey = teamStateRef.current.slots[idx]?.identityKey ?? "";
    return getIdentityKey(rec) === curKey;
  };

  const isEgoSelected = (rec: any) => {
    const idx = sinnerIndexFromName(getSinnerName(rec));
    if (idx == null) return false;
    const tier = getEgoTier(rec);
    const cur = (teamStateRef.current.slots[idx]?.egos ?? {}) as any;
    return String(cur[tier] ?? "") === getEgoKey(rec);
  };

  useEffect(() => {
    setSortNonce((n) => n + 1);
  }, [sinnerFilter, dataset.identities, dataset.egos, identityFilters, egoFilters]);

  useEffect(() => {
    if (mode === "identities") {
      const filtered = visibleIdentities.filter((r: any) => recordMatchesIdentityFilters(r, identityFilters));

      const keys = [...filtered]
        .sort((a: any, b: any) => {
          const aSel = isIdentitySelected(a) ? 0 : 1;
          const bSel = isIdentitySelected(b) ? 0 : 1;
          if (aSel !== bSel) return aSel - bSel;

          const ra = getIdentityRarity(a);
          const rb = getIdentityRarity(b);
          if (ra !== rb) return ra - rb;

          const da = dateForAscending((a as any)?.releaseDate);
          const db = dateForAscending((b as any)?.releaseDate);
          if (da !== db) return da - db;

          return getRecordName(a).localeCompare(getRecordName(b));
        })
        .map(getIdentityKey);

      setOrderedKeys(keys);
    } else {
      const filtered = visibleEgos.filter((r: any) => recordMatchesEgoFilters(r, egoFilters));

      const keys = [...filtered]
        .sort((a: any, b: any) => {
          const aSel = isEgoSelected(a) ? 0 : 1;
          const bSel = isEgoSelected(b) ? 0 : 1;
          if (aSel !== bSel) return aSel - bSel;

          const ta = EGO_TIER_ORDER.indexOf(getEgoTier(a));
          const tb = EGO_TIER_ORDER.indexOf(getEgoTier(b));
          if (ta !== tb) return ta - tb;

          const da = dateForAscending((a as any)?.releaseDate);
          const db = dateForAscending((b as any)?.releaseDate);
          if (da !== db) return da - db;

          return getRecordName(a).localeCompare(getRecordName(b));
        })
        .map(getEgoKey);

      setOrderedKeys(keys);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, sortNonce]);

  const resolveTargetSinnerIndexForIdentity = (identityKey: string): number | null => {
    if (selectedSinnerIndex != null) return selectedSinnerIndex;
    const rec: any = byIdentityKey.get(identityKey);
    if (!rec) return null;
    return sinnerIndexFromName(getSinnerName(rec));
  };

  const resolveTargetSinnerIndexForEgo = (egoKey: string): number | null => {
    if (selectedSinnerIndex != null) return selectedSinnerIndex;
    const rec: any = byEgoKey.get(egoKey);
    if (!rec) return null;
    return sinnerIndexFromName(getSinnerName(rec));
  };

  const onPickIdentity = (identityKey: string) => {
    const targetIdx = resolveTargetSinnerIndexForIdentity(identityKey);
    if (targetIdx == null) return;

    setTeamState((prev) => {
      const next = structuredClone(prev) as TeamState;
      next.slots[targetIdx].identityKey = identityKey;
      return next;
    });
  };

  const onPickEgo = (egoKey: string) => {
    const targetIdx = resolveTargetSinnerIndexForEgo(egoKey);
    if (targetIdx == null) return;

    const rec: any = byEgoKey.get(egoKey);
    if (!rec) return;

    const tier = getEgoTier(rec);

    setTeamState((prev) => {
      const next = structuredClone(prev) as TeamState;
      const egos: any = next.slots[targetIdx].egos ?? (next.slots[targetIdx].egos = {});

      const cur = String(egos[tier] ?? "");
      if (cur === egoKey) {
        if (tier === "ZAYIN") return prev;
        delete egos[tier];
        return next;
      }

      egos[tier] = egoKey;
      return next;
    });
  };

  const clearActiveFilters = () => {
    if (mode === "identities") setIdentityFilters(emptyIdentityFilters());
    else setEgoFilters(emptyEgoFilters());
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#0b0b0d",
        color: "#eee",
        display: "grid",
        gridTemplateColumns: "200px minmax(0, 1fr) 340px",
        gap: 12,
        padding: 12,
        boxSizing: "border-box",
        minHeight: 0,
      }}
    >
      <SinnerRail
        sinnerFilter={sinnerFilter}
        onBack={onBack}
        onSelect={(f) => setSinnerFilter(f)}
        teamState={teamState}
        identitiesByKey={byIdentityKey}
      />

      <div
        style={{
          border: "1px solid #1e1e22",
          borderRadius: 10,
          overflow: "hidden",
          background: "#0f0f13",
          display: "grid",
          gridTemplateRows: "54px 1fr",
          minHeight: 0,
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto auto",
            gap: 10,
            alignItems: "center",
            padding: "10px 12px",
            borderBottom: "1px solid #1e1e22",
            background: "linear-gradient(180deg, #17171d, #121218)",
          }}
        >
          <div style={{ fontWeight: 700, letterSpacing: 0.5 }}>{mode === "identities" ? "Identities" : "E.G.O"}</div>

          <ModeToggle mode={mode} setMode={setMode} />

          <MiniFilterButton open={filterPanelOpen} onToggle={() => setFilterPanelOpen((v) => !v)} />
        </div>

        <div style={{ position: "relative", minHeight: 0, minWidth: 0 }}>
          <CatalogGrid
            mode={mode}
            sinnerSelected={selectedSinnerIndex != null}
            orderedKeys={orderedKeys}
            byIdentityKey={byIdentityKey}
            byEgoKey={byEgoKey}
            teamState={teamState}
            selectedSinnerIndex={selectedSinnerIndex}
            onPickIdentity={onPickIdentity}
            onPickEgo={onPickEgo}
          />
        </div>
      </div>

      {/* Right column wrapper so FilterPanel can overlay the right side area */}
      <div style={{ position: "relative", minHeight: 0 }}>
        {selectedSinnerIndex != null ? (
          <SelectedIdentityPanel
            sinnerIndex={selectedSinnerIndex}
            sinnerName={selectedSinnerName}
            teamState={teamState}
            identitiesByKey={byIdentityKey}
            egosByKey={byEgoKey}
          />
        ) : (
          <div
            style={{
              height: "100%",
              border: "1px solid #1e1e22",
              borderRadius: 10,
              background: "#0f0f13",
            }}
          />
        )}

        <FilterPanel
          open={filterPanelOpen}
          mode={mode}
          identityFilters={identityFilters}
          setIdentityFilters={setIdentityFilters}
          egoFilters={egoFilters}
          setEgoFilters={setEgoFilters}
          onClose={() => setFilterPanelOpen(false)}
          onClear={clearActiveFilters}
        />
      </div>
    </div>
  );
}
