import { describe, expect, it } from 'vitest';
import { toFtsQuery } from '../src/queries/search.js';

describe('FTS query handling', () => {
  it('retains words while discarding operators and punctuation', () => expect(toFtsQuery('mask OR "statue" -bad')).toBe('"mask"* AND "OR"* AND "statue"* AND "bad"*'));
  it('returns no query for punctuation', () => expect(toFtsQuery('***')).toBe(''));
});
