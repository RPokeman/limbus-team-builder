// apps/web/src/screens/selector/CatalogGrid.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { EgoRecord, IdentityRecord, TeamState, EgoTier } from "@limbus/core/types";
import { VerticalDragScroll } from "../../components/VerticalDragScroll";
import { egoIconUrl, identityPortraitUrl, rarityBorderUrl } from "../../assets";
import { SINNER_ORDER } from "@limbus/core/types";

function getName(rec: any): string {
  return String(rec?.name ?? rec?.page ?? "");
}

function getTier(rec: any): EgoTier {
  return (rec?.tier as EgoTier) ?? "ZAYIN";
}

function getSinnerName(rec: any): string {
  return String(rec?.sinner ?? "");
}

function getRarity(rec: any): number {
  return Number(rec?.rarity ?? 1);
}

function getIdentityKey(rec: any): string {
  return String(rec?.page ?? rec?.key ?? rec?.id ?? "");
}

function getEgoKey(rec: any): string {
  return String(rec?.page ?? rec?.key ?? rec?.id ?? "");
}

function sinnerIndexFromName(name: string): number | null {
  const idx = SINNER_ORDER.indexOf(name as any);
  return idx >= 0 ? idx : null;
}

function LazyImg(props: {
  src: string;
  alt: string;
  style: React.CSSProperties;
  loading?: "lazy" | "eager";
}) {
  const { src, alt, style, loading = "lazy" } = props;
  const ref = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (shouldLoad) return;

    // Fallback: load immediately if IO isn't available.
    if (typeof IntersectionObserver === "undefined") {
      setShouldLoad(true);
      return;
    }

    const el = ref.current;
    if (!el) {
      setShouldLoad(true);
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShouldLoad(true);
            obs.disconnect();
            return;
          }
        }
      },
      // Start loading a bit before it scrolls into view to avoid pop-in.
      { root: null, rootMargin: "600px 0px", threshold: 0.01 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [shouldLoad]);

  return (
    <div ref={ref} style={{ position: "absolute", inset: 0 }}>
      {shouldLoad ? (
        <img
          src={src}
          alt={alt}
          draggable={false}
          loading={loading}
          decoding="async"
          referrerPolicy="no-referrer"
          style={style}
        />
      ) : null}
    </div>
  );
}

export function CatalogGrid(props: {
  mode: "identities" | "ego";
  sinnerSelected: boolean;

  orderedKeys: string[];
  byIdentityKey: Map<string, IdentityRecord>;
  byEgoKey: Map<string, EgoRecord>;

  teamState: TeamState;
  selectedSinnerIndex: number | null;

  onPickIdentity: (key: string) => void;
  onPickEgo: (key: string) => void;
}) {
  const {
    mode,
    sinnerSelected,
    orderedKeys,
    byIdentityKey,
    byEgoKey,
    teamState,
    selectedSinnerIndex,
    onPickIdentity,
    onPickEgo,
  } = props;

  const selectedIdentityKey = useMemo(() => {
    if (selectedSinnerIndex == null) return "";
    return teamState.slots[selectedSinnerIndex]?.identityKey ?? "";
  }, [teamState, selectedSinnerIndex]);

  const selectedEgos = useMemo(() => {
    if (selectedSinnerIndex == null) return {};
    return (teamState.slots[selectedSinnerIndex]?.egos ?? {}) as any;
  }, [teamState, selectedSinnerIndex]);

  const isIdentityActive = (rec: any, key: string) => {
    if (sinnerSelected) return key === selectedIdentityKey;
    const idx = sinnerIndexFromName(getSinnerName(rec));
    if (idx == null) return false;
    return (teamState.slots[idx]?.identityKey ?? "") === key;
  };

  const isEgoActive = (rec: any, key: string) => {
    const tier = getTier(rec);
    if (sinnerSelected) return key === String(selectedEgos?.[tier] ?? "");
    const idx = sinnerIndexFromName(getSinnerName(rec));
    if (idx == null) return false;
    const cur = (teamState.slots[idx]?.egos ?? {}) as any;
    return String(cur[tier] ?? "") === key;
  };

  return (
    <div style={{ padding: 12 }}>
      <VerticalDragScroll height={"calc(100vh - 54px - 24px - 24px)"}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
            gap: 10,
            paddingRight: 6,
          }}
        >
          {orderedKeys.map((key) => {
            if (mode === "identities") {
              const rec: any = byIdentityKey.get(key);
              if (!rec) return null;

              const active = isIdentityActive(rec, key);
              const portrait = identityPortraitUrl(getIdentityKey(rec));
              const border = rarityBorderUrl(getRarity(rec));

              return (
                <button
                  key={key}
                  onClick={() => onPickIdentity(key)}
                  style={cardStyle(active, true)}
                  title={getName(rec)}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      aspectRatio: "333 / 465",
                      borderRadius: 12,
                      overflow: "hidden",
                      background: "#0b0b0d",
                    }}
                  >
                    <LazyImg
                      src={portrait}
                      alt={getName(rec)}
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        userSelect: "none",
                        pointerEvents: "none",
                      }}
                    />

                    <img
                      src={border}
                      alt=""
                      draggable={false}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "fill",
                        userSelect: "none",
                        pointerEvents: "none",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      marginTop: 8,
                      fontWeight: 900,
                      fontSize: 12,
                      lineHeight: 1.2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {getName(rec)}
                  </div>
                </button>
              );
            }

            const rec: any = byEgoKey.get(key);
            if (!rec) return null;

            const tier = getTier(rec);
            const active = isEgoActive(rec, key);
            const icon = egoIconUrl(getEgoKey(rec));

            return (
              <button key={key} onClick={() => onPickEgo(key)} style={cardStyle(active, true)} title={getName(rec)}>
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "1 / 1",
                    borderRadius: 12,
                    overflow: "hidden",
                    background: "#0b0b0d",
                  }}
                >
                  <LazyImg
                    src={icon}
                    alt={getName(rec)}
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      userSelect: "none",
                      pointerEvents: "none",
                    }}
                  />

                  <div
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      padding: "4px 8px",
                      borderRadius: 999,
                      background: "rgba(0,0,0,0.65)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      fontWeight: 900,
                      fontSize: 11,
                      letterSpacing: 0.2,
                      pointerEvents: "none",
                    }}
                  >
                    {tier}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 8,
                    fontWeight: 900,
                    fontSize: 12,
                    lineHeight: 1.2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {getName(rec)}
                </div>
              </button>
            );
          })}
        </div>
      </VerticalDragScroll>
    </div>
  );
}

function cardStyle(active: boolean, enabled: boolean): React.CSSProperties {
  return {
    padding: 10,
    borderRadius: 14,
    border: `1px solid ${active ? "#ffb84d" : "#2a2a33"}`,
    background: active ? "rgba(255,184,77,0.08)" : "#101015",
    color: "#eee",
    cursor: enabled ? "pointer" : "default",
    opacity: enabled ? 1 : 0.75,
    textAlign: "left",
  };
}
