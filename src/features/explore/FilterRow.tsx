import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

/**
 * One single-choice filter as a small pill that opens a rounded menu under it. It stays plain
 * on its first option (the default) and turns pink only once a real choice is made.
 */
export function FilterRow<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const [flip, setFlip] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const menuId = useId();
  const current = options.find((option) => option.value === value) ?? options[0];
  const active = value !== options[0]?.value;

  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) buttonRef.current?.focus();
  };

  const choose = (next: T) => {
    onChange(next);
    close(true);
  };

  // Close on a tap outside.
  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  // Keep the menu on screen: if it would spill past an edge, anchor it to the pill's other side.
  useLayoutEffect(() => {
    if (!open) {
      setFlip(false);
      return;
    }
    const rect = menuRef.current?.getBoundingClientRect();
    if (rect && (rect.left < 8 || rect.right > window.innerWidth - 8)) setFlip(true);
    menuRef.current
      ?.querySelector<HTMLElement>('[aria-selected="true"]')
      ?.focus({ preventScroll: true });
  }, [open]);

  const onMenuKey = (event: React.KeyboardEvent<HTMLUListElement>) => {
    const items = [...(menuRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])];
    const index = items.indexOf(document.activeElement as HTMLElement);
    if (event.key === 'Escape') {
      event.preventDefault();
      close(true);
    } else if (event.key === 'Tab') {
      close(false);
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      items[(index + step + items.length) % items.length]?.focus();
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      items[event.key === 'Home' ? 0 : items.length - 1]?.focus();
    }
  };

  return (
    <div className="filter-pop" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className={`filter-pill${active ? ' is-on' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((was) => !was)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span className="filter-pill-text">
          <span className="filter-pill-label">{label}</span> · {current?.label}
        </span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      {open && (
        <ul
          ref={menuRef}
          id={menuId}
          role="listbox"
          aria-label={label}
          className={`filter-menu${flip ? ' is-flipped' : ''}`}
          onKeyDown={onMenuKey}
        >
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <li
                key={option.value}
                role="option"
                aria-selected={selected}
                tabIndex={-1}
                className="filter-option"
                onClick={() => choose(option.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    choose(option.value);
                  }
                }}
              >
                <span className="filter-option-check" aria-hidden="true">
                  {selected && <Check size={15} />}
                </span>
                <span className="filter-option-label">{option.label}</span>
                {option.count !== undefined && (
                  <span className="filter-option-count">{option.count}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
