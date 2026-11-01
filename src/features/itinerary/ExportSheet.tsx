import { FileSpreadsheet, FileText, Share2, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useSheet } from '../../app/sheetContext';
import { useToast } from '../../app/toastContext';
import { ActionRow } from '../../components/ActionRow';
import { IconTile } from '../../components/IconTile';
import { Sheet, SheetHeader } from '../../components/Sheet';
import { TRIP, tripDates } from '../../data/trip';
import { useLanguage } from '../../i18n';
import { formatDayDot } from '../../lib/dates';
import { copyText, downloadText } from '../../lib/fileOut';
import { exportDays, exportFileName, planCsv, planText } from './exportPlan';
import { PrintPlan } from './PrintPlan';
import { usePlanEdits } from './useDayPlan';
import './export.css';

/**
 * Export one day (`date`) or the whole trip: as text to paste into an AI chat, as a PDF through
 * the phone's print screen, or as a CSV file that Excel opens.
 */
export function ExportSheet({ date }: { date?: string }) {
  const { t } = useTranslation();
  const lang = useLanguage();
  const { close } = useSheet();
  const toast = useToast();
  const [edits] = usePlanEdits();
  const [printing, setPrinting] = useState(false);
  const days = useMemo(() => exportDays(date ? [date] : tripDates, edits), [date, edits]);
  const scope = date ? t('export.day') : t('export.trip');

  useEffect(() => {
    if (!printing) return;
    const done = () => setPrinting(false);
    window.addEventListener('afterprint', done);
    window.print();
    return () => window.removeEventListener('afterprint', done);
  }, [printing]);

  const copy = async () => {
    const copied = await copyText(planText(days, t, lang));
    toast(copied ? t('export.copied') : t('export.copyFailed'));
    if (copied) close();
  };

  const excel = () => {
    downloadText(exportFileName(date, 'csv'), planCsv(days, t, lang), 'text/csv;charset=utf-8');
    toast(t('export.downloaded'));
  };

  return (
    <Sheet label={t('export.title', { scope })} onClose={close}>
      <SheetHeader
        icon={
          <IconTile>
            <Share2 size={20} />
          </IconTile>
        }
        kicker={
          <bdi dir="ltr">
            {date ? formatDayDot(date) : `${formatDayDot(TRIP.start)}–${formatDayDot(TRIP.end)}`}
          </bdi>
        }
        title={t('export.title', { scope })}
        onClose={close}
      />
      <div className="stack export-options">
        <ActionRow
          icon={<Sparkles size={18} />}
          title={t('export.ai')}
          sub={t('export.aiSub')}
          onClick={copy}
        />
        <ActionRow
          icon={<FileText size={18} />}
          tone="lav"
          title={t('export.pdf')}
          sub={t('export.pdfSub')}
          onClick={() => setPrinting(true)}
        />
        <ActionRow
          icon={<FileSpreadsheet size={18} />}
          tone="mint"
          title={t('export.excel')}
          sub={t('export.excelSub')}
          onClick={excel}
        />
      </div>
      {printing && createPortal(<PrintPlan days={days} />, document.body)}
    </Sheet>
  );
}
