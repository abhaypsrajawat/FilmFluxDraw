import { useEffect, useState } from "react";
import { BoardEditor } from "./canvas/BoardEditor";
import type { Theme } from "./canvas/BoardEditor";
import { Sidebar } from "./workspace/Sidebar";
import { SidebarIcon } from "./workspace/icons";
import { deleteScene } from "./workspace/sceneStorage";
import { useWorkspace } from "./workspace/useWorkspace";

const THEME_KEY = "filmfluxdraw:theme";
const NARROW_QUERY = "(max-width: 720px)";

const loadTheme = (): Theme => {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // Fall through to the system preference.
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const isNarrow = () => window.matchMedia?.(NARROW_QUERY).matches ?? false;

export default function App() {
  const [workspace, dispatch] = useWorkspace();
  const [theme, setTheme] = useState(loadTheme);
  // On phones the sidebar overlays the canvas, so start with it closed there.
  const [sidebarOpen, setSidebarOpen] = useState(() => !isNarrow());

  const board = workspace.nodes[workspace.activeBoardId];

  useEffect(() => {
    if (board?.type === "board") document.title = `${board.name} · FilmFluxDraw`;
  }, [board]);

  const changeTheme = (next: Theme) => {
    setTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Not persisting the theme is fine.
    }
  };

  if (board?.type !== "board") return null;

  return (
    <div className="app" data-theme-mode={theme} data-sidebar={sidebarOpen ? "open" : "closed"}>
      {sidebarOpen && (
        <>
          <Sidebar
            workspace={workspace}
            dispatch={dispatch}
            onBoardsDeleted={(ids) => ids.forEach((id) => void deleteScene(id))}
            onCollapse={() => setSidebarOpen(false)}
            onBoardOpened={() => isNarrow() && setSidebarOpen(false)}
          />
          <div className="app__scrim" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
        </>
      )}
      <main className="app__board">
        {!sidebarOpen && (
          <button
            type="button"
            className="sidebar-reopen"
            title="Show sidebar"
            aria-label="Show sidebar"
            onClick={() => setSidebarOpen(true)}
          >
            <SidebarIcon />
          </button>
        )}
        <BoardEditor
          key={board.id}
          board={board}
          theme={theme}
          onThemeChange={changeTheme}
          onBackgroundChange={(background) =>
            dispatch({ type: "setBackground", id: board.id, background })
          }
        />
      </main>
    </div>
  );
}
