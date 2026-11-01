import './Toast.css';

/** The live region that shows short confirmations ("נוסף לתוכנית ✿"). Always in the DOM. */
export function Toast({ message }: { message: string | null }) {
  return (
    <div className={`toast${message ? ' toast--on' : ''}`} role="status" aria-live="polite">
      {message}
    </div>
  );
}
