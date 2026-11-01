// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../src/i18n';

const DAY = '2037-11-04';
const savedEdits = () => JSON.parse(localStorage.getItem('japan-together.planEdits') ?? '{}');

/** A fresh copy of the app's modules, as after reopening the page (nothing kept in memory). */
async function reopen() {
  vi.resetModules();
  const { DayPlan } = await import('../src/features/itinerary/DayPlan');
  const { useLocalState } = await import('../src/hooks/useLocalState');
  await import('../src/i18n');
  return { DayPlan, useLocalState };
}

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('useLocalState', () => {
  it('shares one value between screens and saves it for the next visit', async () => {
    const { useLocalState } = await reopen();
    const NONE: string[] = [];
    const a = renderHook(() => useLocalState('stampBook', NONE));
    const b = renderHook(() => useLocalState('stampBook', NONE));
    act(() => a.result.current[1]([DAY]));
    expect(b.result.current[0]).toEqual([DAY]);
    expect(a.result.current[2].saved).toBe(true);
    expect(localStorage.getItem('japan-together.stampBook')).toBe(`["${DAY}"]`);

    const next = await reopen();
    const c = renderHook(() => next.useLocalState('stampBook', NONE));
    expect(c.result.current[0]).toEqual([DAY]);
  });

  it('keeps working for the visit when storage is blocked, and says it was not saved', async () => {
    const { useLocalState } = await reopen();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const { result } = renderHook(() => useLocalState('theme', null as string | null));
    act(() => result.current[1]('dark'));
    expect(result.current[0]).toBe('dark');
    expect(result.current[2].saved).toBe(false);
    vi.restoreAllMocks();
  });
});

describe('editing a day', () => {
  it('offers to clear the old this-phone-only edits, and only when there are some', async () => {
    let { DayPlan } = await reopen();
    render(<DayPlan date={DAY} now={null} reached={0} />);
    expect(screen.queryByRole('button', { name: i18n.t('edit.reset') })).toBeNull();

    // From before editing went live: UZU (12:30) moved on this phone only.
    cleanup();
    localStorage.setItem(
      'japan-together.planEdits',
      JSON.stringify({
        [DAY]: { moved: { 'd4-02': '12:45' }, replaced: {}, removed: [], added: [] },
      }),
    );
    ({ DayPlan } = await reopen());
    render(<DayPlan date={DAY} now={null} reached={0} />);
    expect(screen.getAllByText('12:45').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: i18n.t('edit.reset') }));
    expect(savedEdits()[DAY]).toBeUndefined();
    expect(screen.queryByText('12:45')).toBeNull();
  });
});

describe('the stamps on the plan', () => {
  const collect = new RegExp(`^${i18n.t('rally.collect', { title: '' }).trim()}`);

  it('inks the stamps of the stops the cat has reached, and only those', async () => {
    const { DayPlan } = await reopen();
    render(<DayPlan date={DAY} now={null} reached={2} />);
    const collected = i18n.t('rally.stamped', { title: '' }).replace(/^:\s*/, '');
    expect(screen.getAllByRole('img', { name: new RegExp(collected) })).toHaveLength(2);
    // During the trip the cat follows the clock, so the stamps aren't buttons.
    expect(screen.queryAllByRole('button', { name: collect })).toHaveLength(0);
  });

  it('before the trip, a stamp is a button that collects it', async () => {
    const { DayPlan } = await reopen();
    const onStamp = vi.fn();
    render(<DayPlan date={DAY} now={null} reached={0} onStamp={onStamp} />);
    const stamps = screen.getAllByRole('button', { name: collect });
    fireEvent.click(stamps[1]);
    expect(onStamp).toHaveBeenCalledWith(1);
  });
});

describe('the stamp rally', () => {
  async function renderRally() {
    vi.resetModules();
    const { StampRally } = await import('../src/features/itinerary/StampRally');
    const { ToastContext } = await import('../src/app/toastContext');
    const toasts: string[] = [];
    const rally = (date: string, reached: number) => (
      <ToastContext.Provider value={(message) => toasts.push(message)}>
        <StampRally date={date} count={4} reached={reached} dayTitle="Tokyo" onStop={() => {}} />
      </ToastContext.Provider>
    );
    return { toasts, rally, ...render(rally(DAY, 1)) };
  }

  it('announces a new stamp, but not the ones already there or another day’s', async () => {
    const { toasts, rally, rerender } = await renderRally();
    expect(toasts).toEqual([]);
    rerender(rally(DAY, 3));
    expect(toasts).toEqual([i18n.t('rally.newStamp', { points: 100 })]);
    rerender(rally('2037-11-05', 4));
    expect(toasts).toHaveLength(1);
  });

  it('tells a screen reader how many stamps the day has collected', async () => {
    await renderRally();
    const label = i18n.t('rally.mapLabel', { title: 'Tokyo', reached: 1, count: 4 });
    expect(screen.getByRole('img', { name: label })).toBeTruthy();
  });
});

describe('useForecast', () => {
  const tokyo = {
    name: 'Tokyo',
    label: 'טוקיו',
    lat: 35.6762,
    lon: 139.6503,
    accuWeather: { slug: 'tokyo', key: 226396 },
  };
  const answer = (date: string) => ({
    daily: {
      time: [date],
      weather_code: [1],
      temperature_2m_max: [19.4],
      temperature_2m_min: [11.2],
      precipitation_probability_max: [10],
    },
  });

  it('refreshes only the day asked for; other days still use their saved forecast', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2037-11-01T09:00:00+09:00'));
    const fetchMock = vi.fn(async (url: string) => {
      const date = new URL(url).searchParams.get('start_date')!;
      return new Response(JSON.stringify(answer(date)));
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.resetModules();
    const { useForecast } = await import('../src/features/weather/forecast');

    const { result, rerender } = renderHook(({ date }) => useForecast(tokyo, date), {
      initialProps: { date: '2037-11-03' },
    });
    await vi.waitFor(() => expect(result.current.state.status).toBe('ready'));
    rerender({ date: '2037-11-04' });
    await vi.waitFor(() =>
      expect(result.current.state).toMatchObject({ forecast: { date: '2037-11-04' } }),
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);

    rerender({ date: '2037-11-03' });
    await vi.waitFor(() => expect(result.current.state.status).toBe('ready'));
    expect(fetchMock).toHaveBeenCalledTimes(2); // from the cache

    act(() => result.current.refresh());
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));

    rerender({ date: '2037-11-04' });
    await vi.waitFor(() => expect(result.current.state.status).toBe('ready'));
    expect(fetchMock).toHaveBeenCalledTimes(3); // 4 November was not refreshed
    expect(result.current.state).toMatchObject({ forecast: { date: '2037-11-04', max: 19 } });
  });
});

describe('WeatherBadge', () => {
  it("links to that day's forecast for its city on AccuWeather, in the app's language", async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2037-10-01T09:00:00+09:00')); // too early: no fetch needed
    vi.resetModules();
    const { WeatherBadge } = await import('../src/features/weather/WeatherBadge');
    const { default: appI18n } = await import('../src/i18n');

    await act(() => appI18n.changeLanguage('he'));
    const { rerender } = render(<WeatherBadge date="2037-11-09" />);
    expect(screen.getByRole('link').getAttribute('href')).toBe(
      'https://www.accuweather.com/he/jp/kyoto-shi/224436/daily-weather-forecast/224436?day=40',
    );

    await act(() => appI18n.changeLanguage('en'));
    rerender(<WeatherBadge date="2037-11-09" />);
    expect(screen.getByRole('link').getAttribute('href')).toBe(
      'https://www.accuweather.com/en/jp/kyoto-shi/224436/daily-weather-forecast/224436?day=40',
    );
    await act(() => appI18n.changeLanguage('he'));
  });
});

describe('the hero skyline', () => {
  it('repeats the city at its phone size instead of stretching it, with one cat', async () => {
    const { Skyline } = await import('../src/features/itinerary/Skyline');
    const { container } = render(<Skyline />);
    const skyline = container.querySelector('svg.skyline');
    // No viewBox: a viewBox would scale the drawing up to the hero's width.
    expect(skyline?.getAttribute('viewBox')).toBeNull();
    expect(skyline?.querySelector('rect[fill="url(#skyline-block)"]')).not.toBeNull();
    expect(skyline?.querySelectorAll('.sk-cat')).toHaveLength(1);
  });
});
