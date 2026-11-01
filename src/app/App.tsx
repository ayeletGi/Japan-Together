import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SakuraPetals } from '../components/SakuraPetals';
import { Toast } from '../components/Toast';
import { TopBar } from '../components/TopBar';
import { useLiveVersion } from '../data/live';
import { BudgetPage } from '../features/budget/BudgetPage';
import { DeparturesPage } from '../features/departures/DeparturesPage';
import { DiscoverPage } from '../features/explore/DiscoverPage';
import { ListsPage } from '../features/lists/ListsPage';
import { DayPage } from '../features/itinerary/DayPage';
import { RoutePage } from '../features/maps/RoutePage';
import { SchedulePage } from '../features/schedule/SchedulePage';
import { TicketsPage } from '../features/tickets/TicketsPage';
import { UsefulPage } from '../features/useful/UsefulPage';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { SideRail } from './layout/SideRail';
import { MAIN_ID, SkipLink } from './layout/SkipLink';
import { TabBar } from './layout/TabBar';
import { rememberDay } from './lastDay';
import { activeNav, pageMotion, type PageMotion } from './navigation';
import { useHashRoute, type Route } from './router';
import { ScreenshotContext } from './screenshotContext';
import { SheetContext, type SheetContent } from './sheetContext';
import { SheetHost } from './SheetHost';
import { ToastContext } from './toastContext';
import './layout/layout.css';

function Page({ route }: { route: Route }) {
  switch (route.name) {
    case 'day':
      return <DayPage date={route.date} />;
    case 'route':
      return <RoutePage date={route.date} />;
    case 'departures':
      return <DeparturesPage />;
    case 'schedule':
      return <SchedulePage focus={route.focus} />;
    case 'discover':
      return <DiscoverPage tab={route.tab} date={route.date} eventId={route.eventId} />;
    case 'tickets':
      return <TicketsPage />;
    case 'budget':
      return <BudgetPage />;
    case 'lists':
      return <ListsPage listId={route.list} />;
    case 'useful':
      return <UsefulPage />;
  }
}

/** Sub-pages carry their own back header; every main screen gets the top bar. */
const hasTopBar = (route: Route) => route.name !== 'route' && route.name !== 'departures';

/** Changes only when the screen (not the day or a filter) changes, to replay the page motion. */
const screenKey = (route: Route) => `${activeNav(route)}/${route.name}`;

const TOAST_MS = 1800;

export function App() {
  // New changes from the live database redraw every screen.
  useLiveVersion();
  const route = useHashRoute();
  const { t, i18n } = useTranslation();
  const active = activeNav(route);
  const openDay = route.name === 'day' || route.name === 'route' ? route.date : undefined;
  const key = screenKey(route);

  // Page motion follows the screen that came before this one; changing only the day keeps it still.
  const [screen, setScreen] = useState<{ key: string; route: Route; motion: PageMotion | null }>(
    () => ({ key, route, motion: 'in' }),
  );
  if (screen.key !== key) setScreen({ key, route, motion: pageMotion(screen.route, route) });
  const motion = screen.key === key ? screen.motion : null;

  const page = useRef<HTMLDivElement>(null);
  useScrollReveal(page, key);

  useEffect(() => {
    if (openDay) rememberDay(openDay);
  }, [openDay]);

  useEffect(() => {
    document.title = `${t('app.name')} · ${t(`nav.items.${active}`)}`;
  }, [active, t, i18n.language]);

  // The one sheet. Closing returns focus to whatever opened it.
  const [sheet, setSheet] = useState<SheetContent | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const sheetApi = useMemo(
    () => ({
      current: sheet,
      open: (content: SheetContent) => {
        if (!sheet) opener.current = document.activeElement as HTMLElement | null;
        setSheet(content);
      },
      close: () => {
        setSheet(null);
        opener.current?.focus({ preventScroll: true });
        opener.current = null;
      },
    }),
    [sheet],
  );
  useEffect(() => setSheet(null), [key]);

  const [toast, setToast] = useState<{ message: string; id: number } | null>(null);
  const showToast = useCallback((message: string) => setToast({ message, id: Date.now() }), []);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const [screenshot, setScreenshot] = useState(false);
  const screenshotApi = useMemo(() => ({ on: screenshot, set: setScreenshot }), [screenshot]);
  useEffect(() => setScreenshot(false), [key]);

  return (
    <ScreenshotContext.Provider value={screenshotApi}>
      <ToastContext.Provider value={showToast}>
        <SheetContext.Provider value={sheetApi}>
          <SkipLink />
          <SakuraPetals />
          <div className={`app-shell${screenshot ? ' app--screenshot' : ''}`}>
            <SideRail active={active} />
            <div className="app-main">
              {hasTopBar(route) && <TopBar />}
              <main id={MAIN_ID} tabIndex={-1}>
                <div className={`page${motion ? ` page--${motion}` : ''}`} key={key} ref={page}>
                  <Page route={route} />
                </div>
              </main>
            </div>
          </div>
          {!screenshot && <TabBar active={active} />}
          {screenshot && (
            <button
              type="button"
              className="btn btn--small screenshot-exit"
              onClick={() => setScreenshot(false)}
            >
              {t('schedule.screenshotExit')}
            </button>
          )}
          <SheetHost />
          <Toast message={toast?.message ?? null} />
        </SheetContext.Provider>
      </ToastContext.Provider>
    </ScreenshotContext.Provider>
  );
}
