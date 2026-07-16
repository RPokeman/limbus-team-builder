// apps/web/src/components/VerticalDragScroll.tsx
import React, { useEffect, useRef, useState } from "react";

type Props = {
  height: number | string;
  children: React.ReactNode;
};

export function VerticalDragScroll({ height, children }: Props) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const HOLD_MS = 100;

  const dragRef = useRef<{
    dragging: boolean;
    suppressClick: boolean;
    startY: number;
    startOffset: number;
    pointerId: number;
    holdTimer: ReturnType<typeof setTimeout> | null;
  }>({
    dragging: false,
    suppressClick: false,
    startY: 0,
    startOffset: 0,
    pointerId: -1,
    holdTimer: null,
  });

  const clearHoldTimer = () => {
    if (dragRef.current.holdTimer) {
      clearTimeout(dragRef.current.holdTimer);
      dragRef.current.holdTimer = null;
    }
  };

  const clamp = (y: number) => {
    const vp = viewportRef.current;
    const ct = contentRef.current;
    if (!vp || !ct) return { y, min: 0, max: 0 };

    const max = 0;
    const min = Math.min(0, vp.clientHeight - ct.scrollHeight);
    return { y: Math.max(min, Math.min(max, y)), min, max };
  };

  const damp = (y: number, min: number, max: number) => {
    // rubber band outside bounds
    const k = 160;
    if (y > max) {
      const over = y - max;
      return max + over * (1 / (1 + over / k));
    }
    if (y < min) {
      const over = min - y;
      return min - over * (1 / (1 + over / k));
    }
    return y;
  };

  const animateTo = (target: number) => {
    const start = offsetY;
    const duration = 180;
    const t0 = performance.now();
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      setOffsetY(start + (target - start) * ease(t));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const snapToBounds = () => {
    const vp = viewportRef.current;
    const ct = contentRef.current;
    if (!vp || !ct) return;

    const max = 0;
    const min = Math.min(0, vp.clientHeight - ct.scrollHeight);

    if (offsetY > max) animateTo(max);
    else if (offsetY < min) animateTo(min);
  };

  // Suppress clicks only when we actually entered drag mode (long-press).
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;

    const onClickCapture = (e: MouseEvent) => {
      if (dragRef.current.suppressClick) {
        e.preventDefault();
        e.stopPropagation();
        dragRef.current.suppressClick = false;
      }
    };

    vp.addEventListener("click", onClickCapture, true);
    return () => vp.removeEventListener("click", onClickCapture, true);
  }, []);

  return (
    <div
      ref={viewportRef}
      style={{
        height,
        overflow: "hidden",
        position: "relative",
        userSelect: isDragging ? "none" : "auto",
        touchAction: "none",
      }}
      onPointerDown={(e) => {
        // left click / primary touch only
        if ((e as any).button != null && (e as any).button !== 0) return;

        clearHoldTimer();

        dragRef.current.pointerId = e.pointerId;
        dragRef.current.startY = e.clientY;
        dragRef.current.startOffset = offsetY;

        dragRef.current.dragging = false;
        dragRef.current.suppressClick = false;
        setIsDragging(false);

        const currentTarget = e.currentTarget;

        // Enter drag mode only if we are still holding after HOLD_MS.
        dragRef.current.holdTimer = setTimeout(() => {
          if (dragRef.current.pointerId !== e.pointerId) return;

          dragRef.current.dragging = true;
          dragRef.current.suppressClick = true;
          setIsDragging(true);

          try {
            (currentTarget as any).setPointerCapture?.(e.pointerId);
          } catch {
            // ignore
          }
        }, HOLD_MS);
      }}
      onPointerMove={(e) => {
        if (dragRef.current.pointerId !== e.pointerId) return;
        if (!dragRef.current.dragging) return;

        const dy = e.clientY - dragRef.current.startY;

        const raw = dragRef.current.startOffset + dy;
        const { min, max } = clamp(raw);
        setOffsetY(damp(raw, min, max));
      }}
      onPointerUp={(e) => {
        if (dragRef.current.pointerId !== e.pointerId) return;

        clearHoldTimer();

        const wasDragging = dragRef.current.dragging;

        dragRef.current.dragging = false;
        setIsDragging(false);

        if (wasDragging) snapToBounds();
      }}
      onPointerCancel={(e) => {
        if (dragRef.current.pointerId !== e.pointerId) return;

        clearHoldTimer();

        const wasDragging = dragRef.current.dragging;

        dragRef.current.dragging = false;
        setIsDragging(false);

        if (wasDragging) snapToBounds();
      }}
      onWheel={(e) => {
        // Enable wheel scrolling within the drag viewport
        e.preventDefault();
        const delta = e.deltaY;

        const raw = offsetY - delta;
        const { min, max } = clamp(raw);
        setOffsetY(damp(raw, min, max));
      }}
    >
      <div
        ref={contentRef}
        style={{
          transform: `translateY(${offsetY}px)`,
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
}
