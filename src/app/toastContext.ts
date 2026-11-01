import { createContext, useContext } from 'react';

/** Shows a short message at the bottom of the screen for a moment. */
export const ToastContext = createContext<(message: string) => void>(() => undefined);

export const useToast = () => useContext(ToastContext);
