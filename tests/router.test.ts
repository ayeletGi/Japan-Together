import { describe, expect, it } from 'vitest';
import { activeNav, navItems, pageMotion } from '../src/app/navigation';
import { parseRoute, paths } from '../src/app/router';

const before = new Date('2037-10-13T12:00:00+09:00');
const during = new Date('2037-11-09T08:00:00+09:00');

describe('hash router', () => {
  it('parses every screen and round-trips with the path builders', () => {
    expect(parseRoute(paths.day('2037-11-04'))).toEqual({ name: 'day', date: '2037-11-04' });
    expect(parseRoute(paths.route('2037-11-12'))).toEqual({ name: 'route', date: '2037-11-12' });
    expect(parseRoute(paths.departures())).toEqual({ name: 'departures' });
    expect(parseRoute(paths.schedule())).toEqual({ name: 'schedule' });
    expect(parseRoute(paths.budget())).toEqual({ name: 'budget' });
    expect(parseRoute(paths.useful())).toEqual({ name: 'useful' });
    expect(parseRoute(paths.lists())).toEqual({ name: 'lists' });
    expect(parseRoute(paths.discover('gyms'))).toEqual({
      name: 'discover',
      tab: 'gyms',
      date: undefined,
      eventId: undefined,
    });
    expect(parseRoute(paths.discover('food', { date: '2037-11-04', eventId: 'd4-02' }))).toEqual({
      name: 'discover',
      tab: 'food',
      date: '2037-11-04',
      eventId: 'd4-02',
    });
  });

  it('keeps the old links working', () => {
    expect(parseRoute('#/tickets')).toEqual({ name: 'tickets' });
    expect(parseRoute('#/gifts')).toEqual({ name: 'lists' });
    expect(parseRoute('#/more')).toEqual({ name: 'useful' });
    expect(parseRoute('#/more/yen')).toEqual({ name: 'useful' });
    expect(parseRoute('#/more/budget')).toEqual({ name: 'budget' });
    expect(parseRoute('#/more/hotels')).toEqual({ name: 'schedule', focus: 'hotels' });
    expect(parseRoute('#/more/settings')).toEqual({ name: 'useful' });
  });

  it('opens on the first day before the trip and on today during it', () => {
    for (const hash of ['', '#', '#/nope', '#/day/not-a-date', '#/day/2037-12-01', '#/more/x'])
      expect(parseRoute(hash, before)).toEqual({ name: 'day', date: '2037-11-02' });
    expect(parseRoute('', during)).toEqual({ name: 'day', date: '2037-11-09' });
  });
});

describe('navigation', () => {
  it('has exactly seven tabs in the agreed order', () => {
    expect(navItems.map((item) => item.id)).toEqual([
      'today',
      'discover',
      'schedule',
      'tickets',
      'budget',
      'lists',
      'useful',
    ]);
  });

  it('highlights the right tab', () => {
    expect(activeNav(parseRoute(paths.route('2037-11-04')))).toBe('today');
    expect(activeNav(parseRoute(paths.departures()))).toBe('today');
    expect(activeNav(parseRoute('#/more/hotels'))).toBe('schedule');
    expect(activeNav(parseRoute('#/tickets'))).toBe('tickets');
    expect(activeNav(parseRoute(paths.discover('shopping')))).toBe('discover');
  });

  it('slides into sub-pages and back, swoops between tabs, and stays still for a new day', () => {
    const day = parseRoute(paths.day('2037-11-04'));
    const otherDay = parseRoute(paths.day('2037-11-05'));
    const route = parseRoute(paths.route('2037-11-04'));
    expect(pageMotion(undefined, day)).toBe('in');
    expect(pageMotion(day, route)).toBe('forward');
    expect(pageMotion(route, day)).toBe('back');
    expect(pageMotion(day, otherDay)).toBeNull();
    expect(pageMotion(day, parseRoute(paths.schedule()))).toBe('tab-next');
    expect(pageMotion(route, parseRoute(paths.budget()))).toBe('tab-next');
    expect(pageMotion(parseRoute(paths.useful()), parseRoute(paths.discover()))).toBe('tab-prev');
    expect(
      pageMotion(parseRoute(paths.discover('food')), parseRoute(paths.discover('gyms'))),
    ).toBeNull();
  });
});
