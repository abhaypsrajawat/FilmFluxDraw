import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Relative asset paths, so the built site works from any folder on a web host.
  base: "./",
  plugins: [react()],
  define: {
    // Required by @excalidraw/excalidraw when bundled with Vite.
    "process.env.IS_PREACT": JSON.stringify("false"),
  },
});
