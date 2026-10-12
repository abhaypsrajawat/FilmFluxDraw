import { useEffect, useRef, useState } from "react";
import { CaptureUpdateAction } from "@excalidraw/excalidraw";
import type { ExcalidrawElement, ExcalidrawFreeDrawElement } from "@excalidraw/excalidraw/element/types";
import type { AppState, ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { LASER_COLORS } from "../laser/LaserControls";
import { FILL_COLORS } from "./ToolControls";
import { fillElement, findFillTarget } from "./bucketFill";
import { shapeFromStroke } from "./drawToShape";

const LASER_COLOR_KEY = "filmfluxdraw:laser-color";
const FILL_COLOR_KEY = "filmfluxdraw:fill-color";
const BUCKET = "bucket";

const load = (key: string, fallback: string, valid: (value: string) => boolean) => {
  try {
    const saved = localStorage.getItem(key);
    if (saved && valid(saved)) return saved;
  } catch {
    // Storage can be unavailable (private mode); fall back to the default.
  }
  return fallback;
};

const save = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Not persisting a color choice is fine.
  }
};

const isHexColor = (value: string) => /^#[0-9a-f]{6}$/i.test(value);

type ToolKey = string;
const toolKey = (tool: AppState["activeTool"]): ToolKey =>
  tool.type === "custom" ? `custom:${tool.customType}` : tool.type;

/**
 * The app's own tools, layered on Excalidraw's tool state so that picking any
 * other tool (toolbar or shortcut) turns them off:
 * - Laser: Excalidraw's laser tool is active; the glow overlay draws it.
 * - Bucket fill: a custom Excalidraw tool; clicks fill the shape under them.
 * - Draw to shape: Excalidraw's pen tool; each finished stroke is replaced
 *   with the clean shape it resembles.
 */
export function useCustomTools(api: ExcalidrawImperativeAPI | null) {
  const [laserActive, setLaserActive] = useState(false);
  const [fillActive, setFillActive] = useState(false);
  const [shapePenActive, setShapePenActive] = useState(false);
  const [laserColor, setLaserColorState] = useState(() =>
    load(LASER_COLOR_KEY, LASER_COLORS[0].value, (v) => LASER_COLORS.some((c) => c.value === v)),
  );
  const [fillColor, setFillColorState] = useState(() =>
    load(FILL_COLOR_KEY, FILL_COLORS[0].value, (v) => isHexColor(v) || v === "transparent"),
  );
  const shapePenRef = useRef(false);
  shapePenRef.current = shapePenActive;
  const fillColorRef = useRef(fillColor);
  fillColorRef.current = fillColor;

  const currentTool = () => (api ? toolKey(api.getAppState().activeTool) : null);
  const leaveTool = (key: ToolKey) => {
    if (api && currentTool() === key) api.setActiveTool({ type: "selection" });
  };

  const setLaser = (active: boolean) => {
    if (!api) return;
    if (active) api.setActiveTool({ type: "laser" });
    else leaveTool("laser");
    setLaserActive(active);
  };

  const setFill = (active: boolean) => {
    if (!api) return;
    if (active) api.setActiveTool({ type: "custom", customType: BUCKET });
    else leaveTool(`custom:${BUCKET}`);
    setFillActive(active);
  };

  const setShapePen = (active: boolean) => {
    if (!api) return;
    if (active) api.setActiveTool({ type: "freedraw" });
    else leaveTool("freedraw");
    setShapePenActive(active);
  };

  // Keep each tool's on/off state in step with Excalidraw's active tool.
  const lastTool = useRef<ToolKey | null>(null);
  // Excalidraw drops back to the selection tool after a click with a custom
  // tool. When that follows a bucket click, switch the bucket straight back on.
  const bucketClickedAt = useRef(0);
  const followActiveTool = (tool: AppState["activeTool"]) => {
    const key = toolKey(tool);
    if (key === lastTool.current) return;
    if (key === "selection" && lastTool.current === `custom:${BUCKET}` && Date.now() - bucketClickedAt.current < 1000) {
      bucketClickedAt.current = 0;
      api?.setActiveTool({ type: "custom", customType: BUCKET });
      return;
    }
    lastTool.current = key;
    setLaserActive(key === "laser");
    setFillActive(key === `custom:${BUCKET}`);
    if (key !== "freedraw") setShapePenActive(false);
  };

  // --- Draw to shape: replace each finished stroke with its clean shape ---
  const pendingStroke = useRef<string | null>(null);
  const convertFinishedStroke = (elements: readonly ExcalidrawElement[], appState: AppState) => {
    const drawing = appState.newElement;
    if (drawing) {
      pendingStroke.current = shapePenRef.current && drawing.type === "freedraw" ? drawing.id : null;
      return;
    }
    const strokeId = pendingStroke.current;
    if (!strokeId || !api) return;
    pendingStroke.current = null;
    const stroke = elements.find((e) => e.id === strokeId && !e.isDeleted);
    if (stroke?.type !== "freedraw") return;
    const shape = shapeFromStroke(stroke as ExcalidrawFreeDrawElement, appState);
    if (!shape) return;
    // Its own undo step: one undo brings the freehand stroke back.
    queueMicrotask(() =>
      api.updateScene({
        elements: api.getSceneElementsIncludingDeleted().map((e) => (e.id === strokeId ? shape : e)),
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      }),
    );
  };

  const onSceneChange = (elements: readonly ExcalidrawElement[], appState: AppState) => {
    followActiveTool(appState.activeTool);
    convertFinishedStroke(elements, appState);
  };

  // --- Bucket fill ---
  const onPointerDown = (tool: AppState["activeTool"], origin: { x: number; y: number }) => {
    if (!api || toolKey(tool) !== `custom:${BUCKET}`) return;
    bucketClickedAt.current = Date.now();
    const color = fillColorRef.current;
    const elements = api.getSceneElementsIncludingDeleted();
    const target = findFillTarget(elements, [origin.x, origin.y]);
    // A click that misses every closed shape does nothing; the board's own
    // color stays in the main menu so a near-miss can't repaint the canvas.
    if (!target) return;
    const filled = fillElement(target, color);
    api.updateScene({
      elements: elements.map((e) => (e.id === target.id ? filled : e)),
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    });
  };

  // A fresh board starts with all tools off.
  useEffect(() => {
    lastTool.current = null;
  }, [api]);

  return {
    laser: {
      active: laserActive,
      set: setLaser,
      color: laserColor,
      setColor: (color: string) => {
        setLaserColorState(color);
        save(LASER_COLOR_KEY, color);
      },
    },
    fill: {
      active: fillActive,
      set: setFill,
      color: fillColor,
      setColor: (color: string) => {
        setFillColorState(color);
        save(FILL_COLOR_KEY, color);
      },
    },
    shapePen: { active: shapePenActive, set: setShapePen },
    onSceneChange,
    onPointerDown,
  };
}
