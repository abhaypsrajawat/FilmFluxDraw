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

## Auto-deploy to Hostinger

`.github/workflows/deploy.yml` builds the site and uploads `dist/` to Hostinger over FTP on every push to `main`. You can also run it by hand from the **Actions** tab ("Deploy to Hostinger" → **Run workflow**).

Add these under **Settings → Secrets and variables → Actions → Secrets** in GitHub:

| Secret | Value (from hPanel → Files → FTP Accounts) |
| --- | --- |
| `FTP_SERVER` | FTP hostname or IP, e.g. `ftp.yourdomain.com` |
| `FTP_USERNAME` | FTP username, e.g. `u123456789` |
| `FTP_PASSWORD` | FTP password |

Optional **Variables** (same page, **Variables** tab):

| Variable | Default | Change it when |
| --- | --- | --- |
| `FTP_SERVER_DIR` | `public_html/` | The site should live in a subfolder (`public_html/draw/`), or your FTP account already starts inside `public_html` (then use `./`) |
| `FTP_PROTOCOL` | `ftps` | The upload fails with a TLS error; set it to `ftp` |
| `FTP_PORT` | `21` | Your host uses a different port |
