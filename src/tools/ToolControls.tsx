export const FILL_COLORS = [
  { name: "Light red", value: "#ffc9c9" },
  { name: "Light green", value: "#b2f2bb" },
  { name: "Light blue", value: "#a5d8ff" },
  { name: "Light yellow", value: "#ffec99" },
  { name: "Red", value: "#ff8787" },
  { name: "Green", value: "#69db7c" },
  { name: "Blue", value: "#4dabf7" },
  { name: "Yellow", value: "#ffd43b" },
  { name: "No fill", value: "transparent" },
];

const BucketIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m5 11 6.5-6.5a1.5 1.5 0 0 1 2.1 0l5.9 5.9a1.5 1.5 0 0 1 0 2.1L13 19a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8Z" />
    <path d="M5 11h14" />
    <path d="M9.5 6.5 7 4" />
    <path d="M20.5 15.5s1.5 1.9 1.5 3a1.5 1.5 0 0 1-3 0c0-1.1 1.5-3 1.5-3Z" />
  </svg>
);

const ShapePenIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 17c2-4 4-6 6-6s2 3 4 3 3-4 5-4" strokeDasharray="2 2.4" />
    <rect x="13" y="3" width="8" height="6" rx="1" />
  </svg>
);

type SwatchesProps = {
  label: string;
  colors: readonly { name: string; value: string }[];
  value: string;
  onChange: (color: string) => void;
  /** Adds a free color picker after the presets. */
  custom?: boolean;
};

/** A small panel of color choices shown under an active tool's button. */
export function Swatches({ label, colors, value, onChange, custom }: SwatchesProps) {
  const isPreset = colors.some((c) => c.value === value);
  return (
    <div className="tool-swatches" role="radiogroup" aria-label={label}>
      {colors.map((c) => (
        <button
          key={c.value}
          type="button"
          role="radio"
          aria-checked={c.value === value}
          aria-label={c.name}
          title={c.name}
          className={`tool-swatch${c.value === "transparent" ? " tool-swatch--none" : ""}`}
          style={c.value === "transparent" ? undefined : { background: c.value }}
          onClick={() => onChange(c.value)}
        />
      ))}
      {custom && (
        <label
          className="tool-swatch tool-swatch--custom"
          title="Pick any color"
          aria-checked={!isPreset}
          style={isPreset ? undefined : { background: value }}
        >
          <input
            type="color"
            aria-label="Pick any color"
            value={isPreset || value === "transparent" ? "#ff8787" : value}
            onChange={(event) => onChange(event.target.value)}
          />
        </label>
      )}
    </div>
  );
}

type FillProps = {
  active: boolean;
  color: string;
  onToggle: () => void;
  onColorChange: (color: string) => void;
};

export function FillControls({ active, color, onToggle, onColorChange }: FillProps) {
  return (
    <div className="tool-controls">
      <button
        type="button"
        className="tool-toggle tool-toggle--icon"
        aria-pressed={active}
        aria-label="Bucket fill"
        title={active ? "Bucket fill: click a shape to fill it (B or Esc to exit)" : "Bucket fill (B)"}
        style={{ "--tool-color": color === "transparent" ? "currentColor" : color } as React.CSSProperties}
        onClick={onToggle}
      >
        <BucketIcon />
        <span className="tool-toggle__chip" aria-hidden="true" />
      </button>
      {active && (
        <Swatches label="Fill color" colors={FILL_COLORS} value={color} onChange={onColorChange} custom />
      )}
    </div>
  );
}

type ShapePenProps = { active: boolean; onToggle: () => void };

export function ShapePenButton({ active, onToggle }: ShapePenProps) {
  return (
    <div className="tool-controls">
      <button
        type="button"
        className="tool-toggle tool-toggle--icon"
        aria-pressed={active}
        aria-label="Draw to shape"
        title={
          active
            ? "Draw to shape: sketch a box, circle, diamond, triangle or line (W or Esc to exit)"
            : "Draw to shape (W)"
        }
        onClick={onToggle}
      >
        <ShapePenIcon />
      </button>
    </div>
  );
}
