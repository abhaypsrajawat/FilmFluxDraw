import logoMark from "./logo-mark.png";

/** The FilmFlux "FF" icon. */
export function LogoMark({ size = 24 }: { size?: number }) {
  return <img className="brand-mark" src={logoMark} width={size} height={size} alt="" aria-hidden="true" />;
}

export function Wordmark() {
  return (
    <span className="brand-wordmark">
      Film<span className="brand-wordmark__flux">Flux</span> Draw
    </span>
  );
}
