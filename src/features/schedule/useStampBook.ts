import { useLocalState } from '../../hooks/useLocalState';

const NO_DAYS: string[] = [];

/** Days we put into the stamp book on this phone (YYYY-MM-DD), shared by Today and the schedule. */
export const useStampBook = () => useLocalState('stampBook', NO_DAYS);
