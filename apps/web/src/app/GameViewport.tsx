import React, { useLayoutEffect, useState } from "react";

const DESIGN_WIDTH = 1920;
const DESIGN_HEIGHT = 1080;

type ViewportSize = {
  width: number;
  height: number;
};

function readViewport(): ViewportSize {
  return {
    width: document.documentElement.clientWidth || window.innerWidth,
    height: document.documentElement.clientHeight || window.innerHeight,
  };
}

export default function GameViewport(props: { children: React.ReactNode }) {
  const { children } = props;
  const [viewport, setViewport] = useState<ViewportSize>(() => readViewport());

  useLayoutEffect(() => {
    const update = () => setViewport(readViewport());

    update();
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("resize", update);
    };
  }, []);

  const scale = Number(Math.min(viewport.width / DESIGN_WIDTH, viewport.height / DESIGN_HEIGHT).toFixed(5));
  const scaledWidth = DESIGN_WIDTH * scale;
  const scaledHeight = DESIGN_HEIGHT * scale;

  return (
    <div className="game-viewport">
      <div
        className="game-stage"
        style={{
          width: DESIGN_WIDTH,
          height: DESIGN_HEIGHT,
          transform: `translate3d(${Math.round((viewport.width - scaledWidth) / 2)}px, ${Math.round(
            (viewport.height - scaledHeight) / 2,
          )}px, 0) scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
