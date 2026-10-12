# FilmFlux Draw

A whiteboard for filmmakers: sketch shots, map out an edit, and present with a glowing, high-visibility laser pointer.

## Getting started

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build into dist/
```

## Workspace: boards and folders

The sidebar on the left holds your boards, organised in folders like Whimsical's.

- **+** at the top creates a board or folder. Hover a folder for its own **+** to add inside it.
- Double-click (or F2) to rename a board, folder, or the workspace. **⋯** has rename, move out of folder, and delete.
- Drag items to reorder them or drop them onto a folder. Drop on empty space in the list to move back to the top level.
- Hide the sidebar with the panel icon; on phones it slides over the board.

Each board is saved automatically in the browser (IndexedDB), along with its scroll position and zoom. Nothing is sent to a server, so boards stay on the device and browser where you made them.

## Canvas styles

Main menu (☰) → **Canvas**: very light **Dots**, a light **Grid**, or **Blank**. The choice is saved per board, and the pattern follows scroll and zoom.

## Glowing laser pointer

Replaces the drawing engine's built-in laser with a neon one that is easy to see on light and dark canvases.

- Toggle with **K**, the **Laser** button (top right), or the built-in laser tool. **Esc** turns it off.
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

## Branding

- The name, logo and welcome screen live in `src/brand/` and `public/favicon.svg`.
- `build/rebrand.ts` renames the drawing engine's own name in its visible text during `npm run build`, and warns if a library upgrade changes one of those texts.
- Links to the drawing engine's website, blog and public library catalogue are hidden in `src/styles.css`.

## Credits

Built on the open-source [Excalidraw](https://github.com/excalidraw/excalidraw) drawing engine (MIT license). Its license notice ships with the site as `licenses.txt`, as the MIT license requires.
