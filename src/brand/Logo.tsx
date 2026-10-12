/** FilmFlux Draw mark: a film frame with sprocket holes, crossed by a pen stroke. */
export function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="brand-mark">
      <defs>
        <linearGradient id="brand-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff4d6d" />
          <stop offset="1" stopColor="#7b61ff" />
        </linearGradient>
      </defs>
      <rect x="2" y="4" width="28" height="24" rx="6" fill="url(#brand-gradient)" />
      <g fill="#ffffff" opacity="0.9">
        <rect x="6" y="7" width="3" height="2" rx="1" />
        <rect x="11" y="7" width="3" height="2" rx="1" />
        <rect x="16" y="7" width="3" height="2" rx="1" />
        <rect x="21" y="7" width="3" height="2" rx="1" />
        <rect x="6" y="23" width="3" height="2" rx="1" />
        <rect x="11" y="23" width="3" height="2" rx="1" />
        <rect x="16" y="23" width="3" height="2" rx="1" />
        <rect x="21" y="23" width="3" height="2" rx="1" />
      </g>
      <path
        d="M7 18.5c3-4.5 5.5-4.5 7.5-1.5s4.5 3 10.5-4"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="brand-wordmark">
      Film<span className="brand-wordmark__flux">Flux</span> Draw
    </span>
  );
}
