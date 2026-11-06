import { describe, expect, it } from 'vitest';
import { getFloorHeight, isWalkable, resolveMovement } from './CollisionSystem';

describe('museum collision system', () => {
  it('allows movement through the aligned room openings', () => {
    expect(isWalkable([0, 8])).toBe(true);
    expect(isWalkable([0, -5])).toBe(true);
    expect(isWalkable([0, -34])).toBe(true);
  });

  it('blocks movement through lobby side walls', () => {
    expect(resolveMovement([8, 8], [2, 0])).toEqual([8, 8]);
  });

  it('slides along a wall when one movement axis remains valid', () => {
    expect(resolveMovement([8, 8], [2, -1])).toEqual([8, 7]);
  });

  it('prevents crossing beside the narrow corridor opening', () => {
    expect(resolveMovement([6, 1], [0, -2])).toEqual([6, 1]);
  });

  it('uses the circular hall boundary', () => {
    expect(isWalkable([18, -34])).toBe(true);
    expect(isWalkable([22, -34])).toBe(false);
    expect(isWalkable([18, -52])).toBe(false);
  });

  it('tracks the concentric sunken forum levels', () => {
    expect(getFloorHeight([0, -34])).toBe(-1.6);
    expect(getFloorHeight([9, -34])).toBe(-1.2);
    expect(getFloorHeight([12, -34])).toBe(-0.8);
    expect(getFloorHeight([15, -34])).toBe(-0.4);
    expect(getFloorHeight([19, -34])).toBe(0);
  });
});
