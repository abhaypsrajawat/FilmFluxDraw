export const LASER_COLORS = [
  { name: "Red", value: "#ff2d55" },
  { name: "Green", value: "#39ff14" },
  { name: "Cyan", value: "#00e5ff" },
  { name: "Yellow", value: "#ffe600" },
  { name: "Magenta", value: "#ff00e6" },
];

type Props = {
  active: boolean;
  color: string;
  onToggle: () => void;
  onColorChange: (color: string) => void;
};

export function LaserControls({ active, color, onToggle, onColorChange }: Props) {
  return (
    <div className="laser-controls" style={{ "--laser-color": color } as React.CSSProperties}>
      {active && (
        <div className="laser-colors" role="radiogroup" aria-label="Laser color">
          {LASER_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              role="radio"
              aria-checked={c.value === color}
              aria-label={c.name}
              title={c.name}
              className="laser-swatch"
              style={{ background: c.value }}
              onClick={() => onColorChange(c.value)}
            />
          ))}
        </div>
      )}
      <button
        type="button"
        className="laser-toggle"
        aria-pressed={active}
        title={active ? "Exit laser pointer (K or Esc)" : "Glowing laser pointer (K)"}
        onClick={onToggle}
      >
        <span className="laser-toggle__dot" />
        Laser
      </button>
    </div>
  );
}
