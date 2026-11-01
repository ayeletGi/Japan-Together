import {
  Camera,
  ExternalLink as ExternalLinkIcon,
  ImageOff,
  Link as LinkIcon,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../app/toastContext';
import { ExternalLink } from '../../components/ExternalLink';
import { photoUrl } from '../../lib/liveEdit';
import { shrinkPhoto } from '../../lib/photo';
import type { PhotoChoice } from './itemPhoto';
import { boxLink } from './lists';

/* An item's photo and link: the fields both item forms share, and the photo itself. */

/** A list item's photo; without internet, one this phone never saw shows as a small sign. */
export function Photo({ src, big = false }: { src: string; big?: boolean }) {
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className={big ? 'list-photo-missing list-photo-missing--big' : 'list-photo-missing'}>
        <ImageOff size={big ? 28 : 20} aria-hidden="true" />
        {big && <span>{t('lists.photoOffline')}</span>}
      </span>
    );
  }
  return (
    <img
      className={big ? 'list-photo-big' : undefined}
      src={src}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

/** "Add a photo" (camera or gallery), or the chosen photo with change and remove. */
export function PhotoField({
  value,
  onChange,
}: {
  value: PhotoChoice;
  onChange: (photo: PhotoChoice) => void;
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const blob = value && 'blob' in value ? value.blob : null;
  const preview = useMemo(() => blob && URL.createObjectURL(blob), [blob]);
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);
  const src = preview ?? (value && 'id' in value ? photoUrl(value.id) : null);

  const picker = (label: string, className: string) => (
    <label className={className}>
      <Camera size={16} aria-hidden="true" />
      {busy ? t('lists.preparingPhoto') : label}
      <input
        type="file"
        accept="image/*"
        className="list-photo-input"
        disabled={busy}
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (!file) return;
          setBusy(true);
          try {
            onChange({ blob: await shrinkPhoto(file) });
          } catch {
            toast(t('lists.photoFailed'));
          } finally {
            setBusy(false);
          }
        }}
      />
    </label>
  );

  if (!src) return picker(t('lists.addPhoto'), 'btn btn--small list-extra-add');
  return (
    <div className="list-photo-field">
      <span className="list-thumb">
        <Photo key={src} src={src} />
      </span>
      {picker(t('lists.changePhoto'), 'btn btn--small')}
      <button
        type="button"
        className="round-button list-action"
        aria-label={t('lists.removePhoto')}
        onClick={() => onChange(null)}
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

/** "Add a link", or a box for the item's web address with ways to open it and take it off. */
export function LinkField({
  value,
  onChange,
}: {
  value: string;
  onChange: (link: string) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  // Once shown, the box stays while its address is cleared to type another; only its X closes it.
  const [shown, setShown] = useState(false);
  if (value && !shown) setShown(true);
  const address = boxLink(value);
  if (!value && !open && !shown) {
    return (
      <button type="button" className="btn btn--small list-extra-add" onClick={() => setOpen(true)}>
        <LinkIcon size={16} aria-hidden="true" />
        {t('lists.addLink')}
      </button>
    );
  }
  return (
    <div className="list-link-field">
      <span className="list-link-box">
        <LinkIcon size={17} className="list-link-field-icon" aria-hidden="true" />
        <input
          className="input"
          inputMode="url"
          dir="ltr"
          autoFocus={open}
          aria-label={t('lists.link')}
          placeholder={t('lists.linkPlaceholder')}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </span>
      {address && (
        <ExternalLink
          className="round-button list-action list-link-open"
          href={address}
          aria-label={t('lists.openTypedLink')}
        >
          <ExternalLinkIcon size={16} aria-hidden="true" />
        </ExternalLink>
      )}
      <button
        type="button"
        className="round-button list-action"
        aria-label={t('lists.removeLink')}
        onClick={() => {
          onChange('');
          setOpen(false);
          setShown(false);
        }}
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
