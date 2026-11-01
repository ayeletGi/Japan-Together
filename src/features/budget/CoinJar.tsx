/** The cat coin-jar: the budget's only decoration. */
export function CoinJar({ size = 96 }: { size?: number }) {
  return (
    <svg
      className="coin-jar"
      width={size}
      height={(size * 104) / 92}
      viewBox="0 0 92 104"
      aria-hidden="true"
    >
      <path
        d="M14 26 L16 6 L30 18 L62 18 L76 6 L78 26"
        fill="var(--cat-face)"
        stroke="var(--cat)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <rect
        x="10"
        y="24"
        width="72"
        height="76"
        rx="26"
        fill="var(--cat-face)"
        stroke="var(--cat)"
        strokeWidth="2"
      />
      <path d="M12 62 H80 V74 Q80 98 56 98 H36 Q12 98 12 74Z" fill="var(--pink-soft)" />
      <circle className="coin" cx="32" cy="80" r="7" />
      <circle className="coin" cx="50" cy="86" r="7" />
      <circle className="coin" cx="62" cy="74" r="6" />
      <circle cx="36" cy="44" r="2.4" fill="var(--cat)" />
      <circle cx="56" cy="44" r="2.4" fill="var(--cat)" />
      <path d="M24 50h5M63 50h5" stroke="var(--pink)" strokeWidth="2.4" strokeLinecap="round" />
      <rect x="38" y="28" width="16" height="4" rx="2" fill="var(--cat)" />
    </svg>
  );
}
