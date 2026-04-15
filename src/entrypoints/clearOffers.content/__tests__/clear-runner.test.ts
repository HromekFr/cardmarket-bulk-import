import { describe, it, expect, beforeEach } from 'vitest';

import { getArticleRows } from '../clear-runner';

function appendRow(id: string): HTMLDivElement {
  const div = document.createElement('div');
  div.id = id;
  document.body.appendChild(div);
  return div;
}

describe('getArticleRows', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('returns an empty array when no articleRow elements are present', () => {
    expect(getArticleRows()).toEqual([]);
  });

  it('returns the correct article IDs when one row is present', () => {
    appendRow('articleRow123');
    expect(getArticleRows()).toEqual(['articleRow123']);
  });

  it('returns correct IDs when multiple rows are present', () => {
    appendRow('articleRow1');
    appendRow('articleRow2');
    appendRow('articleRow3');
    expect(getArticleRows()).toEqual(['articleRow1', 'articleRow2', 'articleRow3']);
  });

  it('ignores div elements whose id does not start with articleRow', () => {
    appendRow('articleRow42');
    appendRow('someOtherDiv');
    appendRow('notAnArticleRow99');
    expect(getArticleRows()).toEqual(['articleRow42']);
  });
});
