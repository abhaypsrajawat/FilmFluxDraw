import { useEffect, useRef } from "react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { CanvasBackground } from "../workspace/types";

/** Grid spacing in scene units, matching Excalidraw's own grid size. */
const GRID_SIZE = 20;
/** Below this on-screen spacing (px) the grid doubles its spacing so it doesn't turn into noise. */
const MIN_SCREEN_SPACING = 12;

type Props = {
  api: ExcalidrawImperativeAPI;
  background: CanvasBackground;
  /** The board's paper color, painted under the pattern. */
  paperColor: string;
};

/**
 * Paints the dotted or lined grid behind Excalidraw's canvas, kept in step
 * with scroll and zoom. Excalidraw's own background is made transparent while
 * a pattern is shown, so the paper color is painted here instead.
 *
 * Rendered inside the `.excalidraw` container so it picks up the same
 * dark-mode color inversion as the canvas.
 */
export function CanvasGrid({ api, background, paperColor }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = ref.current!;
    const update = (scrollX: number, scrollY: number, zoom: number) => {
      let spacing = GRID_SIZE * zoom;
      while (spacing < MIN_SCREEN_SPACING) spacing *= 2;
      // A scene point p is drawn at (p + scroll) * zoom.
      const offsetX = (((scrollX * zoom) % spacing) + spacing) % spacing;
      const offsetY = (((scrollY * zoom) % spacing) + spacing) % spacing;
      layer.style.setProperty("--grid-spacing", `${spacing}px`);
      layer.style.setProperty("--grid-offset", `${offsetX}px ${offsetY}px`);
    };
    const { scrollX, scrollY, zoom } = api.getAppState();
    update(scrollX, scrollY, zoom.value);
    return api.onScrollChange((x, y, z) => update(x, y, z.value));
  }, [api]);

  return (
    <div
      ref={ref}
      className="canvas-grid"
      data-background={background}
      style={{ backgroundColor: paperColor }}
      aria-hidden="true"
    />
  );
}
