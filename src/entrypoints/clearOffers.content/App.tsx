import { useState, useEffect, useRef } from 'react';

import { Button, Modal } from 'react-bootstrap';

import {
  getArticleRows,
  getTotalCount,
  startClearing,
  clearCurrentPage,
  cancelClearing,
  resumeIfActive,
  getBaseOffersUrl,
} from './clear-runner';

type UiState = 'idle' | 'running' | 'done';

function App() {
  const [hasRows, setHasRows] = useState(false);
  const [uiState, setUiState] = useState<UiState>('idle');
  const [showConfirm, setShowConfirm] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [removed, setRemoved] = useState(0);
  const [doneCount, setDoneCount] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  // Watch article row presence for idle button enabled/disabled state
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

  // On mount, check if a clear is in progress and resume
  useEffect(() => {
    resumeIfActive().then((state) => {
      if (!state) return;

      setTotalCount(state.total);
      setRemoved(state.removed);
      setUiState('running');

      const rows = getArticleRows();
      if (rows.length === 0) {
        // No more rows — clear is complete
        cancelClearing().then(() => {
          setDoneCount(state.removed);
          setUiState('done');
          setTimeout(() => setUiState('idle'), 3000);
        });
        return;
      }

      // Continue clearing from where we left off
      const controller = new AbortController();
      abortRef.current = controller;
      clearCurrentPage(state.removed, state.total, (r) => setRemoved(r), controller.signal).then((totalRemoved) => {
        if (controller.signal.aborted) return;
        void totalRemoved;
        window.location.href = getBaseOffersUrl();
      });
    });
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

    const controller = new AbortController();
    abortRef.current = controller;
    await clearCurrentPage(0, totalCount, (r) => setRemoved(r), controller.signal);

    if (controller.signal.aborted) return;

    // Navigate to base URL; resume logic will pick up or mark complete on reload
    window.location.href = getBaseOffersUrl();
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    cancelClearing();
    setUiState('idle');
  };

  // --- Running state ---
  if (uiState === 'running') {
    return (
      <span className="d-flex align-items-center gap-2">
        <span>Removing… ({removed}/{totalCount})</span>
        <Button variant="secondary" size="sm" onClick={handleCancel}>
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
