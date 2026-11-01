import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DRIVE_FOLDER_URL } from '../src/data/privateFolder';
import { phrases } from '../src/data/phrases';
import { checklistItems } from '../src/features/checklist/items';
import { hotelList } from '../src/data/hotels';
import { TicketsPage } from '../src/features/tickets/TicketsPage';
import { UsefulPage } from '../src/features/useful/UsefulPage';
import '../src/i18n';

describe('checklist', () => {
  it('has the 20 items from the brief with unique ids', () => {
    expect(checklistItems).toHaveLength(20);
    expect(new Set(checklistItems.map((item) => item.id)).size).toBe(20);
  });
});

describe('useful page', () => {
  const html = renderToStaticMarkup(React.createElement(UsefulPage));

  it('shows the converter, emergency numbers, taxi card and phrases', () => {
    expect(html).toContain('yen-card');
    for (const number of ['110', '119', '050-3816-2787', '+81-3-3264-0911']) {
      expect(html).toContain(number);
    }
    expect(html).toContain('taxi-card');
    expect(html).toContain(phrases[0].ja);
  });

  it('has a vegan line that mentions dashi', () => {
    expect(
      phrases.some((phrase) => phrase.ja.includes('だし') && /דאשי/.test(phrase.meaning.he)),
    ).toBe(true);
  });
});

describe('tickets tab', () => {
  const html = renderToStaticMarkup(React.createElement(TicketsPage));

  it('lists the flights, trains and every hotel stay', () => {
    for (const text of ['LY91', 'LY92', 'NOZOMI 53', 'teamLab Planets'])
      expect(html).toContain(text);
    for (const hotel of hotelList) expect(html).toContain(hotel.name);
    expect(html).not.toContain('חמשת המלונות');
  });

  it('keeps private documents out: no PDFs or previews, and only the shared Drive folder', () => {
    expect(html).not.toMatch(/\.pdf/i);
    expect(html).not.toContain('previews/');
    const driveLinks = html.match(/https:\/\/drive\.google\.com[^"]*/g) ?? [];
    expect(driveLinks.length).toBeGreaterThan(0);
    for (const link of driveLinks) expect(link).toBe(DRIVE_FOLDER_URL.replace(/&/g, '&amp;'));
  });
});
