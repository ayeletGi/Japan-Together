# Japan Together

A trip companion web app for a 17-day itinerary in Japan, built with React, TypeScript and Vite. The interface is bilingual: Hebrew (RTL, default) and English (LTR).

> **Demo copy.** This is a public copy of a private repository. The traveller names, trip year and booking amounts are sample data; the code is the same.

**Status:** all 17 days, 89 activities and every screen are implemented. The app runs on Cloudflare Workers with a D1 (SQLite) database for changes made during the trip (see [Publishing](#publishing)), with a one-file offline copy for use without signal.

Built with AI-assisted development: I designed the app and its data model, and directed and reviewed the code, most of which was written with Claude.

## Getting started

```sh
npm ci
npm run dev
```

| Screen                         | Route                                  |
| ------------------------------ | -------------------------------------- |
| Day timeline (any trip day)    | `/#/day/2037-11-04`                    |
| Day route, leg by leg          | `/#/day/2037-11-04/route`              |
| Departure planning             | `/#/departures`                        |
| Trip schedule (month + list)   | `/#/schedule`                          |
| Discover: vegan food           | `/#/discover/food?date=…&event=…`      |
| Discover: shopping, gyms, laundry | `/#/discover/shopping`, `/#/discover/gyms`, `/#/discover/laundry` |
| Our tickets                    | `/#/tickets`                           |
| More: budget, checklist, hotels, settings | `/#/more`, `/#/more/budget` …  |

An empty or unknown hash opens today's day during the trip, and the first day before it.

The departures screen lists recommended leave times for every confirmed attraction; the same card also appears before teamLab on the sample day. Sources and limitations are documented in [`departure-research.md`](departure-research.md). Recommended departure times are kept separate from booking times.

## Scripts

| Command                | Description                                                                |
| ---------------------- | -------------------------------------------------------------------------- |
| `npm run check`        | Typecheck, lint, format check, tests and build. Run before sharing changes. |
| `npm run build:artifact` | Build for the artifact host (`--base=./`) plus the one-file offline copy.  |
| `npm run format`       | Format the codebase with Prettier.                                         |
| `npm test`             | Run the Vitest suite.                                                      |
| `npm run audit:source` | Local only: compare the app data against the private source.            |
| `npm run sync:source`  | Local only: regenerate `src/data/trip-days.json` from the private source. |

`audit:source` and `sync:source` need the private source in the sibling directory. `sync:source` copies every day and event, dropping only document references and booking/confirmation numbers (pattern rules in `scripts/redact.mjs` — the private values themselves never enter Git). `audit:source` checks the source hashes and that the published data equals the source minus those fields. Never copy the private source into this repository or CI.

Without the private source, the Vitest suite still locks the 17/89 manifest, the critical anchors (flights, trains, MOMO, UZU, spa, Chabad), route continuity and modes, budget arithmetic, calendar time zones and the privacy rules.

## Current scope

- **Our day:** all 17 days with a navigable date strip, "don't miss" panel, ordered timeline (untimed items placed sensibly, never given invented times), flight and train cards with both clocks, entry windows, Google Calendar links for confirmed bookings, a weather card at the top of the day (Open-Meteo, only inside its 16-day window), and a side panel with the day's shopping pick and tonight's hotel.
- **Routes:** a leg-by-leg route for every day with explicit walking/transit modes; Shabbat legs walk; booked trains and hotel shuttles are labelled.
- **Schedule:** November month grid and a filterable list (city, type, search) that always says how many days are hidden.
- **Discover:** 20 vegan restaurants with "fancy something else?" alternatives per meal, ranked by area; 7 shopping days; 6 gym options with verified/unverified entry; a laundry plan per hotel (two planned washes — Kobe on 8 Nov and the Disney hotel on 15 Nov — plus an Osaka backup), with how to pay, a route to a public laundry and a packing kit.
- **Tickets:** public booking metadata only, how to open each ticket officially, an ICS export, and a button to the shared Drive folder (access is controlled by Drive sharing).
- **More:** budget in shekels per traveller, 22-task checklist shared between both phones (falls back to this device when offline) with the original warnings, five hotels with moves, and settings.
- Travel times, ratings, prices and forecasts are never invented; unverified data is labelled.

## Project structure

```text
src/
  app/            # Shell: App, hash router (router.ts), nav items, layout/ (Sidebar, BottomNav, SkipLink)
  components/     # Shared UI: ExternalLink, BackLink, IsraelTime, OfflineSave, LanguageToggle
  hooks/          # useNow, useLocalState (this device), useSharedChecks (both phones)
  i18n/           # i18next setup and UI strings (he.ts, en.ts)
  lib/            # Pure helpers, no React: time.ts (time zones), dates.ts (date labels), maps.ts (Directions URLs),
                  # claudeRuntime.ts (artifact capabilities, optional everywhere)
  data/           # Content only, no UI: types, trip constants, hotels, per-event copy, per-day side-panel guides
  features/
    itinerary/    # DayPage and its parts: DayHeader, DateStrip, DayTimeline, EventCard, EndOfDay, aside/
    maps/         # Route legs (routes.ts) and RoutePage
    departures/   # Departure plans (plans.ts), DepartureCard and DeparturesPage
  styles/         # index.css imports tokens → base → components → layout → one file per screen → refine.css
tests/            # Vitest; fixtures hold IDs and hashes only, never private source data
scripts/          # Source audit and build-time privacy scan
```

## Conventions

- Content belongs in `data/`, never inside components.
- Pure logic belongs in `lib/` and is covered by tests.
- Every time stored in the data is Japan Standard Time.
- All map links are built through `directionsUrl`; all external links use `ExternalLink`.
- UI strings live in `src/i18n`; trip content in `src/data` is currently Hebrew only and keeps its own language and direction when the UI is in English.
- No `!important` in CSS (except for `prefers-reduced-motion`). Layout lives in the per-screen files; `refine.css` loads last and holds the visual polish (colour, shadow, motion). Don't set the same property on the same selector in two files.
- Colours used in more than one place are tokens in `tokens.css`.

## Editing content

- **Itinerary (all days and events):** `src/data/trip-days.json`. Preferably edit the private source and run `npm run sync:source`; otherwise edit the JSON by hand with evidence, keep IDs stable and never add booking numbers.
- **Friendly card copy:** `src/data/presentation.ts` (optional per event; the source title and note are the fallback).
- **Order of untimed events, Israel-time events:** `src/data/trip.ts`.
- **Flights and booked trains:** `src/data/journeys.ts`. **Hotels:** `src/data/hotels.ts`.
- **Routes:** `src/data/routes.ts` (one leg list per day). **Departure advice:** `src/features/departures/plans.ts`.
- **Restaurants, shopping, gyms, laundry:** `src/data/dining.ts`, `src/data/shopping.ts`, `src/data/gyms.ts`, `src/data/laundry.ts`.
- **Budget:** `src/data/budget.ts` (one entry per booking; reference rate `JPY_RATE`). **Checklist:** `src/data/checklist.ts`. **Tickets:** `src/data/tickets.ts`.
- **Weather locations:** `src/data/weather.ts`. **Colours:** `src/styles/tokens.css`; new screens share `src/styles/pages.css`.
- **UI translations:** `src/i18n/he.ts` and `src/i18n/en.ts` (typed; a missing key fails typecheck).

### Publishing a change safely

1. Edit, then run `npm run check` (typecheck, lint, format, tests, build and the privacy scan). With the private source present, also run `npm run audit:source`.
2. Read your diff for anything personal: booking numbers, emails, phone numbers, QR images, PDFs or Drive links.
3. Commit and push to a branch, then publish (below).

## Publishing

The app runs on Cloudflare Workers: static files from `dist-web/` are served as they are, and only `/api/*` reaches `worker/index.ts`, which stores changes made during the trip in Cloudflare D1 (SQLite, schema in `migrations/`).

1. Set your own D1 `database_id` in `wrangler.jsonc` and the access codes as Worker secrets (`PIN_DANA`, `PIN_NOA`, `PIN_CLAUDE`).
2. `npx wrangler d1 migrations apply japan-together-demo --remote`, then `npx wrangler deploy` (it runs `npm run build:web` first).
3. `npm run build:artifact` also writes `dist/japan-together-offline.html`, a single file with everything inlined for use without signal.

## Privacy

**Data rules**

- Never commit PDFs, QR codes, receipts, personal details, booking references or private folder paths to `src/`, `public/`, `dist/` or Git.
- The build-time scan detects common patterns only; it is not proof that no personal data is present.
- Private document storage will be configured separately, with real access control. A client-side password is not security.

## Known limitations

- Restaurant ratings, opening hours and shop hours come from the original plan and are not re-verified; ratings have no recorded source or date and are labelled as such.
- Only checklist ticks sync between phones, and only inside the artifact. Everything else saved in the app (rate cache, forecasts, last open day) stays on the device.
- The original plan's local "add/edit activity" and JSON backup are not carried over: edits now go through the code so both of you see the same plan.
- Two dollar expenses (flight, Tokyo Chabad) have no shekel amount in the source and are listed apart from the totals.
- The forecast appears only within 16 days of a date; before that the card links to a live forecast.
