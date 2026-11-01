import { Component, type ErrorInfo, type ReactNode } from 'react';
import i18n from '../i18n';
import { forgetSavedChanges } from '../data/live';

/**
 * If a screen fails to draw, shows a way out instead of a blank page: reload, or forget this
 * phone's saved copy of the live changes (the usual cause) and reload.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const t = i18n.t.bind(i18n);
    return (
      <main className="wrap stack crash" role="alert">
        <h1>{t('crash.title')}</h1>
        <p>{t('crash.body')}</p>
        <button type="button" className="btn btn--primary" onClick={() => location.reload()}>
          {t('crash.reload')}
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => {
            forgetSavedChanges();
            location.reload();
          }}
        >
          {t('crash.reset')}
        </button>
      </main>
    );
  }
}
