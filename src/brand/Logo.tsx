import logoOnLight from "./logo-on-light.png";
import logoOnDark from "./logo-on-dark.png";

/**
 * The FilmFlux logo with a "Draw" tag. Both color versions are rendered and
 * CSS shows the one that suits the current theme ("FILM" is near-white in
 * the original, so the light theme uses a charcoal version).
 */
export function BrandLogo({ height }: { height: number }) {
  return (
    <span className="brand-logo" style={{ "--logo-height": `${height}px` } as React.CSSProperties}>
      <img className="brand-logo__img brand-logo__img--light" src={logoOnLight} alt="FilmFlux" />
      <img className="brand-logo__img brand-logo__img--dark" src={logoOnDark} alt="" aria-hidden="true" />
      <span className="brand-logo__tag">Draw</span>
    </span>
  );
}
