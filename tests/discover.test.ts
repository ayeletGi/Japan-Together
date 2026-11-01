import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { discoverTabs } from '../src/app/router';
import { citiesIn } from '../src/data/dining';
import { gyms } from '../src/data/gyms';
import { DiscoverPage } from '../src/features/explore/DiscoverPage';
import '../src/i18n';

const render = (tab: (typeof discoverTabs)[number], date?: string) =>
  renderToStaticMarkup(React.createElement(DiscoverPage, { tab, date }));

const cardCount = (html: string) => (html.match(/<article class="place-card/g) ?? []).length;

describe('discover', () => {
  it('shows the day chips with an "all days" chip on every tab', () => {
    for (const tab of discoverTabs) {
      const html = render(tab);
      expect(html).toContain('day-chip--all');
      expect(html).toMatch(/class="day-chip day-chip--all" aria-current="date"/);
    }
  });

  it('marks the chosen day and the chosen category tile', () => {
    const html = render('gyms', '2037-11-07');
    expect(html).toContain('href="#/discover/gyms?date=2037-11-07"');
    expect(html).toMatch(/class="shop shop--gyms" aria-pressed="true"/);
    expect(html).toMatch(/class="shop shop--food" aria-pressed="false"/);
  });

  it('filters are per category', () => {
    expect(render('food')).toContain('filter-pill-label">סוג אוכל<');
    expect(render('shopping')).toContain('filter-pill-label">מה קונים<');
    expect(render('shopping')).not.toContain('filter-pill-label">סוג אוכל<');
    expect(render('gyms')).toContain('filter-pill-label">כניסה<');
    expect(render('laundry')).not.toContain('class="chip"');
  });

  it('gyms: a planned day shows only that session, marked on the route', () => {
    const html = render('gyms', '2037-11-07');
    const planned = gyms.filter((gym) => gym.date === '2037-11-07');
    expect(planned.length).toBeGreaterThan(0);
    expect(cardCount(html)).toBe(planned.length);
    expect(html).toContain('על המסלול של היום');
  });

  it('gyms: a day without a session falls back to the hotel city', () => {
    const html = render('gyms', '2037-11-10');
    expect(cardCount(html)).toBeGreaterThan(0);
    expect(cardCount(html)).toBeLessThan(gyms.length);
  });

  it('laundry: a day shows only that day’s hotel(s)', () => {
    expect(cardCount(render('laundry', '2037-11-09'))).toBe(1);
    expect(cardCount(render('laundry', '2037-11-08'))).toBe(2); // Kobe → Osaka
    expect(cardCount(render('laundry'))).toBeGreaterThan(1);
  });

  it('food: the city filter follows the picked day', () => {
    const cityPill = 'filter-pill-label">עיר<';
    expect(render('food')).toContain(cityPill);
    expect(render('food', '2037-11-13')).not.toContain(cityPill);
    const travel = render('food', '2037-11-08');
    expect(travel).toContain(cityPill);
    expect(travel).toContain('קובה');
    expect(travel).not.toContain('הכול (');
  });

  it('citiesIn reads the restaurant cities in a day place', () => {
    expect(citiesIn('קובה → אוסקה')).toEqual(['kobe', 'osaka']);
    expect(citiesIn('טוקיו / דיסני')).toEqual(['tokyo']);
    expect(citiesIn('טוקיו → מפרץ טוקיו')).toEqual(['tokyo']);
    expect(citiesIn('טיסה')).toEqual([]);
  });
});
