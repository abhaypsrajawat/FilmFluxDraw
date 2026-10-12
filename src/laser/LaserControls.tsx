import { Swatches } from "../tools/ToolControls";

export const LASER_COLORS = [
  { name: "FilmFlux red", value: "#ff3b30" },
  { name: "Green", value: "#39ff14" },
  { name: "Cyan", value: "#00e5ff" },
  { name: "Yellow", value: "#ffe600" },
  { name: "Magenta", value: "#ff00e6" },
];

type Props = {
  active: boolean;
  /** Icon-only button, for Excalidraw's cramped phone toolbar. */
  compact?: boolean;
  color: string;
  onToggle: () => void;
  onColorChange: (color: string) => void;
};

export function LaserControls({ active, compact, color, onToggle, onColorChange }: Props) {
  return (
    <div className="tool-controls" style={{ "--tool-color": color } as React.CSSProperties}>
      <button
        type="button"
        className="tool-toggle laser-toggle"
        aria-pressed={active}
        title={active ? "Exit laser pointer (K or Esc)" : "Glowing laser pointer (K)"}
        aria-label="Laser pointer"
        onClick={onToggle}
      >
        <span className="laser-toggle__dot" />
        {!compact && "Laser"}
      </button>
      {active && (
        <Swatches label="Laser color" colors={LASER_COLORS} value={color} onChange={onColorChange} />
      )}
    </div>
  );
}
