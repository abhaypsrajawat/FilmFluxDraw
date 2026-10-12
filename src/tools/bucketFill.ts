import { newElementWith } from "@excalidraw/excalidraw";
import type {
  ExcalidrawElement,
  ExcalidrawFreeDrawElement,
  ExcalidrawLinearElement,
} from "@excalidraw/excalidraw/element/types";
import { bounds, distance, pointInPolygon } from "./geometry";
import type { Point } from "./geometry";

type PathElement = ExcalidrawFreeDrawElement | ExcalidrawLinearElement;

const FILLABLE = new Set(["rectangle", "ellipse", "diamond", "line", "freedraw"]);

/** Excalidraw only paints a line/freehand fill when its ends meet within this many px. */
const LOOP_THRESHOLD = 8;

/** The click point in the element's own unrotated frame, relative to its x/y. */
function toLocal(element: ExcalidrawElement, [x, y]: Point): Point {
  const cx = element.x + element.width / 2;
  const cy = element.y + element.height / 2;
  const cos = Math.cos(-element.angle);
  const sin = Math.sin(-element.angle);
  const dx = x - cx;
  const dy = y - cy;
  return [cx + dx * cos - dy * sin - element.x, cy + dx * sin + dy * cos - element.y];
}

/** A line or freehand stroke's gap between its ends, if it's (nearly) a loop. */
function loopGap(element: PathElement): number | null {
  const points = element.points as readonly Point[];
  if (points.length < 3) return null;
  const gap = distance(points[0], points[points.length - 1]);
  const { width, height } = bounds(points);
  // Allow a gap of up to a fifth of the shape's size: the fill closes it.
  return gap <= Math.max(LOOP_THRESHOLD, Math.hypot(width, height) * 0.2) ? gap : null;
}

function contains(element: ExcalidrawElement, scenePoint: Point): boolean {
  const [px, py] = toLocal(element, scenePoint);
  const { width: w, height: h } = element;
  switch (element.type) {
    case "rectangle":
      return px >= 0 && px <= w && py >= 0 && py <= h;
    case "ellipse": {
      const nx = (px - w / 2) / (w / 2);
      const ny = (py - h / 2) / (h / 2);
      return nx * nx + ny * ny <= 1;
    }
    case "diamond":
      return Math.abs(px - w / 2) / (w / 2) + Math.abs(py - h / 2) / (h / 2) <= 1;
    case "line":
    case "freedraw":
      return loopGap(element) !== null && pointInPolygon([px, py], element.points as readonly Point[]);
    default:
      return false;
  }
}

/**
 * The shape a bucket click at `scenePoint` should fill: the smallest closed
 * shape containing the point, so clicking inside a shape that sits within
 * another fills the inner one.
 */
export function findFillTarget(elements: readonly ExcalidrawElement[], scenePoint: Point) {
  let target: ExcalidrawElement | null = null;
  let targetArea = Infinity;
  for (const element of elements) {
    if (element.isDeleted || element.locked || !FILLABLE.has(element.type)) continue;
    if (!contains(element, scenePoint)) continue;
    const area = Math.abs(element.width * element.height);
    if (area <= targetArea) {
      target = element;
      targetArea = area;
    }
  }
  return target;
}

/** A copy of `element` filled with `color`; nearly-closed strokes get their gap closed so the fill shows. */
export function fillElement(element: ExcalidrawElement, color: string): ExcalidrawElement {
  const style = { backgroundColor: color, fillStyle: "solid" as const };
  if (element.type !== "line" && element.type !== "freedraw") return newElementWith(element, style);
  const path = element as PathElement;
  const points = path.points;
  const gap = loopGap(path);
  if (gap === null || gap <= LOOP_THRESHOLD) return newElementWith(element, style);
  const closedPath = {
    ...style,
    points: [...points, points[0]],
    // Freehand strokes keep one pressure value per point.
    ...(path.type === "freedraw" && path.pressures.length
      ? { pressures: [...path.pressures, path.pressures[0]] }
      : {}),
  };
  return newElementWith(path, closedPath as Partial<PathElement>);
}
