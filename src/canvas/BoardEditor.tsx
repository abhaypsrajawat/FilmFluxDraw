import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CaptureUpdateAction,
  Excalidraw,
  MainMenu,
  WelcomeScreen,
  getSceneVersion,
} from "@excalidraw/excalidraw";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { AppState, BinaryFiles, ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { GlowLaser } from "../laser/GlowLaser";
import { LaserControls } from "../laser/LaserControls";
import { FillControls, ShapePenButton } from "../tools/ToolControls";
import { useCustomTools } from "../tools/useCustomTools";
import { useToolShortcuts } from "../tools/useToolShortcuts";
import { loadScene, saveScene } from "../workspace/sceneStorage";
import type { StoredScene } from "../workspace/sceneStorage";
import type { BoardNode, CanvasBackground } from "../workspace/types";
import { BlankIcon, DotsIcon, GridIcon } from "../workspace/icons";
import { CanvasGrid } from "./CanvasGrid";
import { LogoMark, Wordmark } from "../brand/Logo";

const SAVE_DELAY = 400;
const DEFAULT_PAPER = "#ffffff";

export type Theme = "light" | "dark";

const BACKGROUNDS: { value: CanvasBackground; label: string; Icon: typeof DotsIcon }[] = [
  { value: "dots", label: "Dots", Icon: DotsIcon },
  { value: "grid", label: "Grid", Icon: GridIcon },
  { value: "blank", label: "Blank", Icon: BlankIcon },
];

type Props = {
  board: BoardNode;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onBackgroundChange: (background: CanvasBackground) => void;
};

/** Loads a board's saved drawing, then shows the editor for it. */
export function BoardEditor(props: Props) {
  const [scene, setScene] = useState<StoredScene | null | undefined>(undefined);

  useEffect(() => {
    let current = true;
    loadScene(props.board.id).then((loaded) => current && setScene(loaded));
    return () => {
      current = false;
    };
  }, [props.board.id]);

  if (scene === undefined) return <div className="board-loading" aria-busy="true" />;
  return <Editor {...props} scene={scene} />;
}

function Editor({
  board,
  theme,
  onThemeChange,
  onBackgroundChange,
  scene,
}: Props & { scene: StoredScene | null }) {
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const tools = useCustomTools(api);
  useToolShortcuts({ k: tools.laser, b: tools.fill, w: tools.shapePen });
  const [paperColor, setPaperColor] = useState(
    scene?.appState.viewBackgroundColor ?? DEFAULT_PAPER,
  );
  const wrapperRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef(paperColor);
  const backgroundRef = useRef(board.background);
  backgroundRef.current = board.background;

  // Excalidraw only reads initialData once, so build it once.
  const [initialData] = useState(() => ({
    elements: scene?.elements ?? [],
    files: scene?.files ?? {},
    appState: {
      ...scene?.appState,
      theme,
      viewBackgroundColor: board.background === "blank" ? paperColor : "transparent",
    },
  }));

  // --- Saving -------------------------------------------------------------
  const pendingSave = useRef<StoredScene | null>(null);
  const saveTimer = useRef<number>();
  const lastSavedKey = useRef<string>("");

  const flushSave = useCallback(() => {
    window.clearTimeout(saveTimer.current);
    if (pendingSave.current) {
      void saveScene(board.id, pendingSave.current);
      pendingSave.current = null;
    }
  }, [board.id]);

  useEffect(() => {
    const onHide = () => document.visibilityState === "hidden" && flushSave();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flushSave);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flushSave);
      flushSave();
    };
  }, [flushSave]);

  const scheduleSave = (
    elements: readonly ExcalidrawElement[],
    appState: AppState,
    files: BinaryFiles,
  ) => {
    const { scrollX, scrollY, zoom } = appState;
    const key = [
      getSceneVersion(elements),
      Object.keys(files).length,
      paperRef.current,
      scrollX,
      scrollY,
      zoom.value,
    ].join("|");
    if (key === lastSavedKey.current) return;
    lastSavedKey.current = key;
    pendingSave.current = {
      elements: elements.filter((element) => !element.isDeleted),
      files,
      appState: { viewBackgroundColor: paperRef.current, scrollX, scrollY, zoom },
    };
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(flushSave, SAVE_DELAY);
  };

  // --- Canvas background --------------------------------------------------
  // While dots or grid are shown, Excalidraw's own background stays transparent
  // so the pattern shows through; the paper color is painted by CanvasGrid.
  useEffect(() => {
    api?.updateScene({
      appState: {
        viewBackgroundColor: board.background === "blank" ? paperRef.current : "transparent",
      },
      captureUpdate: CaptureUpdateAction.NEVER,
    });
  }, [api, board.background]);

  const trackPaperColor = (color: string) => {
    if (backgroundRef.current === "blank") {
      paperRef.current = color;
      setPaperColor(color);
    } else if (color !== "transparent") {
      // Picked a canvas color while a pattern is on: use it as the paper.
      paperRef.current = color;
      setPaperColor(color);
      queueMicrotask(() =>
        api?.updateScene({
          appState: { viewBackgroundColor: "transparent" },
          captureUpdate: CaptureUpdateAction.NEVER,
        }),
      );
    }
  };

  // --- Laser --------------------------------------------------------------
  // The overlays are portaled into Excalidraw's own container, so wheel events
  // reach Excalidraw and dark mode styling applies to them.
  useEffect(() => {
    if (api) setContainer(wrapperRef.current?.querySelector<HTMLElement>(".excalidraw") ?? null);
  }, [api]);

  return (
    <div
      ref={wrapperRef}
      className="board-editor"
      data-tool={tools.fill.active ? "bucket" : undefined}
    >
      <Excalidraw
        excalidrawAPI={setApi}
        initialData={initialData}
        onChange={(elements, appState, files) => {
          tools.onSceneChange(elements, appState);
          if (appState.theme !== theme) onThemeChange(appState.theme);
          if (appState.viewBackgroundColor !== paperRef.current) {
            trackPaperColor(appState.viewBackgroundColor);
          }
          scheduleSave(elements, appState, files);
        }}
        onPointerDown={(activeTool, pointerDownState) =>
          tools.onPointerDown(activeTool, pointerDownState.origin)
        }
        renderTopRightUI={(isMobile) => {
          const customTools = (
            <div className={`custom-tools${isMobile ? " custom-tools--mobile" : ""}`}>
              <ShapePenButton
              active={tools.shapePen.active}
              onToggle={() => tools.shapePen.set(!tools.shapePen.active)}
            />
            <FillControls
              active={tools.fill.active}
              color={tools.fill.color}
              onToggle={() => tools.fill.set(!tools.fill.active)}
              onColorChange={tools.fill.setColor}
            />
            <LaserControls
              active={tools.laser.active}
              compact={isMobile}
              color={tools.laser.color}
              onToggle={() => tools.laser.set(!tools.laser.active)}
              onColorChange={tools.laser.setColor}
            />
          </div>
          );
          // Excalidraw's phone toolbar has no room left, so on phones the
          // tools stand in a column at the canvas's right edge instead.
          return isMobile && container ? createPortal(customTools, container) : customTools;
        }}
      >
        <MainMenu>
          <MainMenu.DefaultItems.LoadScene />
          <MainMenu.DefaultItems.SaveToActiveFile />
          <MainMenu.DefaultItems.Export />
          <MainMenu.DefaultItems.SaveAsImage />
          <MainMenu.DefaultItems.CommandPalette />
          <MainMenu.DefaultItems.SearchMenu />
          <MainMenu.DefaultItems.Help />
          <MainMenu.DefaultItems.ClearCanvas />
          <MainMenu.Separator />
          <MainMenu.ItemCustom>
            <div className="canvas-style">
              <span className="canvas-style__label" id="canvas-style-label">
                Canvas
              </span>
              <div className="canvas-style__options" role="radiogroup" aria-labelledby="canvas-style-label">
                {BACKGROUNDS.map(({ value, label, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={board.background === value}
                    className="canvas-style__option"
                    onClick={() => onBackgroundChange(value)}
                  >
                    <Icon />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </MainMenu.ItemCustom>
          <MainMenu.DefaultItems.ToggleTheme />
          <MainMenu.DefaultItems.ChangeCanvasBackground />
        </MainMenu>
        {/* Shown on an empty board until the first shape is drawn. */}
        <WelcomeScreen>
          <WelcomeScreen.Hints.MenuHint />
          <WelcomeScreen.Hints.ToolbarHint />
          <WelcomeScreen.Hints.HelpHint />
          <WelcomeScreen.Center>
            <WelcomeScreen.Center.Logo>
              <span className="welcome-brand">
                <LogoMark size={52} />
                <Wordmark />
              </span>
            </WelcomeScreen.Center.Logo>
            <WelcomeScreen.Center.Heading>
              Sketch shots, map your edit, and present with the glowing laser (press K).
            </WelcomeScreen.Center.Heading>
            <WelcomeScreen.Center.Menu>
              <WelcomeScreen.Center.MenuItemLoadScene />
              <WelcomeScreen.Center.MenuItemHelp />
            </WelcomeScreen.Center.Menu>
          </WelcomeScreen.Center>
        </WelcomeScreen>
      </Excalidraw>
      {container &&
        api &&
        createPortal(
          <>
            {board.background !== "blank" && (
              <CanvasGrid api={api} background={board.background} paperColor={paperColor} />
            )}
            <GlowLaser active={tools.laser.active} color={tools.laser.color} />
          </>,
          container,
        )}
    </div>
  );
}
