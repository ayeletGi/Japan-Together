import { MapPin } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { IconTile } from '../../components/IconTile';
import type { Tone } from '../../components/tone';
import { ExternalLink } from '../../components/ExternalLink';
import { useContentProps } from '../../i18n';

/**
 * A calm white place card: icon tile, name, a short line, small facts and pills, and a round
 * maps button. Anything extra (source check, links, details) goes below as children.
 */
export function PlaceCard({
  icon,
  tone,
  name,
  text,
  facts,
  pills,
  mapsHref,
  mapsLabel,
  highlight = false,
  children,
}: {
  icon: ReactNode;
  tone: Tone;
  name: string;
  text?: string;
  facts?: ReactNode;
  pills?: ReactNode;
  mapsHref?: string;
  /** Read aloud for the maps button; defaults to "directions to <name>". */
  mapsLabel?: string;
  highlight?: boolean;
  children?: ReactNode;
}) {
  const { t } = useTranslation();
  const content = useContentProps();
  return (
    <article className={`place-card reveal-item${highlight ? ' place-card--on' : ''}`}>
      <div className="place-main">
        <IconTile tone={tone} size="lg">
          {icon}
        </IconTile>
        <div className="place-body">
          <h3>
            <bdi>{name}</bdi>
          </h3>
          {text && (
            <p className="place-text" {...content}>
              {text}
            </p>
          )}
          {facts && (
            <div className="place-facts" {...content}>
              {facts}
            </div>
          )}
          {pills && <div className="place-pills">{pills}</div>}
        </div>
        {mapsHref && (
          <ExternalLink
            className="round-button place-maps"
            href={mapsHref}
            aria-label={mapsLabel ?? t('discover.mapsTo', { name })}
            title={mapsLabel}
          >
            <MapPin size={20} aria-hidden="true" />
          </ExternalLink>
        )}
      </div>
      {children && <div className="place-extra">{children}</div>}
    </article>
  );
}

/** One small fact line: an icon, then text. */
export function PlaceFact({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <span className="place-fact">
      {icon}
      <span>{children}</span>
    </span>
  );
}
