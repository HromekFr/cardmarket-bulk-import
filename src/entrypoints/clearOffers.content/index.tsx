import { defineContentScript, createIntegratedUi } from '#imports';

import ReactDOM from 'react-dom/client';

import App from './App';

export default defineContentScript({
  matches: ['*://*.cardmarket.com/*/*/Stock/Offers/Singles*'],
  main: (ctx) => {
    const ui = createIntegratedUi(ctx, {
      position: 'inline',
      anchor: () => {
        const paginationRows = document.querySelectorAll('div.row.pagination');
        if (paginationRows.length === 0) return null;
        const topRow = paginationRows[0];
        const col3Last = topRow.querySelector('div.col-3:last-child');
        return col3Last ?? null;
      },
      append: 'last',
      onMount: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(<App />);
        return root;
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });
    ui.autoMount({ once: true });
  },
});
