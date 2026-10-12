import {
  bounds,
  distance,
  distanceToPolygon,
  pathLength,
  resample,
  simplifyLoop,
} from "./geometry";
import type { Point } from "./geometry";

export type RecognizedShape =
  | { type: "rectangle" | "ellipse" | "diamond"; x: number; y: number; width: number; height: number }
  /** An open line or a closed polygon (triangle), in absolute scene coordinates. */
  | { type: "line"; points: Point[]; closed: boolean };

/** Mean distance from the stroke to a candidate outline, relative to the stroke's size. */
const fitError = (samples: readonly Point[], outline: readonly Point[], size: number) =>
  samples.reduce((sum, p) => sum + distanceToPolygon(p, outline), 0) / samples.length / size;

const ellipseOutline = (cx: number, cy: number, rx: number, ry: number): Point[] =>
  Array.from({ length: 48 }, (_, i) => {
    const angle = (i / 48) * Math.PI * 2;
    return [cx + rx * Math.cos(angle), cy + ry * Math.sin(angle)];
  });

/** Snaps a line's angle to horizontal, vertical or 45° when it is within a few degrees. */
function snapLine(a: Point, b: Point): Point {
  const length = distance(a, b);
  const angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const step = Math.PI / 4;
  const snapped = Math.round(angle / step) * step;
  const use = Math.abs(angle - snapped) < (7 * Math.PI) / 180 ? snapped : angle;
  return [a[0] + length * Math.cos(use), a[1] + length * Math.sin(use)];
}

/** Largest error (relative to size) still accepted as a clean shape. */
const MAX_ERROR = 0.06;

/**
 * Turns a freehand stroke into the clean shape it most looks like: a
 * rectangle, ellipse, diamond, triangle or straight line. Returns null when the
 * stroke doesn't clearly match one (handwriting, scribbles), so it stays as drawn.
 */
export function recognizeShape(stroke: readonly Point[]): RecognizedShape | null {
  if (stroke.length < 4) return null;
  const box = bounds(stroke);
  const size = Math.hypot(box.width, box.height);
  if (size < 12) return null;

  const length = pathLength(stroke);
  const first = stroke[0];
  const last = stroke[stroke.length - 1];
  const gap = distance(first, last);

  // A loop is closed if it ends near its start or runs back over its first
  // stretch (people often overshoot when closing a circle).
  const opening = stroke.slice(0, Math.max(2, Math.round(stroke.length * 0.3)));
  const closed =
    gap <= size * 0.3 || opening.some((p) => distance(p, last) <= size * 0.12);

  // Open stroke: only a clearly straight one becomes a line.
  if (!closed) {
    if (gap / length > 0.92) {
      return { type: "line", points: [first, snapLine(first, last)], closed: false };
    }
    return null;
  }

  // Closed stroke: compare it against each candidate outline.
  if (length < size * 1.6) return null; // a short out-and-back flick, not a loop
  const samples = resample([...stroke, first], 64);
  const { minX, minY, maxX, maxY, width, height } = box;
  const cx = minX + width / 2;
  const cy = minY + height / 2;

  const corners = simplifyLoop(samples.slice(0, -1), size * 0.07);
  // Judge the fit against the shape's area-based size, so a big lumpy loop
  // isn't excused by its long diagonal.
  const scale = Math.sqrt(width * height) || size;
  const errors: { shape: RecognizedShape; error: number }[] = [
    {
      shape: { type: "ellipse", x: minX, y: minY, width, height },
      error: fitError(samples, ellipseOutline(cx, cy, width / 2, height / 2), scale),
    },
    {
      shape: { type: "rectangle", x: minX, y: minY, width, height },
      error: fitError(samples, [[minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY]], scale),
    },
    {
      shape: { type: "diamond", x: minX, y: minY, width, height },
      error: fitError(samples, [[cx, minY], [maxX, cy], [cx, maxY], [minX, cy]], scale),
    },
  ];
  if (corners.length === 3) {
    errors.push({
      shape: { type: "line", points: [...corners, corners[0]], closed: true },
      error: fitError(samples, corners, scale),
    });
  }

  const best = errors.reduce((a, b) => (b.error < a.error ? b : a));
  return best.error <= MAX_ERROR ? best.shape : null;
}

