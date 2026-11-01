import './Hanko.css';

/** The red 済 ("done") seal pressed onto a finished day. `fresh` plays the stamp-down once. */
export function Hanko({ fresh = false }: { fresh?: boolean }) {
  return (
    <span className={`hanko jp${fresh ? ' hanko--fresh' : ''}`} aria-hidden="true">
      済
    </span>
  );
}
