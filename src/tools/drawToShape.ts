import { ROUNDNESS, convertToExcalidrawElements } from "@excalidraw/excalidraw";
import type { ExcalidrawElementSkeleton } from "@excalidraw/excalidraw/data/transform";
import type { ExcalidrawElement, ExcalidrawFreeDrawElement } from "@excalidraw/excalidraw/element/types";
import type { AppState } from "@excalidraw/excalidraw/types";
import { recognizeShape } from "./recognizeShape";
import type { Point } from "./geometry";

/**
 * The clean shape a freehand stroke was meant to be, styled like the stroke,
 * or null when the stroke doesn't clearly match a shape.
 */
export function shapeFromStroke(stroke: ExcalidrawFreeDrawElement, appState: AppState): ExcalidrawElement | null {
  const absolute: Point[] = stroke.points.map(([x, y]) => [stroke.x + x, stroke.y + y]);
  const shape = recognizeShape(absolute);
  if (!shape) return null;

  const style = {
    strokeColor: stroke.strokeColor,
    backgroundColor: stroke.backgroundColor,
    fillStyle: stroke.fillStyle,
    strokeWidth: stroke.strokeWidth,
    strokeStyle: appState.currentItemStrokeStyle,
    roughness: appState.currentItemRoughness,
    opacity: stroke.opacity,
    groupIds: [...stroke.groupIds],
    frameId: stroke.frameId,
  };
  const rounded = appState.currentItemRoundness === "round";

  let skeleton: ExcalidrawElementSkeleton;
  if (shape.type === "line") {
    const [x, y] = shape.points[0];
    skeleton = {
      ...style,
      type: "line",
      x,
      y,
      points: shape.points.map(([px, py]) => [px - x, py - y] as [number, number]),
    } as ExcalidrawElementSkeleton;
  } else {
    const roundness =
      shape.type === "rectangle" && rounded
        ? { type: ROUNDNESS.ADAPTIVE_RADIUS }
        : shape.type === "diamond" && rounded
          ? { type: ROUNDNESS.PROPORTIONAL_RADIUS }
          : null;
    skeleton = {
      ...style,
      type: shape.type,
      x: shape.x,
      y: shape.y,
      width: Math.max(1, shape.width),
      height: Math.max(1, shape.height),
      roundness,
    } as ExcalidrawElementSkeleton;
  }
  return convertToExcalidrawElements([skeleton])[0] ?? null;
}
