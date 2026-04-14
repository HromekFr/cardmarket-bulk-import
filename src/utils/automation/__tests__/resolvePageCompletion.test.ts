import { describe, it, expect } from 'vitest';
import { resolvePageCompletion } from '../resolvePageCompletion';

const expansion = (id: number) => ({ cardmarketId: id, cards: [] });

describe('resolvePageCompletion', () => {
  it('returns nextPage when nextPageUrl is present and cards remain', () => {
    const result = resolvePageCompletion([], '?idExpansion=1&sortBy=number&site=2', true);
    expect(result).toEqual({ type: 'nextPage', navigateTo: '?idExpansion=1&sortBy=number&site=2' });
  });

  it('returns nextExpansion when nextPageUrl is null and expansions remain', () => {
    const result = resolvePageCompletion([expansion(42), expansion(99)], null, true);
    expect(result).toEqual({ type: 'nextExpansion', expansionId: 42 });
  });

  it('returns complete when nextPageUrl is null and no expansions remain', () => {
    const result = resolvePageCompletion([], null, false);
    expect(result).toEqual({ type: 'complete' });
  });

  it('nextPage takes precedence even when expansions remain', () => {
    const result = resolvePageCompletion([expansion(10)], '?idExpansion=5&sortBy=number&site=3', true);
    expect(result.type).toBe('nextPage');
  });

  it('skips to nextExpansion when all cards were listed even if nextPageUrl exists', () => {
    const result = resolvePageCompletion([expansion(10)], '?idExpansion=5&sortBy=number&site=2', false);
    expect(result).toEqual({ type: 'nextExpansion', expansionId: 10 });
  });

  it('returns complete when all cards listed and no expansions remain', () => {
    const result = resolvePageCompletion([], '?idExpansion=5&sortBy=number&site=2', false);
    expect(result).toEqual({ type: 'complete' });
  });
});
