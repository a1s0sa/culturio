import { describe, expect, it } from 'vitest';
import { classifyAfricanGeography, parseHistoricalDate } from '../src/index.js';

describe('historical dates', () => {
  it('preserves BCE ranges and uncertainty', () => {
    expect(parseHistoricalDate('ca. 500–400 BCE')).toEqual({ earliest: -500, latest: -400, uncertain: true });
  });
  it('does not invent missing dates', () => expect(parseHistoricalDate('unknown')).toEqual({ earliest: null, latest: null, uncertain: true }));
});

describe('geographic classification', () => {
  it('uses explicit mapped metadata', () => expect(classifyAfricanGeography(['Yoruba'])).toBe('african'));
  it('does not accept a bare Africa mention as proof', () => expect(classifyAfricanGeography(['possibly Africa'])).toBe('ambiguous'));
});
