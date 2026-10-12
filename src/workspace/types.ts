export type CanvasBackground = "dots" | "grid" | "blank";

export type FolderNode = {
  id: string;
  type: "folder";
  name: string;
  parentId: string | null;
  order: number;
  collapsed: boolean;
};

export type BoardNode = {
  id: string;
  type: "board";
  name: string;
  parentId: string | null;
  order: number;
  background: CanvasBackground;
};

export type WorkspaceNode = FolderNode | BoardNode;

export type Workspace = {
  name: string;
  nodes: Record<string, WorkspaceNode>;
  activeBoardId: string;
};
