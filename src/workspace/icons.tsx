type IconProps = { size?: number };

const svg = (path: React.ReactNode) =>
  function Icon({ size = 16 }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {path}
      </svg>
    );
  };

export const FolderIcon = svg(
  <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
);
export const BoardIcon = svg(
  <>
    <rect x="3" y="4" width="18" height="16" rx="3" />
    <path d="M8 10h.01M16 10h.01M9 15c1.5 1 4.5 1 6 0" />
  </>,
);
export const ChevronIcon = svg(<path d="m9 6 6 6-6 6" />);
export const PlusIcon = svg(<path d="M12 5v14M5 12h14" />);
export const MoreIcon = svg(
  <path d="M6 12h.01M12 12h.01M18 12h.01" strokeWidth={3} />,
);
export const SidebarIcon = svg(
  <>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M9 4v16" />
  </>,
);
export const DotsIcon = svg(
  <path
    d="M6 6h.01M12 6h.01M18 6h.01M6 12h.01M12 12h.01M18 12h.01M6 18h.01M12 18h.01M18 18h.01"
    strokeWidth={2.6}
  />,
);
export const GridIcon = svg(
  <>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
  </>,
);
export const BlankIcon = svg(<rect x="3" y="3" width="18" height="18" rx="2" />);
