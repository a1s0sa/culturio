import { describe, expect, it } from 'vitest';
import { museumConcept } from './museum';

describe('museum concept configuration', () => {
  it('uses metre-scale, human-sized dimensions', () => {
    expect(museumConcept.units).toBe('metres');
    expect(museumConcept.camera.position[1]).toBe(1.7);
    expect(museumConcept.entrance.height).toBeGreaterThan(museumConcept.camera.position[1]);
  });

  it('keeps the proposed circulation sequence ordered from south to north', () => {
    expect(museumConcept.spaces.map((space) => space.center[2])).toEqual([20, 8, -6.5, -34]);
  });

  it('reserves future exhibit zones inside the hall footprint', () => {
    const hall = museumConcept.spaces.find((space) => space.id === 'hall');
    expect(hall).toBeDefined();
    expect(hall).toMatchObject({ width: 44, depth: 44, height: 15 });

    for (const zone of museumConcept.futureExhibitZones) {
      const distanceFromCenter = Math.hypot(
        zone.center[0] - hall!.center[0],
        zone.center[2] - hall!.center[2]
      );
      const halfDiagonal = Math.hypot(zone.width / 2, zone.depth / 2);
      expect(distanceFromCenter + halfDiagonal).toBeLessThanOrEqual(hall!.width / 2);
    }
  });
});
