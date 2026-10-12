import { del, get, set } from "idb-keyval";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { AppState, BinaryFiles } from "@excalidraw/excalidraw/types";

/** What we keep per board. Stored in IndexedDB, since images make scenes too big for localStorage. */
export type StoredScene = {
  elements: readonly ExcalidrawElement[];
  appState: Partial<Pick<AppState, "viewBackgroundColor" | "scrollX" | "scrollY" | "zoom">>;
  files: BinaryFiles;
};

const key = (boardId: string) => `filmfluxdraw:scene:${boardId}`;

export async function loadScene(boardId: string): Promise<StoredScene | null> {
  try {
    return (await get<StoredScene>(key(boardId))) ?? null;
  } catch (error) {
    console.error("Could not load board", error);
    return null;
  }
}

export async function saveScene(boardId: string, scene: StoredScene) {
  try {
    await set(key(boardId), scene);
  } catch (error) {
    console.error("Could not save board", error);
  }
}

export async function deleteScene(boardId: string) {
  try {
    await del(key(boardId));
  } catch (error) {
    console.error("Could not delete board", error);
  }
}
