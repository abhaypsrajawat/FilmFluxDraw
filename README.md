# FilmFluxDraw

A whiteboard built on [Excalidraw](https://github.com/excalidraw/excalidraw) (`@excalidraw/excalidraw`), with a glowing, high-visibility laser pointer.

## Getting started

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build into dist/
```

## Glowing laser pointer

Replaces Excalidraw's built-in laser with a neon one that is easy to see on light and dark canvases.

- Toggle with **K**, the **Laser** button (top right), or Excalidraw's own laser tool. **Esc** turns it off.
- Hold and drag to leave a glowing trail that fades out after about a second. The pointer itself is a glowing dot.
- Pick red, green, cyan, yellow or magenta while it's on. The choice is remembered in the browser.
- Ctrl/⌘ + scroll zoom and scroll panning keep working while the laser is on.

Code lives in `src/laser/`:

- `GlowLaser.tsx` – the canvas overlay that draws the glow
- `LaserControls.tsx` – toolbar button and color swatches
- `useLaserShortcut.ts` – takes over the K shortcut and handles Esc
