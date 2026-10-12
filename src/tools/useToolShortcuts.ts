import { useEffect, useRef } from "react";

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT");

type Tool = { active: boolean; set: (active: boolean) => void };

/**
 * Single-key shortcuts that toggle the app's own tools (e.g. K for the laser,
 * overriding Excalidraw's), plus Escape to leave whichever one is on. Listens
 * on `window` in the capture phase so it runs before Excalidraw's handlers.
 */
export function useToolShortcuts(tools: Record<string, Tool>) {
  const toolsRef = useRef(tools);
  toolsRef.current = tools;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTyping(event.target)) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const tools = toolsRef.current;
      const tool = tools[event.key.toLowerCase()];
      if (tool) {
        event.preventDefault();
        event.stopImmediatePropagation();
        tool.set(!tool.active);
      } else if (event.key === "Escape") {
        const active = Object.values(tools).find((t) => t.active);
        if (active) {
          event.stopImmediatePropagation();
          active.set(false);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, []);
}
