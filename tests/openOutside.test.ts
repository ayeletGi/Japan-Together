import { describe, expect, it } from 'vitest';
import { androidIntentUrl } from '../src/lib/openOutside';

describe('androidIntentUrl', () => {
  it('turns a web link into an Android intent that opens the browser', () => {
    expect(androidIntentUrl('https://kosher.global/zekasher/?a=1')).toBe(
      'intent://kosher.global/zekasher/?a=1#Intent;scheme=https;action=android.intent.action.VIEW;' +
        'S.browser_fallback_url=https%3A%2F%2Fkosher.global%2Fzekasher%2F%3Fa%3D1;end',
    );
  });

  it('drops the hash fragment from the intent path', () => {
    expect(androidIntentUrl('http://example.com/a#b')).toMatch(/^intent:\/\/example\.com\/a#Intent;scheme=http;/);
  });

  it('leaves non-web links alone', () => {
    expect(androidIntentUrl('tel:110')).toBeNull();
    expect(androidIntentUrl('not a url')).toBeNull();
  });
});
