// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SheetContext, type SheetContent } from '../src/app/sheetContext';
import { ToastContext } from '../src/app/toastContext';
import { DayPlan } from '../src/features/itinerary/DayPlan';
import { ExportSheet } from '../src/features/itinerary/ExportSheet';
import { SchedulePage } from '../src/features/schedule/SchedulePage';
import i18n from '../src/i18n';

const DAY = '2037-11-05';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function renderWithSheet(ui: React.ReactNode) {
  const toasts: string[] = [];
  const opened: SheetContent[] = [];
  const close = vi.fn();
  render(
    <SheetContext.Provider value={{ current: null, open: (c) => opened.push(c), close }}>
      <ToastContext.Provider value={(message) => toasts.push(message)}>{ui}</ToastContext.Provider>
    </SheetContext.Provider>,
  );
  return { toasts, opened, close };
}

/** jsdom's Blob has no text(), so read it the old way. */
const readBlob = (blob: Blob) =>
  new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsText(blob);
  });

const option = (key: 'export.ai' | 'export.pdf' | 'export.excel') =>
  screen.getByRole('button', { name: new RegExp(`^${i18n.t(key)}`) });

describe('export buttons', () => {
  it('opens the export sheet for the day from the day plan', () => {
    const { opened } = renderWithSheet(<DayPlan date={DAY} now={null} reached={0} />);
    fireEvent.click(screen.getByRole('button', { name: i18n.t('export.button') }));
    expect(opened).toEqual([{ kind: 'export', date: DAY }]);
  });

  it('opens the export sheet for the whole trip from the trip calendar', () => {
    const { opened } = renderWithSheet(<SchedulePage />);
    fireEvent.click(screen.getByRole('button', { name: i18n.t('export.button') }));
    expect(opened).toEqual([{ kind: 'export' }]);
  });
});

describe('export sheet', () => {
  it('copies the day as text, says so and closes', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    const { toasts, close } = renderWithSheet(<ExportSheet date={DAY} />);
    await act(async () => fireEvent.click(option('export.ai')));
    expect(writeText.mock.calls[0][0]).toContain('יום 4 מתוך 17');
    expect(toasts).toEqual([i18n.t('export.copied')]);
    expect(close).toHaveBeenCalled();
  });

  it('says when copying failed and stays open', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    document.execCommand = vi.fn().mockReturnValue(false);
    const { toasts, close } = renderWithSheet(<ExportSheet date={DAY} />);
    await act(async () => fireEvent.click(option('export.ai')));
    expect(toasts).toEqual([i18n.t('export.copyFailed')]);
    expect(close).not.toHaveBeenCalled();
  });

  it('downloads the whole trip as a CSV file', async () => {
    const blobs: Blob[] = [];
    URL.createObjectURL = vi.fn((blob: Blob) => (blobs.push(blob), 'blob:plan'));
    URL.revokeObjectURL = vi.fn();
    const names: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      names.push(this.download);
    });
    const { toasts } = renderWithSheet(<ExportSheet />);
    fireEvent.click(option('export.excel'));
    expect(names).toEqual(['japan-plan.csv']);
    expect(blobs[0].type).toBe('text/csv;charset=utf-8');
    expect(await readBlob(blobs[0])).toContain(i18n.t('export.columns.stop'));
    expect(toasts).toEqual([i18n.t('export.downloaded')]);
  });

  it('prints the plan for PDF and removes the printed copy afterwards', () => {
    let rows = 0;
    window.print = vi.fn(() => {
      rows = document.querySelectorAll('.print-plan tbody tr').length;
    });
    renderWithSheet(<ExportSheet date={DAY} />);
    fireEvent.click(option('export.pdf'));
    expect(window.print).toHaveBeenCalledTimes(1);
    expect(rows).toBeGreaterThan(0);
    act(() => {
      window.dispatchEvent(new Event('afterprint'));
    });
    expect(document.querySelector('.print-plan')).toBeNull();
  });
});
