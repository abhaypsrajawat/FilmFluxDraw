import { useEffect, useReducer } from "react";
import type { BoardNode, CanvasBackground, Workspace, WorkspaceNode } from "./types";

const STORAGE_KEY = "filmfluxdraw:workspace";

export const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

const makeBoard = (name: string, parentId: string | null, order: number): BoardNode => ({
  id: newId(),
  type: "board",
  name,
  parentId,
  order,
  background: "dots",
});

function initialWorkspace(): Workspace {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const workspace = JSON.parse(saved) as Workspace;
      if (workspace.nodes[workspace.activeBoardId]?.type === "board") return workspace;
    }
  } catch {
    // Unreadable or blocked storage: start a fresh workspace.
  }
  const board = makeBoard("Untitled board", null, 0);
  return { name: "My Workspace", nodes: { [board.id]: board }, activeBoardId: board.id };
}

/** Children of `parentId`, in display order. */
export function childrenOf(workspace: Workspace, parentId: string | null) {
  return Object.values(workspace.nodes)
    .filter((node) => node.parentId === parentId)
    .sort((a, b) => a.order - b.order);
}

/** `id` and every node nested under it. */
export function subtreeIds(workspace: Workspace, id: string): string[] {
  return [id, ...childrenOf(workspace, id).flatMap((child) => subtreeIds(workspace, child.id))];
}

export type WorkspaceAction =
  | { type: "create"; node: WorkspaceNode }
  | { type: "rename"; id: string; name: string }
  | { type: "renameWorkspace"; name: string }
  | { type: "delete"; id: string }
  | { type: "toggleFolder"; id: string; collapsed?: boolean }
  | { type: "open"; id: string }
  | { type: "setBackground"; id: string; background: CanvasBackground }
  /** Move `id` into `parentId`, placed before `beforeId` (or last when omitted). */
  | { type: "move"; id: string; parentId: string | null; beforeId?: string };

function reducer(workspace: Workspace, action: WorkspaceAction): Workspace {
  const nodes = workspace.nodes;
  switch (action.type) {
    case "create": {
      const next = { ...workspace, nodes: { ...nodes, [action.node.id]: action.node } };
      // Make sure a new item inside a collapsed folder is visible.
      let parentId = action.node.parentId;
      while (parentId) {
        const parent = next.nodes[parentId];
        if (parent.type === "folder" && parent.collapsed) {
          next.nodes[parentId] = { ...parent, collapsed: false };
        }
        parentId = parent.parentId;
      }
      if (action.node.type === "board") next.activeBoardId = action.node.id;
      return next;
    }
    case "rename": {
      const name = action.name.trim();
      if (!name || !nodes[action.id]) return workspace;
      return { ...workspace, nodes: { ...nodes, [action.id]: { ...nodes[action.id], name } } };
    }
    case "renameWorkspace": {
      const name = action.name.trim();
      return name ? { ...workspace, name } : workspace;
    }
    case "delete": {
      const removed = new Set(subtreeIds(workspace, action.id));
      const remaining = Object.fromEntries(
        Object.entries(nodes).filter(([id]) => !removed.has(id)),
      );
      let activeBoardId = workspace.activeBoardId;
      if (removed.has(activeBoardId)) {
        const fallback = Object.values(remaining).find((n) => n.type === "board");
        if (fallback) {
          activeBoardId = fallback.id;
        } else {
          // Always keep at least one board to draw on.
          const board = makeBoard("Untitled board", null, 0);
          remaining[board.id] = board;
          activeBoardId = board.id;
        }
      }
      return { ...workspace, nodes: remaining, activeBoardId };
    }
    case "toggleFolder": {
      const folder = nodes[action.id];
      if (folder?.type !== "folder") return workspace;
      const collapsed = action.collapsed ?? !folder.collapsed;
      return { ...workspace, nodes: { ...nodes, [folder.id]: { ...folder, collapsed } } };
    }
    case "open":
      return nodes[action.id]?.type === "board"
        ? { ...workspace, activeBoardId: action.id }
        : workspace;
    case "setBackground": {
      const board = nodes[action.id];
      if (board?.type !== "board") return workspace;
      return {
        ...workspace,
        nodes: { ...nodes, [board.id]: { ...board, background: action.background } },
      };
    }
    case "move": {
      const node = nodes[action.id];
      if (!node || action.id === action.beforeId) return workspace;
      // A folder can't be moved inside itself.
      if (action.parentId && subtreeIds(workspace, action.id).includes(action.parentId)) {
        return workspace;
      }
      const siblings = childrenOf(workspace, action.parentId).filter((n) => n.id !== node.id);
      const index = action.beforeId
        ? siblings.findIndex((n) => n.id === action.beforeId)
        : siblings.length;
      const insertAt = index === -1 ? siblings.length : index;
      const reordered = [...siblings.slice(0, insertAt), node, ...siblings.slice(insertAt)];
      const nextNodes = { ...nodes };
      reordered.forEach((sibling, order) => {
        nextNodes[sibling.id] = { ...nextNodes[sibling.id], order, parentId: action.parentId };
      });
      return { ...workspace, nodes: nextNodes };
    }
  }
}

export function useWorkspace() {
  const [workspace, dispatch] = useReducer(reducer, undefined, initialWorkspace);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
    } catch {
      // Storage full or blocked; the workspace still works for this session.
    }
  }, [workspace]);

  return [workspace, dispatch] as const;
}

/** Next `order` for a new item appended to `parentId`. */
export function nextOrder(workspace: Workspace, parentId: string | null) {
  const siblings = childrenOf(workspace, parentId);
  return siblings.length ? siblings[siblings.length - 1].order + 1 : 0;
}

export { makeBoard };
