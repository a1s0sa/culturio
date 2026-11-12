import { describe, expect, it } from 'vitest';
import { avatarForUser } from './avatar';

describe('avatarForUser', () => {
  it('generates the same Shapes avatar for the same user id', () => {
    expect(avatarForUser('user-123')).toBe(avatarForUser('user-123'));
  });

  it('generates a distinct avatar for a different user id', () => {
    expect(avatarForUser('user-123')).not.toBe(avatarForUser('user-456'));
  });
});
