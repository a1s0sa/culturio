import { describe, expect, it } from 'vitest';
import { stableId, sourceRecordHash } from '../src/pipeline/persist.js';

describe('idempotent identity', () => {
  it('keeps source identity deterministic', () => expect(stableId('art','met:42')).toBe(stableId('art','met:42')));
  it('does not merge same titles across institutions', () => expect(stableId('art','met:42')).not.toBe(stableId('art','smithsonian:42')));
  it('hashes unchanged source records consistently', () => expect(sourceRecordHash({id:1,title:'Mask'})).toBe(sourceRecordHash({id:1,title:'Mask'})));
});
