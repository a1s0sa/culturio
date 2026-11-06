import { describe, expect, it } from 'vitest';
import { MetAdapter } from '../src/adapters/met.js';
import { SmithsonianAdapter } from '../src/adapters/smithsonian.js';

describe('museum normalization', () => {
  it('normalizes a Met BCE object without inventing precision', async () => {
    const result = await new MetAdapter().normalize({
      objectID: 1,
      isPublicDomain: true,
      primaryImage: 'https://images.example/1.jpg',
      additionalImages: [],
      objectURL: 'https://met.example/1',
      accessionNumber: 'A1',
      title: 'Mask',
      objectName: 'Mask',
      culture: 'Yoruba',
      country: 'Nigeria',
      region: '',
      subregion: '',
      locale: '',
      period: '',
      dynasty: '',
      objectDate: 'ca. 500 BCE',
      objectBeginDate: null,
      objectEndDate: null,
      medium: 'Wood; pigment',
      dimensions: '20 cm',
      creditLine: 'The Met',
      repository: 'The Met',
      tags: []
    });
    expect(result.earliestYear).toBe(-500);
    expect(result.dateUncertain).toBe(true);
    expect(result.images[0]?.license.redistributionAllowed).toBe(true);
  });
  it('rejects records whose metadata only contains an unverified Africa mention', async () => {
    const adapter = new SmithsonianAdapter('test');
    await expect(
      adapter.normalize({
        id: 'x',
        title: 'Object',
        url: 'https://si.edu/x',
        content: { indexedStructured: { place: ['possibly Africa'] } }
      })
    ).resolves.toMatchObject({ geographyConfidence: 'ambiguous' });
  });
});
