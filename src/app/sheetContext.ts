import { createContext, useContext } from 'react';
import type { HotelId } from '../data/hotels';

/** What the one bottom sheet is showing. */
export type SheetContent =
  /** `noLeave`: opened from the tickets tab, so the leave time and route stay on the day screen. */
  | { kind: 'stop'; date: string; stopId: string; noLeave?: boolean }
  | { kind: 'add'; date: string }
  /** Without a date, the whole trip. */
  | { kind: 'export'; date?: string }
  | { kind: 'hotel'; hotelId: HotelId }
  | { kind: 'taxi'; hotelId: HotelId }
  | { kind: 'phrase'; phraseId: string };

export interface SheetApi {
  current: SheetContent | null;
  open: (content: SheetContent) => void;
  close: () => void;
}

export const SheetContext = createContext<SheetApi>({
  current: null,
  open: () => undefined,
  close: () => undefined,
});

/** Opens and closes the app's bottom sheet (a centred dialog on desktop). */
export const useSheet = () => useContext(SheetContext);
