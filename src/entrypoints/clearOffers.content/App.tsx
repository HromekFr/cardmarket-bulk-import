import { useState, useEffect } from 'react';

import { Button } from 'react-bootstrap';

function App() {
  const [hasRows, setHasRows] = useState(false);

  useEffect(() => {
    const checkRows = () => {
      const rows = document.querySelectorAll('div[id^="articleRow"]');
      setHasRows(rows.length > 0);
    };

    checkRows();

    const observer = new MutationObserver(checkRows);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  const handleClick = () => {
    console.log('[clearOffers] button clicked — no removal logic yet');
  };

  return (
    <Button
      variant="danger"
      disabled={!hasRows}
      onClick={handleClick}
    >
      Clear All Offers
    </Button>
  );
}

export default App;
