import { useEffect, useRef, useState } from "react";
import type { Workspace, WorkspaceNode } from "./types";
import { childrenOf, makeBoard, newId, nextOrder, subtreeIds } from "./useWorkspace";
import type { WorkspaceAction } from "./useWorkspace";
import { BoardIcon, ChevronIcon, FolderIcon, MoreIcon, PlusIcon, SidebarIcon } from "./icons";
import { BrandLogo } from "../brand/Logo";

type Props = {
  workspace: Workspace;
  dispatch: (action: WorkspaceAction) => void;
  /** Called with the ids of boards that were deleted, so their drawings can be removed. */
  onBoardsDeleted: (ids: string[]) => void;
  onCollapse: () => void;
  /** Called after a board is picked, e.g. to close the sidebar on phones. */
  onBoardOpened: () => void;
};

type DropTarget = { id: string | null; position: "before" | "inside" };

const DRAG_TYPE = "application/x-filmfluxdraw-node";

export function Sidebar({ workspace, dispatch, onBoardsDeleted, onCollapse, onBoardOpened }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ id: string | null; kind: "add" | "more" } | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [editingWorkspace, setEditingWorkspace] = useState(false);
  const draggingId = useRef<string | null>(null);

  const create = (type: WorkspaceNode["type"], parentId: string | null) => {
    const order = nextOrder(workspace, parentId);
    const node: WorkspaceNode =
      type === "board"
        ? makeBoard("Untitled board", parentId, order)
        : { id: newId(), type: "folder", name: "New folder", parentId, order, collapsed: false };
    dispatch({ type: "create", node });
    setEditingId(node.id);
    setMenu(null);
    if (type === "board") onBoardOpened();
  };

  const remove = (node: WorkspaceNode) => {
    setMenu(null);
    const ids = subtreeIds(workspace, node.id);
    const boards = ids.filter((id) => workspace.nodes[id].type === "board");
    const message =
      node.type === "folder" && ids.length > 1
        ? `Delete the folder "${node.name}" and the ${ids.length - 1} item(s) inside it? This can't be undone.`
        : `Delete "${node.name}"? This can't be undone.`;
    if (!window.confirm(message)) return;
    dispatch({ type: "delete", id: node.id });
    onBoardsDeleted(boards);
  };

  const open = (node: WorkspaceNode) => {
    if (node.type === "folder") {
      dispatch({ type: "toggleFolder", id: node.id });
    } else {
      dispatch({ type: "open", id: node.id });
      onBoardOpened();
    }
  };

  const onDragOver = (event: React.DragEvent, node: WorkspaceNode | null) => {
    const dragged = draggingId.current;
    if (!dragged || !event.dataTransfer.types.includes(DRAG_TYPE)) return;
    // Folders can't go inside themselves or their own subfolders.
    if (node && subtreeIds(workspace, dragged).includes(node.id)) return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "move";
    let target: DropTarget;
    if (!node) {
      target = { id: null, position: "inside" };
    } else if (node.type === "folder") {
      const rect = event.currentTarget.getBoundingClientRect();
      const inTopQuarter = event.clientY - rect.top < rect.height / 4;
      target = { id: node.id, position: inTopQuarter ? "before" : "inside" };
    } else {
      target = { id: node.id, position: "before" };
    }
    if (target.id !== dropTarget?.id || target.position !== dropTarget?.position) {
      setDropTarget(target);
    }
  };

  const onDrop = (event: React.DragEvent) => {
    const dragged = draggingId.current;
    if (!dragged || !dropTarget) return;
    event.preventDefault();
    event.stopPropagation();
    if (dropTarget.id === null) {
      dispatch({ type: "move", id: dragged, parentId: null });
    } else if (dropTarget.position === "inside") {
      dispatch({ type: "move", id: dragged, parentId: dropTarget.id });
      dispatch({ type: "toggleFolder", id: dropTarget.id, collapsed: false });
    } else {
      const before = workspace.nodes[dropTarget.id];
      dispatch({ type: "move", id: dragged, parentId: before.parentId, beforeId: before.id });
    }
    draggingId.current = null;
    setDropTarget(null);
  };

  const renderNodes = (parentId: string | null, depth: number): React.ReactNode =>
    childrenOf(workspace, parentId).map((node) => {
      const isFolder = node.type === "folder";
      const active = node.id === workspace.activeBoardId;
      const dropClass =
        dropTarget?.id === node.id ? ` ws-row--drop-${dropTarget.position}` : "";
      return (
        <li key={node.id} role="none">
          <div
            className={`ws-row${active ? " ws-row--active" : ""}${dropClass}`}
            style={{ "--depth": depth } as React.CSSProperties}
            draggable={editingId !== node.id}
            onDragStart={(event) => {
              draggingId.current = node.id;
              event.dataTransfer.setData(DRAG_TYPE, node.id);
              event.dataTransfer.effectAllowed = "move";
            }}
            onDragEnd={() => {
              draggingId.current = null;
              setDropTarget(null);
            }}
            onDragOver={(event) => onDragOver(event, node)}
            onDrop={onDrop}
          >
            <button
              type="button"
              role="treeitem"
              aria-expanded={isFolder ? !node.collapsed : undefined}
              aria-current={active ? "page" : undefined}
              className="ws-row__main"
              onClick={() => open(node)}
              onDoubleClick={() => setEditingId(node.id)}
              onKeyDown={(event) => {
                if (event.key === "F2") setEditingId(node.id);
              }}
            >
              <span
                className={`ws-row__chevron${isFolder && !node.collapsed ? " ws-row__chevron--open" : ""}`}
              >
                {isFolder && <ChevronIcon size={12} />}
              </span>
              <span className={`ws-row__icon ws-row__icon--${node.type}`}>
                {isFolder ? <FolderIcon /> : <BoardIcon />}
              </span>
              {editingId !== node.id && <span className="ws-row__name">{node.name}</span>}
            </button>
            {editingId === node.id && (
              <RenameInput
                value={node.name}
                label={`Rename ${node.name}`}
                onDone={(name) => {
                  if (name !== null) dispatch({ type: "rename", id: node.id, name });
                  setEditingId(null);
                }}
              />
            )}
            <div className="ws-row__actions">
              {isFolder && (
                <button
                  type="button"
                  className="ws-icon-button"
                  title={`Add to ${node.name}`}
                  aria-label={`Add to ${node.name}`}
                  onClick={() => setMenu({ id: node.id, kind: "add" })}
                >
                  <PlusIcon size={14} />
                </button>
              )}
              <button
                type="button"
                className="ws-icon-button"
                title="More options"
                aria-label={`More options for ${node.name}`}
                onClick={() => setMenu({ id: node.id, kind: "more" })}
              >
                <MoreIcon size={14} />
              </button>
            </div>
            {menu?.id === node.id && (
              <Menu onClose={() => setMenu(null)}>
                {menu.kind === "add" ? (
                  <AddItems onCreate={(type) => create(type, node.id)} />
                ) : (
                  <>
                    <button type="button" role="menuitem" onClick={() => { setMenu(null); setEditingId(node.id); }}>
                      Rename
                    </button>
                    {isFolder && <AddItems onCreate={(type) => create(type, node.id)} />}
                    {node.parentId && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMenu(null);
                          dispatch({ type: "move", id: node.id, parentId: null });
                        }}
                      >
                        Move out of folder
                      </button>
                    )}
                    <button type="button" role="menuitem" className="ws-menu__danger" onClick={() => remove(node)}>
                      Delete
                    </button>
                  </>
                )}
              </Menu>
            )}
          </div>
          {isFolder && !node.collapsed && (
            <ul role="group" className="ws-tree">
              {renderNodes(node.id, depth + 1)}
            </ul>
          )}
        </li>
      );
    });

  return (
    <nav className="ws-sidebar" aria-label="Workspace">
      <div className="ws-brand">
        <button
          type="button"
          className="sidebar-toggle"
          title="Hide sidebar"
          aria-label="Hide sidebar"
          onClick={onCollapse}
        >
          <SidebarIcon />
        </button>
        <BrandLogo height={30} />
      </div>

      <div className="ws-header">
        {editingWorkspace ? (
          <RenameInput
            value={workspace.name}
            label="Rename workspace"
            onDone={(name) => {
              if (name !== null) dispatch({ type: "renameWorkspace", name });
              setEditingWorkspace(false);
            }}
          />
        ) : (
          <button
            type="button"
            className="ws-header__name"
            title="Double-click to rename"
            onDoubleClick={() => setEditingWorkspace(true)}
          >
            <span className="ws-avatar" aria-hidden="true">
              {workspace.name.trim().charAt(0).toUpperCase() || "W"}
            </span>
            <span className="ws-row__name">{workspace.name}</span>
          </button>
        )}
        <div className="ws-header__add">
          <button
            type="button"
            className="ws-icon-button ws-icon-button--filled"
            title="New board or folder"
            aria-label="New board or folder"
            onClick={() => setMenu({ id: null, kind: "add" })}
          >
            <PlusIcon />
          </button>
          {menu?.id === null && (
            <Menu onClose={() => setMenu(null)}>
              <AddItems onCreate={(type) => create(type, null)} />
            </Menu>
          )}
        </div>
      </div>

      <div
        className={`ws-section${dropTarget?.id === null ? " ws-section--drop" : ""}`}
        onDragOver={(event) => onDragOver(event, null)}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) setDropTarget(null);
        }}
        onDrop={onDrop}
      >
        <h2 className="ws-section__title">Boards</h2>
        <ul role="tree" aria-label="Boards and folders" className="ws-tree">
          {renderNodes(null, 0)}
        </ul>
        <p className="ws-hint">Drag items to reorder or move them into folders.</p>
      </div>
    </nav>
  );
}

function AddItems({ onCreate }: { onCreate: (type: WorkspaceNode["type"]) => void }) {
  return (
    <>
      <button type="button" role="menuitem" onClick={() => onCreate("board")}>
        <BoardIcon size={14} /> New board
      </button>
      <button type="button" role="menuitem" onClick={() => onCreate("folder")}>
        <FolderIcon size={14} /> New folder
      </button>
    </>
  );
}

function Menu({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    ref.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) onCloseRef.current();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, []);

  return (
    <div ref={ref} className="ws-menu" role="menu">
      {children}
    </div>
  );
}

/** Inline text field; `onDone(null)` means the edit was cancelled. */
function RenameInput({
  value,
  label,
  onDone,
}: {
  value: string;
  label: string;
  onDone: (value: string | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const done = useRef(false);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  const finish = (result: string | null) => {
    if (done.current) return;
    done.current = true;
    onDone(result);
  };

  return (
    <input
      ref={ref}
      className="ws-rename"
      aria-label={label}
      defaultValue={value}
      onBlur={(event) => finish(event.currentTarget.value)}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === "Enter") finish(event.currentTarget.value);
        if (event.key === "Escape") finish(null);
      }}
    />
  );
}
