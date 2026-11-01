import { createContext, useContext } from 'react';

export interface ScreenshotMode {
  on: boolean;
  set: (on: boolean) => void;
}

/** "Screenshot mode" hides the navigation so the schedule can be captured and sent as is. */
export const ScreenshotContext = createContext<ScreenshotMode>({
  on: false,
  set: () => undefined,
});

export const useScreenshotMode = () => useContext(ScreenshotContext);
