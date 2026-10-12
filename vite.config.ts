import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    // Required by @excalidraw/excalidraw when bundled with Vite.
    "process.env.IS_PREACT": JSON.stringify("false"),
  },
});
