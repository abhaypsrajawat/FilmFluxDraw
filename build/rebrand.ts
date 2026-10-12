import type { Plugin } from "vite";

/**
 * Visible text in the drawing library's English UI that names the library,
 * replaced with this app's name at build time. Only exact quoted strings are
 * replaced, so identifiers, file formats and storage keys are untouched.
 */
const REPLACEMENTS: Record<string, string> = {
  "Mermaid to Excalidraw": "Mermaid to diagram",
  "Excalidraw file": "FilmFlux Draw file",
  "Excalidraw files": "FilmFlux Draw files",
  "Excalidraw library file": "FilmFlux Draw library file",
  "Excalidraw library files": "FilmFlux Draw library files",
  "Excalidraw Library": "FilmFlux Draw library",
  "Excalidraw links": "FilmFlux Draw links",
  "Excalidraw Embedded Content": "Embedded content",
  "Made with Excalidraw": "Made with FilmFlux Draw",
  "Install Excalidraw locally (PWA)": "Install FilmFlux Draw locally (PWA)",
  "Currently only <flowchartLink>Flowchart</flowchartLink>,<sequenceLink> Sequence, </sequenceLink> and <classLink>Class </classLink>Diagrams are supported. The other types will be rendered as image in Excalidraw.":
    "Currently only <flowchartLink>Flowchart</flowchartLink>,<sequenceLink> Sequence, </sequenceLink> and <classLink>Class </classLink>Diagrams are supported. The other types will be rendered as an image.",
  // The "browse libraries" link it points to is hidden (see styles.css).
  "Select an item on canvas to add it here, or install a library from the public repository, below.":
    "Select an item on the canvas to add it here, or import a library file from the ⋮ menu.",
  "Couldn't import scene from the supplied URL. It's either malformed, or doesn't contain valid Excalidraw JSON data.":
    "Couldn't import a scene from that URL. It's either malformed or doesn't contain valid drawing data.",
};

export function rebrand(): Plugin {
  const found = new Set<string>();
  return {
    name: "filmflux-rebrand",
    apply: "build",
    transform(code, id) {
      if (!id.includes("@excalidraw/excalidraw/dist")) return null;
      let next = code;
      for (const [from, to] of Object.entries(REPLACEMENTS)) {
        const quoted = JSON.stringify(from);
        if (next.includes(quoted)) {
          next = next.split(quoted).join(JSON.stringify(to));
          found.add(from);
        }
      }
      return next === code ? null : { code: next, map: null };
    },
    buildEnd() {
      // Flags strings that a library upgrade renamed, so they don't silently reappear.
      for (const from of Object.keys(REPLACEMENTS)) {
        if (!found.has(from)) this.warn(`rebrand: text not found in the drawing library: "${from}"`);
      }
    },
  };
}
