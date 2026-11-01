import { describe, expect, it } from 'vitest';
import { plannedExpenses } from '../src/data/budget';
import {
  buildCost,
  buildPayment,
  costFormFrom,
  emptyCostForm,
  emptyPaymentForm,
  restOf,
} from '../src/features/budget/costForm';

const RATE = 0.02;

describe('the + cost form', () => {
  const form = { ...emptyCostForm('noa', '2037-11-04'), title: ' Ramen ', amount: '3,000' };

  it('saves a new yen cost at today’s rate, paid by the phone’s owner, half-half', () => {
    expect(buildCost(form, RATE)).toEqual({
      change: {
        title: 'Ramen',
        category: 'food',
        currency: 'JPY',
        amount: 3000,
        paidBy: 'noa',
        note: '',
        shekels: 60,
        owner: 'both',
        parts: null,
        date: '2037-11-04',
        dateLabel: '4.11',
        state: 'paid',
      },
    });
  });

  it('says what is missing', () => {
    expect(buildCost({ ...form, title: '' }, RATE)).toEqual({ problem: 'title' });
    expect(buildCost({ ...form, amount: '0' }, RATE)).toEqual({ problem: 'amount' });
    expect(buildCost({ ...form, currency: 'USD' }, RATE)).toEqual({ problem: 'shekels' });
    expect(
      buildCost({ ...form, forWhom: 'parts', danaPart: '1000', noaPart: '1000' }, RATE),
    ).toEqual({ problem: 'parts' });
  });

  it('keeps exact parts that add up, and fills in the other part', () => {
    expect(restOf('3000', '1200')).toBe('1800');
    expect(restOf('3000', '4000')).toBe('');
    const built = buildCost({ ...form, forWhom: 'parts', danaPart: '1200', noaPart: '1800' }, RATE);
    expect('change' in built && built.change.parts).toEqual({ dana: 1200, noa: 1800 });
  });

  it('saves only what changed on a cost from the sheet, and keeps its rate', () => {
    const disney = plannedExpenses.find((expense) => expense.id === 'disneyland')!;
    const edited = { ...costFormFrom(disney, 'dana'), paidBy: 'noa' as const };
    expect(buildCost(edited, RATE, disney)).toEqual({ change: { paidBy: 'noa' } });
    expect(buildCost(costFormFrom(disney, 'dana'), RATE, disney)).toEqual({
      change: { paidBy: 'dana' },
    });
  });
});

describe('the settle-up form', () => {
  it('starts from the balance and goes to the other one', () => {
    const form = emptyPaymentForm({ from: 'noa', amount: 106004 }, 'dana', '2037-11-04');
    expect(form).toMatchObject({ from: 'noa', amount: '1060.04', currency: 'ILS' });
    expect(buildPayment(form, RATE)).toEqual({
      change: {
        from: 'noa',
        to: 'dana',
        currency: 'ILS',
        amount: 1060.04,
        shekels: null,
        date: '2037-11-04',
        note: '',
      },
    });
    const yen = buildPayment({ ...form, currency: 'JPY', amount: '5000' }, RATE);
    expect('change' in yen && yen.change.shekels).toBe(100);
  });
});
