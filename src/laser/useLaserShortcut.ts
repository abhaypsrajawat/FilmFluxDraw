import { useEffect } from "react";

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT");

/**
 * Takes over Excalidraw's laser shortcut (K) so it toggles the glowing laser,
 * and lets Escape leave laser mode. The listener is registered on `window` in
 * the capture phase, so it runs before Excalidraw's own `document` listener.
 */
export function useLaserShortcut(active: boolean, setActive: (active: boolean) => void) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTyping(event.target)) return;
      const plainKey = !event.ctrlKey && !event.metaKey && !event.altKey;
      if (plainKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        event.stopImmediatePropagation();
        setActive(!active);
      } else if (active && event.key === "Escape") {
        event.stopImmediatePropagation();
        setActive(false);
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [active, setActive]);
}
