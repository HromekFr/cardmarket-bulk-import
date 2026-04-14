import { describe, it, expect } from 'vitest';
import { buildPageUrl } from '../url';

describe('buildPageUrl', () => {
  it('builds page-1 URL without &site param', () => {
    expect(buildPageUrl(12345, 1)).toBe('?idExpansion=12345&sortBy=number');
  });

  it('builds page-N URL with &site=N param', () => {
    expect(buildPageUrl(12345, 3)).toBe('?idExpansion=12345&sortBy=number&site=3');
  });
});
