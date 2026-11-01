import { useTranslation } from 'react-i18next';
import { useSheet } from '../../app/sheetContext';
import { Sheet, SheetHeader } from '../../components/Sheet';
import { phraseById } from '../../data/phrases';
import { useLanguage } from '../../i18n';
import './useful.css';

/** One phrase, with the Japanese big enough to show across a counter. */
export function PhraseSheet({ phraseId }: { phraseId: string }) {
  const { t } = useTranslation();
  const lang = useLanguage();
  const { close } = useSheet();
  const phrase = phraseById(phraseId);
  if (!phrase) return null;
  return (
    <Sheet label={phrase.meaning[lang]} onClose={close}>
      <SheetHeader kicker={t('useful.showThis')} title={phrase.meaning[lang]} onClose={close} />
      <div className="sheet-body phrase-big">
        <p className="jp phrase-ja" lang="ja">
          {phrase.ja}
        </p>
        <p className="muted">{phrase.reading[lang]}</p>
      </div>
    </Sheet>
  );
}
