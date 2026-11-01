import { ArrowLeftRight, HandCoins, Info, Pencil, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/Card';
import { Pill } from '../../components/Pill';
import { SectionTitle } from '../../components/SectionTitle';
import { Sheet, SheetHeader } from '../../components/Sheet';
import type { Tone } from '../../components/tone';
import {
  expenses,
  JPY_RATE,
  payments,
  type CostCategory,
  type Expense,
  type PaidState,
  type Payment,
  type Who,
} from '../../data/budget';
import { useLiveVersion } from '../../data/live';
import { useContentProps } from '../../i18n';
import { formatDayDot, formatDotted } from '../../lib/dates';
import { savedCode, savedWho, whoAmI } from '../../lib/liveEdit';
import {
  formatOriginal,
  formatShekels,
  formatShekelsRounded,
  settlement,
  sharesOf,
  summarize,
  toAgorot,
} from '../../lib/money';
import { UnlockForm } from '../itinerary/LiveEditCard';
import { CoinJar } from './CoinJar';
import { CostSheetForm, PaymentSheetForm } from './CostSheets';
import { DailyBudgetCard } from './DailyBudgetCard';
import { asTraveller } from './costForm';
import './budget.css';

const categories: CostCategory[] = [
  'flight',
  'hotel',
  'train',
  'attraction',
  'food',
  'shopping',
  'treatment',
  'guide',
  'other',
];
/** One soft colour per category, used only as a small dot and a bar segment. */
const categoryColors: Partial<Record<CostCategory, string>> = {
  flight: 'var(--lav)',
  hotel: 'var(--pink)',
  train: 'var(--mint)',
  attraction: 'var(--sky-strong)',
  food: 'var(--coin)',
  shopping: 'var(--lav-ink)',
  treatment: 'var(--pink-deep)',
  guide: 'var(--muted)',
  other: 'var(--gray-ink)',
};
const stateTones: Record<PaidState, Tone> = { paid: 'mint', reserved: 'lav', onSite: 'sun' };
const rateDate = formatDotted(JPY_RATE.checkedOn);

/** What the sheet shows: the code first, a cost (new or one to edit), or a settle-up. */
type SheetState =
  | { kind: 'code'; then: Exclude<SheetState, { kind: 'code' }> | null }
  | { kind: 'cost'; expense?: Expense }
  | { kind: 'payment'; payment?: Payment };

function EditButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="expense-edit" aria-label={label} onClick={onClick}>
      <Pencil size={15} aria-hidden="true" />
    </button>
  );
}

function ExpenseRow({
  expense,
  allSquare,
  onEdit,
}: {
  expense: Expense;
  /** Nobody owes anyone: settle-ups already covered every open cost. */
  allSquare: boolean;
  onEdit: () => void;
}) {
  const { t } = useTranslation();
  const settled = expense.settled === true || (expense.settled === false && allSquare);
  const content = useContentProps();
  const value = toAgorot(expense);
  const shares = value === null ? null : sharesOf(expense, value);
  const paidKey = settled
    ? 'budget.paidBy'
    : expense.settled === false
      ? 'budget.paidByOpen'
      : 'budget.paidByPlain';
  return (
    <li className="expense">
      <div className="expense-main">
        <span className="expense-date num" dir="ltr">
          {expense.dateLabel ?? t('budget.beforeTrip')}
        </span>
        <span className="expense-title" {...content}>
          {expense.title}
        </span>
        <span className="expense-amount num">
          {value === null ? t('budget.unknown') : formatShekels(value)}
        </span>
        <EditButton label={t('budget.form.editOne', { title: expense.title })} onClick={onEdit} />
      </div>
      <div className="expense-meta">
        <Pill tone={stateTones[expense.state]}>{t(`budget.states.${expense.state}`)}</Pill>
        <Pill tone="gray">
          {expense.parts ? t('budget.form.forParts') : t(`budget.owners.${expense.owner}`)}
        </Pill>
        {expense.estimate && <Pill tone="gray">{t('budget.estimate')}</Pill>}
        {expense.paidBy && (
          <Pill tone={settled ? 'gray' : 'pink'}>
            {t(paidKey, { name: t(`budget.${expense.paidBy}`) })}
          </Pill>
        )}
      </div>
      <details className="expense-billing">
        <summary>{t('budget.billing')}</summary>
        <ul>
          <li>
            {t('budget.original')}{' '}
            <bdi>
              {formatOriginal(
                expense.original?.amount ?? expense.amount,
                expense.original?.currency ?? expense.currency,
              )}
            </bdi>
          </li>
          {expense.original && expense.currency === 'ILS' && <li>{t('budget.charged')}</li>}
          {expense.discount !== undefined && (
            <li>
              {t('budget.discount', { amount: formatShekels(Math.round(expense.discount * 100)) })}
            </li>
          )}
          {expense.currency === 'JPY' && typeof expense.shekels !== 'number' && (
            <li>{t('budget.converted', { rate: JPY_RATE.ilsPerJpy, date: rateDate })}</li>
          )}
          {shares && expense.owner === 'both' && (
            <li>
              {t('budget.splitBoth', {
                dana: formatShekels(shares.dana),
                noa: formatShekels(shares.noa),
              })}
            </li>
          )}
          {expense.note && <li {...content}>{expense.note}</li>}
        </ul>
      </details>
    </li>
  );
}

/** "added by Noa", or nothing for a cost from the sheet. */
function useAddedBy() {
  const { t } = useTranslation();
  return (who?: Who) => (who ? t('budget.addedBy', { name: t(`budget.${who}`) }) : '');
}

/** A cost added in the app, in the "latest" list. */
function ActivityCost({ expense, onEdit }: { expense: Expense; onEdit: () => void }) {
  const { t } = useTranslation();
  const content = useContentProps();
  const addedBy = useAddedBy();
  const value = toAgorot(expense);
  const whom = expense.parts
    ? t('budget.form.forParts')
    : expense.owner === 'both'
      ? t('budget.form.forBoth')
      : t('budget.form.forOnly', { name: t(`budget.owners.${expense.owner}`) });
  return (
    <li className="activity-row">
      <span className="activity-date num" dir="ltr">
        {expense.date ? formatDayDot(expense.date) : expense.dateLabel}
      </span>
      <span className="activity-text">
        <bdi {...content}>{expense.title}</bdi>
        <small className="muted">
          {[
            expense.paidBy && t('budget.paidByPlain', { name: t(`budget.${expense.paidBy}`) }),
            whom,
            addedBy(expense.addedBy),
          ]
            .filter(Boolean)
            .join(' · ')}
        </small>
      </span>
      <span className="activity-amount num">
        {expense.currency !== 'ILS' && (
          <bdi>{formatOriginal(expense.amount, expense.currency)}</bdi>
        )}
        <small className={expense.currency === 'ILS' ? undefined : 'muted'}>
          {value === null ? t('budget.unknown') : formatShekels(value)}
        </small>
      </span>
      <EditButton label={t('budget.form.editOne', { title: expense.title })} onClick={onEdit} />
    </li>
  );
}

/** A settle-up, in the "latest" list. */
function ActivityPayment({ payment, onEdit }: { payment: Payment; onEdit: () => void }) {
  const { t } = useTranslation();
  const addedBy = useAddedBy();
  const value = toAgorot(payment);
  const details = [payment.note, addedBy(payment.addedBy)].filter(Boolean).join(' · ');
  const title = t('budget.paymentTitle', {
    from: t(`budget.${payment.from}`),
    to: t(`budget.${payment.to}`),
  });
  return (
    <li className="activity-row activity-row--payment">
      <span className="activity-date num" dir="ltr">
        {formatDayDot(payment.date)}
      </span>
      <span className="activity-text">
        <span>
          <HandCoins size={15} aria-hidden="true" /> {title}
        </span>
        {details && <small className="muted">{details}</small>}
      </span>
      <span className="activity-amount num">
        {payment.currency === 'JPY' && <bdi>{formatOriginal(payment.amount, 'JPY')}</bdi>}
        <small className={payment.currency === 'JPY' ? 'muted' : undefined}>
          {value === null ? t('budget.unknown') : formatShekels(value)}
        </small>
      </span>
      <EditButton label={t('budget.form.editOne', { title })} onClick={onEdit} />
    </li>
  );
}

/**
 * The budget from the Drive sheet: the coin-jar card (paid so far, left to pay in Japan, who owes
 * whom), totals by category, what we pay on the spot, and every booking in a closed list.
 */
export function BudgetPage() {
  const tripCosts = expenses.filter((expense) => !expense.outsideTrip);
  const onSite = tripCosts.filter((expense) => expense.state === 'onSite');
  const { t } = useTranslation();
  const content = useContentProps();
  useLiveVersion();
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [who, setWho] = useState(savedWho);
  // A code saved before the server said whose it is: ask the server once.
  useEffect(() => {
    void whoAmI().then(setWho);
  }, []);
  const me = asTraveller(who);
  const summary = summarize(tripCosts);
  const owed = settlement(expenses, payments);
  // Without a code on this phone, the code comes first and then the sheet that was asked for.
  const open = (next: Exclude<SheetState, { kind: 'code' }>) =>
    setSheet(savedCode() ? next : { kind: 'code', then: next });
  const askCode = () =>
    setSheet((now) => ({ kind: 'code', then: now?.kind === 'code' ? now.then : now }));
  const close = () => setSheet(null);
  const sheetTitle = !sheet
    ? ''
    : sheet.kind === 'code'
      ? t('lists.unlockTitle')
      : sheet.kind === 'cost'
        ? t(sheet.expense ? 'budget.form.editCost' : 'budget.form.addCost')
        : t(sheet.payment ? 'budget.form.editPayment' : 'budget.form.settleUp');
  const activity = [
    ...expenses
      .filter((expense) => expense.at)
      .map((expense) => ({ at: expense.at!, expense, payment: undefined })),
    ...payments.map((payment) => ({ at: payment.at, payment, expense: undefined })),
  ].sort((a, b) => b.at - a.at);
  const shownCategories = categories
    .map((category) => ({
      category,
      value: summary.byCategory[category],
      unknown: summary.unknown.some((item) => item.category === category),
    }))
    .filter(({ value, unknown }) => value !== undefined || unknown)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  return (
    <div className="wrap budget">
      <header className="budget-head">
        <p className="budget-kicker">{t('budget.kicker')}</p>
        <h1>{t('budget.title')}</h1>
      </header>

      <div className="budget-top">
        <Card ears className="jar-card">
          <CoinJar />
          <div className="jar-text">
            <span className="muted">{t('budget.paidSoFar')}</span>
            <strong className="jar-total num">{formatShekelsRounded(summary.byState.paid)}</strong>
            {summary.byState.reserved > 0 && (
              <span className="muted">
                {t('budget.reservedOpen')}{' '}
                <b className="num">{formatShekelsRounded(summary.byState.reserved)}</b>
              </span>
            )}
            <span className="muted">
              {t('budget.leftInJapan')}{' '}
              <b className="num">{formatShekelsRounded(summary.byState.onSite)}</b>
            </span>
            <span className="jar-shares">
              {t('budget.dana')} <b className="num">{formatShekelsRounded(summary.shares.dana)}</b>
              {' · '}
              {t('budget.noa')} <b className="num">{formatShekelsRounded(summary.shares.noa)}</b>
              {' · '}
              {t('budget.together')} <b className="num">{formatShekelsRounded(summary.total)}</b>
            </span>
            <Pill tone={owed ? 'pink' : 'mint'} className="jar-balance">
              {owed
                ? t('budget.owes', {
                    from: t(`budget.${owed.from}`),
                    to: t(`budget.${owed.to}`),
                    amount: formatShekelsRounded(owed.amount),
                  })
                : t('budget.balanced')}
            </Pill>
          </div>
        </Card>

        <Card className="budget-split">
          <div className="budget-bar" aria-hidden="true">
            {shownCategories.map(({ category, value }) =>
              value ? (
                <span
                  key={category}
                  style={{
                    flexGrow: value,
                    background: categoryColors[category] ?? 'var(--muted)',
                  }}
                />
              ) : null,
            )}
          </div>
          <ul className="budget-rows">
            {shownCategories.map(({ category, value, unknown }) => (
              <li key={category}>
                <span>
                  <i
                    className="budget-dot"
                    style={{ background: categoryColors[category] ?? 'var(--muted)' }}
                  />
                  {t(`budget.categories.${category}`)}
                </span>
                <b className="num">
                  {value !== undefined ? formatShekelsRounded(value) : t('budget.unknown')}
                  {value !== undefined && unknown && ' + ?'}
                </b>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {summary.shares.unassigned > 0 && (
        <p className="small-note">
          {t('budget.assignedNote', { amount: formatShekels(summary.shares.unassigned) })}
        </p>
      )}
      {summary.unknown.length > 0 && (
        <p className="budget-note">
          <Info size={15} aria-hidden="true" />
          <span>{t('budget.unknownNote', { count: summary.unknown.length })}</span>
        </p>
      )}

      <DailyBudgetCard />

      <Card className="balance-card">
        <ArrowLeftRight size={18} aria-hidden="true" />
        <div className="balance-text">
          <p>
            {owed
              ? t('budget.settle', {
                  from: t(`budget.${owed.from}`),
                  to: t(`budget.${owed.to}`),
                  amount: formatShekels(owed.amount),
                })
              : t('budget.balancedLong')}
          </p>
          {owed && owed.items.length > 0 && (
            <small className="muted" {...content}>
              {owed.items.map((item, i) => (
                <span key={item.id}>
                  {i > 0 && ' · '}
                  <bdi>{item.title.split(' · ')[0]}</bdi>
                </span>
              ))}
            </small>
          )}
          {owed && owed.paidBack > 0 && (
            <small className="muted">
              {t('budget.paidBack', { amount: formatShekels(owed.paidBack) })}
            </small>
          )}
        </div>
        <div className="balance-actions">
          {owed && (
            <button
              type="button"
              className="btn btn--primary btn--small"
              onClick={() => open({ kind: 'payment' })}
            >
              <HandCoins size={16} aria-hidden="true" />
              {t('budget.form.settleUp')}
            </button>
          )}
          <button type="button" className="btn btn--small" onClick={() => open({ kind: 'cost' })}>
            <Plus size={16} aria-hidden="true" />
            {t('budget.form.addCost')}
          </button>
        </div>
      </Card>

      <section aria-labelledby="activity-title">
        <SectionTitle id="activity-title">{t('budget.activity')}</SectionTitle>
        {activity.length === 0 ? (
          <p className="small-note">{t('budget.activityEmpty')}</p>
        ) : (
          <ul className="activity">
            {activity.map(({ expense, payment }) =>
              expense ? (
                <ActivityCost
                  key={expense.id}
                  expense={expense}
                  onEdit={() => open({ kind: 'cost', expense })}
                />
              ) : (
                <ActivityPayment
                  key={payment!.id}
                  payment={payment!}
                  onEdit={() => open({ kind: 'payment', payment })}
                />
              ),
            )}
          </ul>
        )}
      </section>

      {onSite.length > 0 && (
        <section aria-labelledby="on-site-title">
          <SectionTitle id="on-site-title">{t('budget.onSiteTitle')}</SectionTitle>
          <div className="on-site">
            {onSite.map((expense) => {
              const value = toAgorot(expense);
              const [name, who] = expense.title.split(' · ');
              return (
                <div key={expense.id} className="on-site-row reveal-item">
                  <span className="on-site-date tone-sun num" dir="ltr">
                    {expense.dateLabel}
                  </span>
                  <span className="on-site-text" {...content}>
                    <bdi>{name}</bdi>
                    {who && <small className="muted">{who}</small>}
                  </span>
                  <span className="on-site-amount num">
                    {expense.currency === 'JPY' && (
                      <bdi>{formatOriginal(expense.amount, 'JPY')}</bdi>
                    )}
                    <small className="muted">
                      {value === null ? t('budget.unknown') : formatShekelsRounded(value)}
                      {expense.estimate && ` · ${t('budget.estimate')}`}
                    </small>
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <details className="budget-all">
        <summary>
          {t('budget.items')} <span className="num">({tripCosts.length})</span>
        </summary>
        <ul className="expense-list">
          {tripCosts.map((expense) => (
            <ExpenseRow
              key={expense.id}
              expense={expense}
              allSquare={!owed}
              onEdit={() => open({ kind: 'cost', expense })}
            />
          ))}
        </ul>
      </details>
      <p className="small-note">
        {t('budget.footer', { rate: JPY_RATE.ilsPerJpy, date: rateDate })}
      </p>

      <button
        type="button"
        className="fab"
        aria-label={t('budget.form.addCost')}
        onClick={() => open({ kind: 'cost' })}
      >
        <Plus size={30} strokeWidth={2.4} aria-hidden="true" />
      </button>

      {/* On <body>, so the page's slide-in doesn't trap it under the tab bar. */}
      {sheet &&
        createPortal(
          <Sheet label={sheetTitle} onClose={close}>
            <SheetHeader title={sheetTitle} onClose={close} />
            <div className="sheet-body">
              {sheet.kind === 'code' ? (
                <UnlockForm
                  onUnlocked={() => {
                    setWho(savedWho());
                    setSheet(sheet.then);
                  }}
                />
              ) : sheet.kind === 'cost' ? (
                <CostSheetForm
                  expense={sheet.expense}
                  me={me}
                  who={who}
                  onDone={close}
                  onLocked={askCode}
                />
              ) : (
                <PaymentSheetForm
                  payment={sheet.payment}
                  owed={owed}
                  me={me}
                  who={who}
                  onDone={close}
                  onLocked={askCode}
                />
              )}
            </div>
          </Sheet>,
          document.body,
        )}
    </div>
  );
}
