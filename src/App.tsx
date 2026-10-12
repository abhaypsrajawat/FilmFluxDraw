import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Excalidraw } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { GlowLaser } from "./laser/GlowLaser";
import { LaserControls, LASER_COLORS } from "./laser/LaserControls";
import { useLaserShortcut } from "./laser/useLaserShortcut";

const COLOR_KEY = "filmfluxdraw:laser-color";

const loadColor = () => {
  try {
    const saved = localStorage.getItem(COLOR_KEY);
    if (saved && LASER_COLORS.some((c) => c.value === saved)) return saved;
  } catch {
    // Storage can be unavailable (private mode); fall back to the default.
  }
  return LASER_COLORS[0].value;
};

export default function App() {
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const [laserActive, setLaserActive] = useState(false);
  const [laserColor, setLaserColor] = useState(loadColor);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // The overlay is portaled into Excalidraw's own container so wheel
  // events (zoom/pan) bubble to Excalidraw while the laser is on.
  useEffect(() => {
    if (api) setContainer(wrapperRef.current?.querySelector<HTMLElement>(".excalidraw") ?? null);
  }, [api]);

  const setLaser = useCallback(
    (active: boolean) => {
      // Drop out of any in-progress Excalidraw tool so nothing is half-drawn.
      if (active) api?.setActiveTool({ type: "selection" });
      setLaserActive(active);
    },
    [api],
  );

  useLaserShortcut(laserActive, setLaser);

  const chooseColor = (color: string) => {
    setLaserColor(color);
    try {
      localStorage.setItem(COLOR_KEY, color);
    } catch {
      // Not persisting the color is fine.
    }
  };

  return (
    <div ref={wrapperRef} className="app">
      <Excalidraw
        excalidrawAPI={setApi}
        onChange={(_elements, appState) => {
          // Picking Excalidraw's built-in laser switches to the glowing one instead.
          if (appState.activeTool.type === "laser") setLaser(true);
        }}
        renderTopRightUI={() => (
          <LaserControls
            active={laserActive}
            color={laserColor}
            onToggle={() => setLaser(!laserActive)}
            onColorChange={chooseColor}
          />
        )}
      />
      {container && createPortal(<GlowLaser active={laserActive} color={laserColor} />, container)}
    </div>
  );
}
