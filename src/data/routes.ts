import { hotels } from './hotels';
import { liveChanges } from './live';
import type { DayRoute, RouteSegment, RouteStop } from './types';
import type { TravelMode } from '../lib/maps';

/**
 * Leg-by-leg routes for every day, following the original plan's DAY_DIRECTIONS in the order the day is lived.
 * Each leg has an explicit mode; Shabbat legs are walking only. Durations are never stored here —
 * the Maps link computes them live.
 */

const stop = (label: string, query: string): RouteStop => ({ label, query });
const hotelStop = (id: keyof typeof hotels) => stop(hotels[id].shortName, hotels[id].mapsQuery);

const P = {
  bgu: stop('נתב״ג T3', 'Ben Gurion Airport Terminal 3'),
  narita: stop('נריטה T1', 'Narita International Airport Terminal 1'),
  shinagawa: hotelStop('shinagawa'),
  kobe: hotelStop('kobe'),
  osaka: hotelStop('osakaNamba'),
  omori: hotelStop('omori'),
  oriental: hotelStop('orientalTokyoBay'),
  shinagawaStation: stop('תחנת Shinagawa', 'Shinagawa Station Tokyo'),
  shinKobe: stop('Shin-Kobe', 'Shin-Kobe Station'),
  shinOsaka: stop('Shin-Osaka', 'Shin-Osaka Station'),
  chabadKobe: stop('חב״ד קובה', '4 Chome-12-12 Kitanocho, Chuo Ward, Kobe, Hyogo 650-0002'),
  chabadTokyo: stop('חב״ד טוקיו', '1-25-21 Sanno, Ota City, Tokyo 143-0023'),
  goldsOmori: stop('Gold’s Gym Omori', 'Golds Gym South Tokyo ANNEX Omori'),
};

interface Leg {
  to: RouteStop;
  mode: TravelMode;
  eventId?: string;
  bookedTrain?: boolean;
  shuttle?: boolean;
  shabbat?: boolean;
}

function route(date: string, start: RouteStop, legs: Leg[], note?: string): DayRoute {
  let from = start;
  const segments: RouteSegment[] = legs.map((leg, index) => {
    const segment: RouteSegment = {
      id: `${date}-${index + 1}`,
      from: from.query,
      to: leg.to.query,
      fromLabel: from.label,
      toLabel: leg.to.label,
      mode: leg.mode,
      eventId: leg.eventId,
      bookedTrain: leg.bookedTrain,
      shuttle: leg.shuttle,
      shabbat: leg.shabbat,
    };
    from = leg.to;
    return segment;
  });
  return { date, start, segments, note };
}

const t = (to: RouteStop, eventId?: string, extra: Partial<Leg> = {}): Leg => ({
  to,
  mode: 'transit',
  eventId,
  ...extra,
});
const w = (to: RouteStop, eventId?: string, extra: Partial<Leg> = {}): Leg => ({
  to,
  mode: 'walking',
  eventId,
  ...extra,
});

export const dayRoutes: DayRoute[] = [
  route('2037-11-02', P.bgu, [], 'flight'),
  route('2037-11-03', P.narita, [
    t(stop('T’s Tantan', "T's Tantan Gransta Tokyo"), 'd3-04'),
    t(P.shinagawa, 'd3-03'),
    t(stop('TSUMINAKI', 'TSUMINAKI Mapo Tofu Toranomon Tokyo'), 'd3-05'),
    t(P.shinagawa),
  ]),
  route('2037-11-04', P.shinagawa, [
    t(stop('teamLab Planets', 'teamLab Planets TOKYO Toyosu'), 'd4-01'),
    w(stop('UZU Tokyo', 'Vegan Ramen UZU Tokyo teamLab Planets'), 'd4-02'),
    t(stop('גינזה', 'Ginza Tokyo'), 'd4-03'),
    w(stop('Ginza Itoya', 'Ginza Itoya 2-7-15 Ginza Tokyo'), 'shop-itoya-ginza'),
    w(stop('KOMEDA is', 'KOMEDA is Higashi Ginza Tokyo'), 'd4-04'),
    t(P.shinagawa, 'gym-2037-11-04'),
  ]),
  route('2037-11-05', P.shinagawa, [
    t(stop('Nakano Broadway', 'Nakano Broadway Tokyo'), 'd5-02'),
    t(P.shinagawaStation),
    t(P.shinKobe, 'd5-03', { bookedTrain: true }),
    t(P.kobe, 'd5-04'),
  ]),
  route('2037-11-06', P.kobe, [
    t(stop('Nunobiki Herb Gardens', 'Kobe Nunobiki Herb Gardens Ropeway'), 'd6-01'),
    t(stop('Veggie Junkies', 'Veggie Junkies Burger Barom Kobe Motomachi'), 'd6-02'),
    t(P.kobe, 'd6-03'),
    w(P.chabadKobe, 'd6-04', { shabbat: true }),
    w(P.kobe, undefined, { shabbat: true }),
  ]),
  route('2037-11-07', P.kobe, [
    w(P.chabadKobe, 'd7-01', { shabbat: true }),
    w(P.kobe, undefined, { shabbat: true }),
    t(stop('Vegan Bread 4690', 'Vegan Bread 4690 Kobe'), 'd7-02'),
    t(
      stop('Gold’s Gym Kobe Motomachi', 'Golds Gym Kobe Motomachi 47 Akashimachi Kobe'),
      'gym-kobe-motzash',
    ),
    t(P.kobe),
  ]),
  route('2037-11-08', P.kobe, [
    w(stop('תחנת Sannomiya', 'Sannomiya Station Kobe'), 'd8-02'),
    t(stop('MERCY Vegan Factory', 'MERCY Vegan Factory Osaka Honten'), 'd8-03'),
    t(P.osaka, 'd8-04'),
    w(stop('Dotonbori', 'Dotonbori Osaka'), 'd8-05'),
    w(
      stop('Shinsaibashi-suji', 'Shinsaibashi-suji Shopping Street Osaka'),
      'osaka-shinsaibashi-shopping',
    ),
    w(stop('Shojin Sushi Minamo', 'Shojin Sushi Minamo Osaka Shinsaibashi'), 'd8-06'),
    w(P.osaka),
  ]),
  route('2037-11-09', P.osaka, [
    t(stop('MOMO Gion', 'Kimono Rental MOMO Gion, Kyoto Higashiyama Ward, Yamatocho 12'), 'd9-03'),
    w(stop('Hanamikoji', 'Hanamikoji Street Kyoto'), 'gion-walk'),
    w(stop('ZIRAEL', 'ZIRAEL Vegan Restaurant Kyoto Gion'), 'd9-04'),
    t(stop('UZU Kyoto', '146 Umenokicho, Nakagyo Ward, Kyoto 604-0905, Japan'), 'd9-05'),
    t(P.osaka, 'd9-06'),
  ]),
  route('2037-11-10', P.osaka, [
    t(stop('Universal Studios Japan', 'Universal Studios Japan Osaka'), 'd10-01'),
    t(stop('THE SECONDROOM', 'Vegan & Gluten Free Osaka THE SECONDROOM'), 'd10-08'),
    t(P.osaka),
  ]),
  route('2037-11-11', P.osaka, [
    t(stop('Green Earth', 'Green Earth Osaka Vegan'), 'd11-02'),
    t(stop('Shinsaibashi', 'Shinsaibashi Shopping Arcade Osaka'), 'd11-03'),
    t(stop('Tools Osaka Umeda', 'Tools Osaka Umeda Whity Umeda Osaka'), 'tools-osaka-option'),
    t(P.shinOsaka, 'shin-osaka-buffer'),
    t(P.shinagawaStation, 'd11-04', { bookedTrain: true }),
    t(P.omori, 'd11-05'),
  ]),
  route('2037-11-12', P.omori, [
    t(stop('שיבויה', 'Shibuya Tokyo'), 'd12-01'),
    w(stop('SHIBUYA109', 'SHIBUYA109 2-29-1 Dogenzaka Tokyo'), 'shibuya-109'),
    t(stop('Brown Rice', 'Brown Rice Tokyo Omotesando'), 'd12-02'),
    w(stop('Kiddy Land Harajuku', 'Kiddy Land Harajuku 6-1-9 Jingumae Tokyo'), 'harajuku-shopping'),
    t(stop('Shibuya PARCO', 'Shibuya PARCO 15-1 Udagawacho Tokyo'), 'shibuya-parco'),
    w(stop('Vegan Sushi Tokyo', 'Vegan Sushi Tokyo Shibuya'), 'd12-03'),
    w(stop('Head Spa · ANNEX', 'The Head Spa Tokyo Annex 3-6-19 Shibuya Tokyo'), 'd12-04'),
    t(P.omori),
  ]),
  route('2037-11-13', P.omori, [
    t(stop('HealthyTOKYO', 'HealthyTOKYO Shinjuku Marui Honkan'), 'd13-01'),
    w(stop('Shinjuku Gyoen', 'Shinjuku Gyoen National Garden Tokyo'), 'd13-02'),
    w(stop('Sekaido', 'Sekaido Shinjuku 3-1-1 Shinjuku Tokyo'), 'sekaido-shinjuku'),
    w(stop('AIN SOPH. Journey', 'AIN SOPH Journey Shinjuku'), 'd13-03'),
    t(stop('Nakano Broadway', 'Nakano Broadway Tokyo'), 'd13-04'),
    t(P.chabadTokyo, 'd13-05'),
    w(P.omori, undefined, { shabbat: true }),
  ]),
  route('2037-11-14', P.omori, [
    w(P.chabadTokyo, 'd14-01', { shabbat: true }),
    w(P.omori, undefined, { shabbat: true }),
    w(P.goldsOmori, 'gym-2037-11-14'),
    w(P.omori),
  ]),
  route('2037-11-15', P.omori, [
    t(stop('Shibuya Sky', 'Shibuya Sky Tokyo'), 'd15-02'),
    t(stop('Hemp Cafe', 'Hemp Cafe Tokyo Ebisu'), 'd15-03'),
    t(stop('Shibuya Center-gai', 'Shibuya Center-gai Tokyo'), 'shibuya-markets'),
    t(stop('T’s Tantan · תחנת Tokyo', "T's Tantan Gransta Tokyo"), 'd15-04'),
    t(P.oriental, 'd15-05'),
  ]),
  route('2037-11-16', P.oriental, [
    t(stop('Tokyo Disneyland', 'Tokyo Disneyland'), 'd16-01', { shuttle: true }),
    t(P.oriental, 'shuttle-back-16', { shuttle: true }),
  ]),
  route('2037-11-17', P.oriental, [
    t(stop('Tokyo DisneySea', 'Tokyo DisneySea'), 'd17-01', { shuttle: true }),
    t(P.oriental, 'shuttle-back-17', { shuttle: true }),
  ]),
  route('2037-11-18', P.oriental, [t(P.narita, 'd18-02')]),
];

/** Departure-type events share the leg of the stop they lead to. */
export const sharedLegs: Record<string, string> = {
  'd3-02': 'd3-03',
  'd9-02': 'd9-03',
  'shuttle-to-disney-16': 'd16-01',
  'shuttle-to-disney-17': 'd17-01',
};

/** The day's route. A stop whose place changed later (a swapped restaurant) leads to the new place. */
export function routeFor(date: string): DayRoute | undefined {
  const dayRoute = dayRoutes.find((candidate) => candidate.date === date);
  if (!dayRoute) return undefined;
  const changes = liveChanges().events;
  if (!dayRoute.segments.some((segment) => segment.eventId && changes[segment.eventId]?.place)) {
    return dayRoute;
  }
  let moved: RouteStop | undefined;
  const segments = dayRoute.segments.map((segment) => {
    let next = moved ? { ...segment, from: moved.query, fromLabel: moved.label } : segment;
    moved = undefined;
    const change = segment.eventId ? changes[segment.eventId] : undefined;
    if (change?.place) {
      moved = stop(change.placeLabel ?? change.title ?? segment.toLabel, change.place);
      next = { ...next, to: moved.query, toLabel: moved.label };
    }
    return next;
  });
  return { ...dayRoute, segments };
}

/** Events inside a park or venue: a Maps link to them would not help. */
export const inVenueEvents = new Set([
  'd10-02',
  'd10-03',
  'd10-04',
  'd10-05',
  'd10-06',
  'd10-07',
  'd16-02',
  'd17-02',
]);
