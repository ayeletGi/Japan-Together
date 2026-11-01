import { describe, expect, it } from 'vitest';
import { allEvents, defaultDate, getDay, tripToday } from '../src/data/trip';
import { estimatedLeaves } from '../src/data/departures';
import { leaveFor } from '../src/features/departures/leaves';
import { helpAround } from '../src/features/itinerary/helpLinks';
import {
  applyPlanEdits,
  hasEdits,
  NO_EDITS,
  type DayEdits,
} from '../src/features/itinerary/planEdits';
import {
  currentMinutes,
  dayClock,
  nextUp,
  reachedCount,
  splitDuration,
  stopState,
} from '../src/features/itinerary/progress';
import { routePath, stopPoints } from '../src/features/itinerary/rallyGeometry';
import { baseStops, isPinned } from '../src/features/itinerary/stops';
import { daySuggestions } from '../src/features/itinerary/suggestions';
import { walkingTip } from '../src/features/weather/walkingTip';
import { daysUntilTrip, isTripMode } from '../src/lib/tripMode';

// The plan logic is tested on 4.11 as planned, without the optional luggage reminder added later.
const fullDay4 = getDay('2037-11-04')!;
const day4 = { ...fullDay4, events: fullDay4.events.filter((e) => !e.id.startsWith('luggage-')) };
const day10 = getDay('2037-11-10')!;
const ids = (stops: { id: string }[]) => stops.map((stop) => stop.id);

describe('trip mode', () => {
  it('starts at midnight Israel time on 2 November', () => {
    expect(isTripMode(new Date('2037-11-01T23:59:00+02:00'))).toBe(false);
    expect(isTripMode(new Date('2037-11-02T00:00:00+02:00'))).toBe(true);
    expect(daysUntilTrip(new Date('2037-10-14T12:00:00+03:00'))).toBe(19);
    expect(daysUntilTrip(new Date('2037-11-05T12:00:00+09:00'))).toBe(0);
  });
});

describe('leave times', () => {
  it('uses the checked plans as facts and marks the prototype times as estimates', () => {
    expect(leaveFor('d4-01')).toMatchObject({ leave: '08:45', arriveBy: '09:45', estimate: false });
    expect(leaveFor('d4-01')!.steps[0]).toContain('Shinagawa');
    expect(leaveFor('d16-01')).toMatchObject({ leave: '07:00', from: 'shuttle' });
    expect(leaveFor('d10-04')).toMatchObject({ leave: '15:10', from: 'park', estimate: true });
    expect(estimatedLeaves.every((leave) => leave.estimate)).toBe(true);
    for (const estimate of estimatedLeaves)
      expect(
        allEvents.some((event) => event.id === estimate.eventId),
        estimate.eventId,
      ).toBe(true);
    expect(leaveFor('d4-02')).toBeUndefined();
  });
});

describe('stops and pins', () => {
  it('pins everything booked with a fixed time or a ticket, and nothing else', () => {
    const pinned = allEvents.filter(isPinned).map((event) => event.id);
    expect(pinned).toEqual(
      expect.arrayContaining(['d2-01', 'd4-01', 'd5-03', 'd9-03', 'd9-05', 'd10-04', 'd12-04']),
    );
    expect(pinned).toEqual(expect.arrayContaining(['d6-04', 'd7-01', 'd16-01', 'd18-03']));
    for (const id of ['d3-03', 'd5-01', 'd4-02', 'd12-03', 'laundry-kobe'])
      expect(pinned, id).not.toContain(id);
  });

  it('builds the day in lived order with leave times and tickets attached', () => {
    const stops = baseStops(day4);
    expect(ids(stops)).toEqual([
      'd4-01',
      'd4-02',
      'd4-03',
      'shop-itoya-ginza',
      'd4-04',
      'gym-2037-11-04',
    ]);
    expect(stops[0]).toMatchObject({ time: '10:00', pinned: true });
    expect(stops[0].leave?.leave).toBe('08:45');
    expect(stops[0].ticket?.id).toBe('teamlab');
    expect(stops[1].pinned).toBe(false);
  });
});

describe('day progress', () => {
  const stops = baseStops(day4);
  const before = new Date('2037-10-14T12:00:00+03:00');

  it('walks before the trip and follows the Japan clock during it', () => {
    expect(dayClock('2037-11-04', before, 2)).toEqual({ kind: 'walk', reached: 2 });
    expect(dayClock('2037-11-04', new Date('2037-11-05T09:00:00+09:00'), 0)).toEqual({
      kind: 'past',
    });
    expect(dayClock('2037-11-04', new Date('2037-11-03T09:00:00+09:00'), 0)).toEqual({
      kind: 'future',
    });
    expect(dayClock('2037-11-04', new Date('2037-11-04T12:40:00+09:00'), 0)).toEqual({
      kind: 'clock',
      minutes: 12 * 60 + 40,
    });
  });

  it('counts reached stops and knows what is happening now', () => {
    expect(reachedCount(stops, { kind: 'clock', minutes: 12 * 60 + 40 })).toBe(2);
    expect(reachedCount(stops, { kind: 'past' })).toBe(6);
    expect(reachedCount(stops, { kind: 'walk', reached: 9 })).toBe(6);
    expect(currentMinutes(stops, { kind: 'walk', reached: 0 })).toBe(6 * 60);
    expect(currentMinutes(stops, { kind: 'walk', reached: 1 })).toBe(10 * 60);
    expect(currentMinutes(stops, { kind: 'future' })).toBeNull();
    expect(stopState(stops, 1, 12 * 60 + 40)).toBe('now');
    expect(stopState(stops, 0, 12 * 60 + 40)).toBe('past');
    expect(stopState(stops, 2, 12 * 60 + 40)).toBe('upcoming');
  });

  it('says when to leave until it is time, then counts down to the stop', () => {
    const at = (clock: string) => new Date(`2037-11-04T${clock}:00+09:00`);
    expect(
      nextUp(stops, { kind: 'clock', minutes: 6 * 60 }, '2037-11-04', at('06:00')),
    ).toMatchObject({
      kind: 'leave',
      inMinutes: 165,
    });
    expect(
      nextUp(stops, { kind: 'clock', minutes: 9 * 60 }, '2037-11-04', at('09:00')),
    ).toMatchObject({
      kind: 'stop',
      inMinutes: 60,
    });
    // Before the trip the countdown counts the real days too (20 days 14:45 to leave).
    expect(nextUp(stops, { kind: 'walk', reached: 0 }, '2037-11-04', before)).toMatchObject({
      kind: 'leave',
      inMinutes: 20 * 1440 + 14 * 60 + 45,
    });
    expect(nextUp(stops, { kind: 'past' }, '2037-11-04', at('09:00'))).toEqual({ kind: 'done' });
    expect(splitDuration(165)).toEqual({ days: 0, hours: 2, minutes: 45 });
    expect(splitDuration(18 * 1440 + 125)).toEqual({ days: 18, hours: 2, minutes: 5 });
  });
});

describe('rally map', () => {
  it('starts at the hotel and mirrors for English', () => {
    const rtl = stopPoints(4, true);
    const ltr = stopPoints(4, false);
    expect(rtl).toHaveLength(5);
    expect(rtl[0]).toEqual([322, 92]);
    expect(ltr[0]).toEqual([18, 92]);
    expect(rtl[4][0]).toBeCloseTo(26);
    expect(routePath(rtl.slice(0, 2))).toBe('M322 92 C285 92 285 44 248 44');
  });
});

describe('old this-phone-only plan edits', () => {
  const plan = applyPlanEdits(day4);
  const edits = (change: Partial<DayEdits>): DayEdits => ({ ...NO_EDITS, ...change });

  it('changes nothing without edits', () => {
    expect(ids(plan)).toEqual(ids(baseStops(day4)));
    expect(hasEdits(NO_EDITS)).toBe(false);
  });

  it('shows a moved stop in its new place, and never moves a pinned one', () => {
    const moved = applyPlanEdits(day4, edits({ moved: { 'd4-02': '17:00', 'd4-01': '20:00' } }));
    expect(moved.find((stop) => stop.id === 'd4-02')).toMatchObject({
      time: '17:00',
      edit: 'moved',
    });
    expect(moved[0]).toMatchObject({ id: 'd4-01', time: plan[0].time });
  });

  it('moves leave times with their stop', () => {
    const day6 = getDay('2037-11-06')!;
    const nunobiki = applyPlanEdits(day6)[0];
    expect(nunobiki.leave?.leave).toBe('09:35');
    const moved = applyPlanEdits(day6, edits({ moved: { [nunobiki.id]: '10:30' } }))[0];
    expect(moved.leave).toMatchObject({ leave: '10:05', arriveBy: '10:25' });
  });

  it('shows replaced, removed and added stops', () => {
    const day = applyPlanEdits(
      day4,
      edits({
        replaced: { 'd4-02': { title: 'Afuri', note: 'נוסף על ידינו', kind: 'food' } },
        removed: ['d4-03'],
        added: [{ id: 'added-1', time: '18:00', title: 'Ginza Six', note: '', kind: 'shop' }],
      }),
    );
    expect(day[1]).toMatchObject({ id: 'd4-02', title: 'Afuri', edit: 'replaced', time: '12:30' });
    expect(day[1].event).toBeUndefined();
    expect(ids(day)).toEqual([
      'd4-01',
      'd4-02',
      'shop-itoya-ginza',
      'added-1',
      'd4-04',
      'gym-2037-11-04',
    ]);
    expect(hasEdits(edits({ removed: ['d4-03'] }))).toBe(true);
  });
});

describe('the departure day, lived in Israel', () => {
  // LY91 leaves at 19:00 Israel time (02:00 the next day in Japan).
  const day2 = getDay('2037-11-02')!;
  const stops = baseStops(day2);
  const israel = (clock: string, date = '2037-11-02') => new Date(`${date}T${clock}:00+02:00`);

  it('stays the day the app opens on until midnight in Israel', () => {
    expect(defaultDate(israel('18:00'))).toBe('2037-11-02');
    expect(tripToday(israel('23:30'))).toBe('2037-11-02');
    expect(defaultDate(israel('00:30', '2037-11-03'))).toBe('2037-11-03');
  });

  it('follows the Israel clock, so the flight is not done hours early', () => {
    const noon = dayClock('2037-11-02', israel('12:00'), 0);
    expect(noon).toEqual({ kind: 'clock', minutes: 12 * 60 });
    expect(reachedCount(stops, noon)).toBe(0);
    expect(dayClock('2037-11-02', israel('18:00'), 0)).toMatchObject({ kind: 'clock' });
  });

  it('counts down to the flight in real time', () => {
    const next = nextUp(
      stops,
      dayClock('2037-11-02', israel('16:00'), 0),
      '2037-11-02',
      israel('16:00'),
    );
    expect(next).toMatchObject({ kind: expect.stringMatching(/leave|stop/) });
    if (next.kind === 'stop') expect(next.inMinutes).toBe(3 * 60);
    if (next.kind === 'leave') expect(next.inMinutes).toBeLessThan(3 * 60);
  });
});

describe('weather tip', () => {
  it('puts rain first, then a cold morning', () => {
    expect(walkingTip({ min: 12, rainChance: 70 })).toBe('umbrella');
    expect(walkingTip({ min: 8, rainChance: 10 })).toBe('layer');
    expect(walkingTip({ min: 12, rainChance: null })).toBe('perfect');
  });
});

describe('help around a stop', () => {
  it('routes from the morning hotel to the first stop and from stop to stop after that', () => {
    const stops = baseStops(day4);
    const first = helpAround(stops, 0);
    const url = new URL(first.directions!.url);
    expect(url.searchParams.get('origin')).toBe('Shinagawa Prince Hotel Tokyo');
    expect(url.searchParams.get('destination')).toBe('teamLab Planets TOKYO Toyosu');
    expect(first.calendar).toMatchObject({ start: '10:00', end: '10:30' });
    const second = new URL(helpAround(stops, 1).directions!.url);
    expect(second.searchParams.get('origin')).toBe('teamLab Planets TOKYO Toyosu');
    expect(first.konbini).toContain('convenience+store+near');
  });

  it('gives no directions inside a park', () => {
    const stops = baseStops(day10);
    const mario = stops.findIndex((stop) => stop.id === 'd10-05');
    expect(helpAround(stops, mario).directions).toBeUndefined();
  });
});

describe('suggestions', () => {
  it('offers the day’s Discover picks that are not already planned', () => {
    const stops = baseStops(day4);
    const list = daySuggestions('2037-11-04', stops);
    expect(list.length).toBeGreaterThan(0);
    expect(list.map((item) => item.title)).not.toContain('Vegan Ramen UZU Tokyo');
    expect(new Set(list.map((item) => item.id)).size).toBe(list.length);
  });
});
