import { Trash2 } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  plannedExpenses,
  type CostCategory,
  type Currency,
  type Expense,
  type Payment,
  type Traveller,
} from '../../data/budget';
import { useSave } from '../../hooks/useSave';
import { saveEntries } from '../../lib/liveEdit';
import { formatShekels } from '../../lib/money';
import { parseAmount, useYenRate } from '../yen/rate';
import { COST_CATEGORIES } from '../../../shared/liveSchema';
import {
  buildCost,
  buildPayment,
  costFormFrom,
  emptyCostForm,
  emptyPaymentForm,
  newCost,
  newPayment,
  otherOne,
  paymentFormFrom,
  restOf,
  type CostForm,
  type CostProblem,
  type ForWhom,
  type PaymentForm,
} from './costForm';
import '../../components/Chip.css';

const TRAVELLERS: Traveller[] = ['dana', 'noa'];
const SYMBOL: Record<Currency, string> = { JPY: '¥', ILS: '₪', USD: '$' };

function Choice<T extends string>({
  legend,
  value,
  options,
  label,
  onChange,
}: {
  legend: string;
  value: T;
  options: readonly T[];
  label: (option: T) => ReactNode;
  onChange: (option: T) => void;
}) {
  return (
    <fieldset className="cost-choice">
      <legend className="muted">{legend}</legend>
      <div className="chip-row">
        {options.map((option) => (
          <button
            type="button"
            key={option}
            className="chip"
            aria-pressed={value === option}
            onClick={() => onChange(option)}
          >
            {label(option)}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: ReactNode;
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  return (
    <div className="cost-field">
      <label className="muted" htmlFor={id}>
        {label}
      </label>
      {children(id)}
      {hint && <small className="muted">{hint}</small>}
    </div>
  );
}

/** Amount, currency and (for yen or dollars) the shekel value. */
function AmountFields({
  amount,
  currency,
  shekels,
  currencies,
  rate,
  onChange,
}: {
  amount: string;
  currency: Currency;
  shekels: string;
  currencies: readonly Currency[];
  rate: number;
  onChange: (next: { amount?: string; currency?: Currency; shekels?: string }) => void;
}) {
  const { t } = useTranslation();
  const value = parseAmount(amount);
  const atRate = value && currency === 'JPY' ? formatShekels(Math.round(value * rate * 100)) : '';
  return (
    <>
      <div className="cost-amount">
        <Field label={t('budget.form.amount')}>
          {(id) => (
            <input
              id={id}
              className="input num"
              inputMode="decimal"
              dir="ltr"
              value={amount}
              placeholder="0"
              onChange={(event) => onChange({ amount: event.target.value })}
            />
          )}
        </Field>
        <div className="chip-row cost-currency" role="group" aria-label={t('budget.form.currency')}>
          {currencies.map((each) => (
            <button
              type="button"
              key={each}
              className="chip"
              aria-pressed={currency === each}
              onClick={() => onChange({ currency: each })}
            >
              {SYMBOL[each]}
            </button>
          ))}
        </div>
      </div>
      {currency !== 'ILS' && (
        <Field
          label={t('budget.form.inShekels')}
          hint={
            currency === 'JPY'
              ? t('budget.form.atRate', { amount: atRate || '₪0' })
              : t('budget.form.usdHint')
          }
        >
          {(id) => (
            <input
              id={id}
              className="input num"
              inputMode="decimal"
              dir="ltr"
              value={shekels}
              placeholder={atRate.replace(/[^\d.,]/g, '')}
              onChange={(event) => onChange({ shekels: event.target.value })}
            />
          )}
        </Field>
      )}
    </>
  );
}

function Problem({ problem, amount }: { problem: CostProblem | null; amount?: string }) {
  const { t } = useTranslation();
  if (!problem) return null;
  return (
    <p className="cost-problem" role="alert">
      {t(`budget.form.problems.${problem}`, { amount: amount ?? '' })}
    </p>
  );
}

function DeleteButton({ onDelete }: { onDelete: () => void }) {
  const { t } = useTranslation();
  const [sure, setSure] = useState(false);
  return (
    <button
      type="button"
      className="btn btn--small btn--danger cost-delete"
      onClick={() => (sure ? onDelete() : setSure(true))}
    >
      <Trash2 size={15} aria-hidden="true" />
      {sure ? t('budget.form.deleteSure') : t('budget.form.delete')}
    </button>
  );
}

/** The "+ cost" sheet, and editing any cost (from the sheet or added here). */
export function CostSheetForm({
  expense,
  me,
  who,
  onDone,
  onLocked,
}: {
  expense?: Expense;
  me: Traveller;
  who: string | undefined;
  onDone: () => void;
  onLocked: () => void;
}) {
  const { t } = useTranslation();
  const save = useSave(onLocked);
  const { rate } = useYenRate();
  const [form, setForm] = useState<CostForm>(() =>
    expense ? costFormFrom(expense, me) : emptyCostForm(me),
  );
  const [problem, setProblem] = useState<CostProblem | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (next: Partial<CostForm>) => {
    setProblem(null);
    setForm((now) => ({ ...now, ...next }));
  };
  const planned = !!expense && plannedExpenses.some((each) => each.id === expense.id);
  const currencies: Currency[] = form.currency === 'USD' ? ['JPY', 'ILS', 'USD'] : ['JPY', 'ILS'];
  const name = (each: Traveller) => t(`budget.${each}`);
  const forWhomLabel = (option: ForWhom) =>
    option === 'both'
      ? t('budget.form.forBoth')
      : option === 'parts'
        ? t('budget.form.forParts')
        : t('budget.form.forOnly', { name: name(option) });

  return (
    <form
      className="cost-form"
      onSubmit={async (event) => {
        event.preventDefault();
        const built = buildCost(form, rate.ilsPerJpy, expense);
        if ('problem' in built) return setProblem(built.problem);
        if (!Object.keys(built.change).length) return onDone();
        const [id, change] = expense ? [expense.id, built.change] : newCost(built.change, who);
        setBusy(true);
        const ok = await save(
          () => saveEntries('expenses', { [id]: change }),
          t('budget.form.saved'),
        );
        setBusy(false);
        if (ok) onDone();
      }}
    >
      <Field label={t('budget.form.what')}>
        {(id) => (
          <input
            id={id}
            className="input"
            value={form.title}
            data-autofocus
            maxLength={300}
            placeholder={t('budget.form.whatPlaceholder')}
            onChange={(event) => set({ title: event.target.value })}
          />
        )}
      </Field>
      <AmountFields
        amount={form.amount}
        currency={form.currency}
        shekels={form.shekels}
        currencies={currencies}
        rate={rate.ilsPerJpy}
        onChange={set}
      />
      <Choice
        legend={t('budget.form.whoPaid')}
        value={form.paidBy}
        options={TRAVELLERS}
        label={name}
        onChange={(paidBy) => set({ paidBy })}
      />
      <Choice
        legend={t('budget.form.forWhom')}
        value={form.forWhom}
        options={['both', 'dana', 'noa', 'parts'] as const}
        label={forWhomLabel}
        onChange={(forWhom) => {
          // Exact amounts start from half-half, so only one needs typing.
          const total = parseAmount(form.amount);
          if (forWhom !== 'parts' || form.danaPart || !total) return set({ forWhom });
          const danaPart = String(Math.round(total * 50) / 100);
          set({ forWhom, danaPart, noaPart: restOf(form.amount, danaPart) });
        }}
      />
      {form.forWhom === 'parts' && (
        <div className="cost-parts">
          {TRAVELLERS.map((each) => {
            const field = each === 'dana' ? 'danaPart' : 'noaPart';
            const otherField = each === 'dana' ? 'noaPart' : 'danaPart';
            return (
              <Field key={each} label={`${name(each)} (${SYMBOL[form.currency]})`}>
                {(id) => (
                  <input
                    id={id}
                    className="input num"
                    inputMode="decimal"
                    dir="ltr"
                    value={form[field]}
                    onChange={(event) =>
                      set({
                        [field]: event.target.value,
                        [otherField]: restOf(form.amount, event.target.value),
                      })
                    }
                  />
                )}
              </Field>
            );
          })}
        </div>
      )}
      <Choice
        legend={t('budget.form.category')}
        value={form.category}
        options={COST_CATEGORIES}
        label={(category: CostCategory) => t(`budget.categories.${category}`)}
        onChange={(category) => set({ category })}
      />
      <div className="cost-row">
        <Field label={t('budget.form.date')}>
          {(id) => (
            <input
              id={id}
              type="date"
              className="input"
              value={form.date}
              onChange={(event) => set({ date: event.target.value })}
            />
          )}
        </Field>
        <Field label={t('budget.form.note')}>
          {(id) => (
            <input
              id={id}
              className="input"
              value={form.note}
              maxLength={500}
              onChange={(event) => set({ note: event.target.value })}
            />
          )}
        </Field>
      </div>
      <Problem problem={problem} amount={`${SYMBOL[form.currency]}${form.amount}`} />
      <button type="submit" className="btn btn--primary btn--wide" disabled={busy}>
        {expense ? t('budget.form.save') : t('budget.form.add')}
      </button>
      {expense && (
        <DeleteButton
          onDelete={async () => {
            setBusy(true);
            const ok = await save(
              () => saveEntries('expenses', { [expense.id]: planned ? { removed: true } : null }),
              t('budget.form.deleted'),
            );
            setBusy(false);
            if (ok) onDone();
          }}
        />
      )}
    </form>
  );
}

/** The "settle up" sheet: one of us gave the other money back. */
export function PaymentSheetForm({
  payment,
  owed,
  me,
  who,
  onDone,
  onLocked,
}: {
  payment?: Payment;
  owed: { from: Traveller; amount: number } | null;
  me: Traveller;
  who: string | undefined;
  onDone: () => void;
  onLocked: () => void;
}) {
  const { t } = useTranslation();
  const save = useSave(onLocked);
  const { rate } = useYenRate();
  const [form, setForm] = useState<PaymentForm>(() =>
    payment ? paymentFormFrom(payment) : emptyPaymentForm(owed, me),
  );
  const [problem, setProblem] = useState<CostProblem | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (next: Partial<PaymentForm>) => {
    setProblem(null);
    setForm((now) => ({ ...now, ...next }));
  };
  const name = (each: Traveller) => t(`budget.${each}`);
  return (
    <form
      className="cost-form"
      onSubmit={async (event) => {
        event.preventDefault();
        const built = buildPayment(form, rate.ilsPerJpy, payment);
        if ('problem' in built) return setProblem(built.problem);
        if (!Object.keys(built.change).length) return onDone();
        const [id, change] = payment ? [payment.id, built.change] : newPayment(built.change, who);
        setBusy(true);
        const ok = await save(
          () => saveEntries('payments', { [id]: change }),
          t('budget.form.saved'),
        );
        setBusy(false);
        if (ok) onDone();
      }}
    >
      {owed && !payment && (
        <p className="cost-owed">
          {t('budget.owes', {
            from: name(owed.from),
            to: name(otherOne(owed.from)),
            amount: formatShekels(owed.amount),
          })}
        </p>
      )}
      <Choice
        legend={t('budget.form.direction')}
        value={form.from}
        options={TRAVELLERS}
        label={(from) => t('budget.form.fromTo', { from: name(from), to: name(otherOne(from)) })}
        onChange={(from) => set({ from })}
      />
      <AmountFields
        amount={form.amount}
        currency={form.currency}
        shekels={form.shekels}
        currencies={['ILS', 'JPY']}
        rate={rate.ilsPerJpy}
        onChange={(next) => set(next as Partial<PaymentForm>)}
      />
      <div className="cost-row">
        <Field label={t('budget.form.date')}>
          {(id) => (
            <input
              id={id}
              type="date"
              className="input"
              value={form.date}
              onChange={(event) => set({ date: event.target.value })}
            />
          )}
        </Field>
        <Field label={t('budget.form.how')}>
          {(id) => (
            <input
              id={id}
              className="input"
              value={form.note}
              maxLength={500}
              placeholder={t('budget.form.howPlaceholder')}
              onChange={(event) => set({ note: event.target.value })}
            />
          )}
        </Field>
      </div>
      <Problem problem={problem} />
      <button type="submit" className="btn btn--primary btn--wide" disabled={busy}>
        {payment ? t('budget.form.save') : t('budget.form.recordPayment')}
      </button>
      {payment && (
        <DeleteButton
          onDelete={async () => {
            setBusy(true);
            const ok = await save(
              () => saveEntries('payments', { [payment.id]: null }),
              t('budget.form.deleted'),
            );
            setBusy(false);
            if (ok) onDone();
          }}
        />
      )}
    </form>
  );
}
