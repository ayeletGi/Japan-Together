import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { loadCapability } from '../lib/claudeRuntime';
import { ActionRow } from './ActionRow';

/** Built by scripts/build-offline.mjs and published next to the artifact page. */
const OFFLINE_FILE = './japan-together-offline.html';

type Downloads = {
  save(request: { filename: string; data: Blob }): Promise<{ status: string }>;
};
type Status = 'idle' | 'working' | 'saved' | 'failed';

/**
 * A settings row that saves a single self-contained copy of the app for use without internet.
 * Only shown inside the claude.ai artifact viewer; the offline copy itself has no runtime, so it hides.
 */
export function OfflineSave() {
  const { t } = useTranslation();
  const [downloads, setDownloads] = useState<Downloads | null>(null);
  const [status, setStatus] = useState<Status>('idle');

  useEffect(() => {
    void loadCapability<Downloads>('downloads').then(setDownloads);
  }, []);

  if (!downloads) return null;

  async function save() {
    if (!downloads || status === 'working') return;
    setStatus('working');
    try {
      const response = await fetch(OFFLINE_FILE);
      if (!response.ok) throw new Error(String(response.status));
      await downloads.save({ filename: 'japan-together.html', data: await response.blob() });
      setStatus('saved');
    } catch (error) {
      const code = (error as { code?: string }).code;
      setStatus(code === 'declined' ? 'idle' : 'failed');
    }
  }

  return (
    <ActionRow
      icon={<Download size={18} />}
      tone="sky"
      title={<span aria-live="polite">{t(`offline.${status}`)}</span>}
      sub={t('settings.offlineSub')}
      trailing={null}
      onClick={() => void save()}
    />
  );
}
