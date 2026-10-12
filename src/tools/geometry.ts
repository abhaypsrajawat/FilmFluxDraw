export type Point = readonly [number, number];

export const distance = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]);

export function pathLength(points: readonly Point[]) {
  let length = 0;
  for (let i = 1; i < points.length; i++) length += distance(points[i - 1], points[i]);
  return length;
}

export function bounds(points: readonly Point[]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of points) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

export function distanceToSegment(p: Point, a: Point, b: Point) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return distance(p, a);
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lengthSq));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

/** Distance from `p` to the outline of a closed polygon. */
export function distanceToPolygon(p: Point, polygon: readonly Point[]) {
  let best = Infinity;
  for (let i = 0; i < polygon.length; i++) {
    best = Math.min(best, distanceToSegment(p, polygon[i], polygon[(i + 1) % polygon.length]));
  }
  return best;
}

/** Even-odd test: is `p` inside the closed polygon? */
export function pointInPolygon(p: Point, polygon: readonly Point[]) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/** `count` points spaced evenly along the path. */
export function resample(points: readonly Point[], count: number): Point[] {
  const total = pathLength(points);
  if (total === 0) return [points[0]];
  const step = total / (count - 1);
  const result: Point[] = [points[0]];
  let carried = 0;
  for (let i = 1; i < points.length; i++) {
    let a = points[i - 1];
    const b = points[i];
    let segment = distance(a, b);
    while (carried + segment >= step && result.length < count) {
      const t = (step - carried) / segment;
      const next: Point = [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
      result.push(next);
      segment = distance(next, b);
      a = next;
      carried = 0;
    }
    carried += segment;
  }
  while (result.length < count) result.push(points[points.length - 1]);
  return result;
}

/** Ramer–Douglas–Peucker simplification of an open path. */
export function simplify(points: readonly Point[], epsilon: number): Point[] {
  if (points.length < 3) return [...points];
  let index = 0;
  let farthest = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = distanceToSegment(points[i], points[0], points[points.length - 1]);
    if (d > farthest) {
      farthest = d;
      index = i;
    }
  }
  if (farthest <= epsilon) return [points[0], points[points.length - 1]];
  const left = simplify(points.slice(0, index + 1), epsilon);
  const right = simplify(points.slice(index), epsilon);
  return [...left.slice(0, -1), ...right];
}

/** Corner points of a closed loop: simplifies it from its two most distant points. */
export function simplifyLoop(points: readonly Point[], epsilon: number): Point[] {
  const start = points[0];
  let split = 0;
  let farthest = 0;
  points.forEach((p, i) => {
    const d = distance(p, start);
    if (d > farthest) {
      farthest = d;
      split = i;
    }
  });
  const first = simplify(points.slice(0, split + 1), epsilon);
  const second = simplify([...points.slice(split), start], epsilon);
  return [...first.slice(0, -1), ...second.slice(0, -1)];
}
