import { useEffect, useRef } from "react";

type Point = { x: number; y: number; t: number };
type Stroke = { points: Point[] };

/** How long (ms) a point of the trail stays visible before it has fully decayed. */
const TRAIL_LIFETIME = 1000;
/** Max width (CSS px) of the colored core at the head of the trail. */
const CORE_WIDTH = 10;
/** Radius (CSS px) of the glowing dot that follows the pointer. */
const DOT_RADIUS = 8;

type Props = {
  active: boolean;
  color: string;
};

/**
 * A canvas overlay that replaces Excalidraw's laser pointer with a brighter,
 * glowing one. While `active`, it covers the drawing canvas and swallows
 * pointer input (so nothing gets drawn), shows a glowing dot at the pointer
 * and leaves a fading neon trail while the pointer is pressed.
 *
 * It must be rendered inside the `.excalidraw` container so wheel events
 * bubble to Excalidraw and zoom/pan keep working.
 */
export function GlowLaser({ active, color }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef(new Map<number, Stroke>());
  const finishedRef = useRef<Stroke[]>([]);
  const cursorRef = useRef<{ x: number; y: number } | null>(null);
  const colorRef = useRef(color);
  colorRef.current = color;

  // Keep the canvas backing store in sync with its CSS size and the DPR.
  useEffect(() => {
    const canvas = canvasRef.current!;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!active) {
      strokesRef.current.clear();
      cursorRef.current = null;
    }
  }, [active]);

  // Render loop: runs while the laser is active or a trail is still fading out.
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const core = document.createElement("canvas");
    const coreCtx = core.getContext("2d")!;
    let frame = 0;

    const render = () => {
      const now = performance.now();
      const dpr = window.devicePixelRatio || 1;
      const strokes = [...finishedRef.current, ...strokesRef.current.values()];

      for (const stroke of strokes) {
        while (stroke.points.length && now - stroke.points[0].t > TRAIL_LIFETIME) {
          stroke.points.shift();
        }
      }
      finishedRef.current = finishedRef.current.filter((s) => s.points.length);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const hasTrail = strokes.some((s) => s.points.length);
      if (hasTrail) {
        if (core.width !== canvas.width || core.height !== canvas.height) {
          core.width = canvas.width;
          core.height = canvas.height;
        }
        coreCtx.setTransform(1, 0, 0, 1, 0, 0);
        coreCtx.clearRect(0, 0, core.width, core.height);
        coreCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        // Colored tapered core, then a thinner white-hot center on top.
        drawTaperedStrokes(coreCtx, strokes, now, colorRef.current, CORE_WIDTH);
        drawTaperedStrokes(coreCtx, strokes, now, "#ffffff", CORE_WIDTH * 0.4);

        // Composite the core several times with colored shadows to build the glow.
        ctx.shadowColor = colorRef.current;
        for (const blur of [48, 28, 14, 4]) {
          ctx.shadowBlur = blur * dpr;
          ctx.drawImage(core, 0, 0);
        }
        ctx.shadowBlur = 0;
      }

      const cursor = cursorRef.current;
      if (active && cursor) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawDot(ctx, cursor.x, cursor.y, colorRef.current, dpr);
      }

      if (active || hasTrail) {
        frame = requestAnimationFrame(render);
      } else {
        frame = 0;
      }
    };

    frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, [active]);

  const localPoint = (event: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const onPointerDown = (event: React.PointerEvent) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const p = localPoint(event);
    cursorRef.current = p;
    strokesRef.current.set(event.pointerId, {
      points: [{ ...p, t: performance.now() }],
    });
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const p = localPoint(event);
    cursorRef.current = p;
    const stroke = strokesRef.current.get(event.pointerId);
    if (!stroke) return;
    // Coalesced events give a smooth trail on fast movements.
    const coalesced = event.nativeEvent.getCoalescedEvents?.() ?? [];
    const rect = canvasRef.current!.getBoundingClientRect();
    for (const e of coalesced.length ? coalesced : [event.nativeEvent]) {
      stroke.points.push({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        t: performance.now(),
      });
    }
  };

  const endStroke = (event: React.PointerEvent) => {
    const stroke = strokesRef.current.get(event.pointerId);
    if (!stroke) return;
    strokesRef.current.delete(event.pointerId);
    finishedRef.current.push(stroke);
    if (event.pointerType !== "mouse") cursorRef.current = null;
  };

  return (
    <canvas
      ref={canvasRef}
      className="glow-laser"
      data-active={active}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endStroke}
      onPointerCancel={endStroke}
      onPointerLeave={() => {
        if (!strokesRef.current.size) cursorRef.current = null;
      }}
      onContextMenu={(e) => active && e.preventDefault()}
    />
  );
}

function drawTaperedStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: Stroke[],
  now: number,
  color: string,
  maxWidth: number,
) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const { points } of strokes) {
    if (points.length === 1) {
      const life = 1 - (now - points[0].t) / TRAIL_LIFETIME;
      ctx.beginPath();
      ctx.arc(points[0].x, points[0].y, (maxWidth * life) / 2, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      // Older segments are thinner, so the tail tapers away to nothing.
      const life = Math.max(0, 1 - (now - b.t) / TRAIL_LIFETIME);
      if (life <= 0) continue;
      ctx.lineWidth = Math.max(0.5, maxWidth * life);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }
}

function drawDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  dpr: number,
) {
  // Soft outer halo.
  const halo = ctx.createRadialGradient(x, y, 0, x, y, DOT_RADIUS * 4);
  halo.addColorStop(0, withAlpha(color, 0.55));
  halo.addColorStop(0.4, withAlpha(color, 0.2));
  halo.addColorStop(1, withAlpha(color, 0));
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(x, y, DOT_RADIUS * 4, 0, Math.PI * 2);
  ctx.fill();

  // Glowing colored body with a white-hot center.
  ctx.shadowColor = color;
  ctx.shadowBlur = 20 * dpr;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x, y, DOT_RADIUS * 0.45, 0, Math.PI * 2);
  ctx.fill();
}

/** `color` must be a 6-digit hex string. */
function withAlpha(color: string, alpha: number) {
  const n = parseInt(color.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}
