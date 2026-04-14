import { describe, it, expect } from 'vitest';
import { deriveBadgeText } from '../badge';

describe('deriveBadgeText', () => {
  it('returns empty string when idle', () => {
    expect(deriveBadgeText('idle', 5)).toBe('');
  });

  it('returns empty string when complete', () => {
    expect(deriveBadgeText('complete', 42)).toBe('');
  });

  it('returns listed count string when running', () => {
    expect(deriveBadgeText('running', 7)).toBe('7');
  });

  it('returns listed count string when paused', () => {
    expect(deriveBadgeText('paused', 13)).toBe('13');
  });

  it('returns "0" when running with zero listed', () => {
    expect(deriveBadgeText('running', 0)).toBe('0');
  });
});
