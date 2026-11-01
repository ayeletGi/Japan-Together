import './ProgressBar.css';

/** A soft pink progress bar. */
export function ProgressBar({
  value,
  max,
  label,
  thin = false,
}: {
  value: number;
  max: number;
  label: string;
  thin?: boolean;
}) {
  const percent = max ? Math.round((value / max) * 100) : 0;
  return (
    <span
      className={`progress${thin ? ' progress--thin' : ''}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <i style={{ width: `${percent}%` }} />
    </span>
  );
}
