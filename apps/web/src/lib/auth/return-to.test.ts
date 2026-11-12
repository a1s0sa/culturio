import { describe, expect, it } from 'vitest';
import { safeReturnTo } from './return-to';

describe('safeReturnTo', () => {
  it('preserves internal paths and query parameters', () => {
    expect(safeReturnTo('/artifacts/blue-vase?view=detail')).toBe(
      '/artifacts/blue-vase?view=detail'
    );
  });

  it.each(['https://example.com', '//example.com', '/\\example.com', null])(
    'falls back for unsafe destination %s',
    (value) => {
      expect(safeReturnTo(value)).toBe('/gallery');
    }
  );
});
