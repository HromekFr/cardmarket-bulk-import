import { useState, useEffect } from 'react';

import { Button, Modal } from 'react-bootstrap';

import { getArticleRows, getTotalCount, startClearing, clearCurrentPage, cancelClearing } from './clear-runner';

type UiState = 'idle' | 'running' | 'done';

function App() {
  const [hasRows, setHasRows] = useState(false);
  const [uiState, setUiState] = useState<UiState>('idle');
  const [showConfirm, setShowConfirm] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [removed, setRemoved] = useState(0);
  const [doneCount, setDoneCount] = useState(0);

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

  const handleClearClick = () => {
    const count = getTotalCount();
    setTotalCount(count);
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setShowConfirm(false);
    setRemoved(0);
    setUiState('running');
    await startClearing(totalCount);

    const totalRemoved = await clearCurrentPage(totalCount, (r) => {
      setRemoved(r);
    });

    await cancelClearing();
    setDoneCount(totalRemoved);
    setUiState('done');

    setTimeout(() => {
      setUiState('idle');
    }, 3000);
  };

  // --- Running state ---
  if (uiState === 'running') {
    return (
      <span className="d-flex align-items-center gap-2">
        <span>Removing… ({removed}/{totalCount})</span>
        <Button variant="secondary" size="sm" onClick={() => {
          cancelClearing();
          setUiState('idle');
        }}>
          Cancel
        </Button>
      </span>
    );
  }

  // --- Done state ---
  if (uiState === 'done') {
    return <span>Done — {doneCount} articles removed</span>;
  }

  // --- Idle state ---
  return (
    <>
      <Button
        variant="danger"
        disabled={!hasRows}
        onClick={handleClearClick}
      >
        Clear All Offers
      </Button>

      <Modal size="sm" show={showConfirm} onHide={() => setShowConfirm(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Clear All Offers</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Remove all {totalCount} article{totalCount !== 1 ? 's' : ''}? This cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirm(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleConfirm}>Remove All</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default App;
