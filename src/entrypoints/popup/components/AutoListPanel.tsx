import { i18n } from '#imports';
import { useEffect, useRef, useState } from 'react';
import { sendMessage } from 'webext-bridge/popup';
import { Alert, Button, Form, ListGroup, Spinner, Stack } from 'react-bootstrap';

import Panel from './panels-context/Panel';
import { getSettings } from '../../../utils/settings';
import { getAutomationState, dispatchAutomation } from '../../../utils/automation/store';
import { parseManaBoxCsv } from '../../../utils/manabox-parser';
import type { AutomationState } from '../../../utils/automation/types';

function AutoListPanel() {
  const [state, setState] = useState<AutomationState | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Load initial state and subscribe to storage changes
  useEffect(() => {
    getAutomationState().then(setState);

    const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if ('automationState' in changes) {
        setState(changes['automationState'].newValue as AutomationState);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  // Auto-scroll log to bottom on new entries
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state?.log.length]);

  async function handleStart() {
    if (!pendingFile) return;
    setCsvError(null);
    try {
      const settings = await getSettings();
      const cards = await parseManaBoxCsv(pendingFile, settings.priceFloor);
      await sendMessage('cardmarket-bulk-import.startAutomation', { cards }, 'background');
    } catch (e) {
      setCsvError(i18n.t('popup.panels.autoList.idle.invalidCsv'));
    }
  }

  async function handleStop() {
    await dispatchAutomation({ type: 'pause' });
  }

  async function handleResume() {
    // Background dispatches 'resume' and re-navigates to current expansion/page
    await sendMessage('cardmarket-bulk-import.resumeAutomation', undefined, 'background');
  }

  async function handleReset() {
    await new Promise<void>((res) => chrome.storage.local.remove('automationState', res));
    const fresh = await getAutomationState();
    setState(fresh);
  }

  if (!state) {
    return (
      <Panel title={i18n.t('popup.panels.autoList.title')}>
        <Stack className="align-items-center mt-3">
          <Spinner animation="border" size="sm" />
        </Stack>
      </Panel>
    );
  }

  // ── COMPLETE ──────────────────────────────────────────────────────────────
  if (state.status === 'complete') {
    return (
      <Panel title={i18n.t('popup.panels.autoList.title')}>
        <Stack gap={2} className="mt-2">
          <Alert variant="success" className="mb-0">
            {i18n.t('popup.panels.autoList.complete.listed')}: <strong>{state.listedCount}</strong>
          </Alert>
          {state.unmatchedCards.length > 0 && (
            <>
              <p className="mb-1 fw-bold small">
                {i18n.t('popup.panels.autoList.complete.unmatched')} ({state.unmatchedCards.length}):
              </p>
              <ListGroup style={{ maxHeight: 160, overflowY: 'auto' }}>
                {state.unmatchedCards.map((c, i) => (
                  <ListGroup.Item key={i} className="py-1 small">
                    {c.name} <span className="text-secondary">({c.set})</span>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </>
          )}
          <Button variant="primary" onClick={handleReset}>
            {i18n.t('popup.panels.autoList.complete.newRunButton')}
          </Button>
        </Stack>
      </Panel>
    );
  }

  // ── RUNNING / PAUSED ─────────────────────────────────────────────────────
  if (state.status === 'running' || state.status === 'paused') {
    return (
      <Panel title={i18n.t('popup.panels.autoList.title')}>
        <Stack gap={2} className="mt-2">
          <Stack direction="horizontal" gap={2}>
            {state.status === 'paused' ? (
              <Button variant="success" size="sm" onClick={handleResume}>
                {i18n.t('popup.panels.autoList.paused.resumeButton')}
              </Button>
            ) : (
              <Spinner animation="border" size="sm" />
            )}
            <Button variant="outline-danger" size="sm" onClick={handleStop}>
              {i18n.t('popup.panels.autoList.running.stopButton')}
            </Button>
            <Button variant="outline-secondary" size="sm" onClick={handleReset}>
              {i18n.t('popup.panels.autoList.running.resetButton')}
            </Button>
            <span className="text-secondary small ms-auto">
              {state.listedCount} listed
            </span>
          </Stack>
          <p className="mb-1 small fw-bold">{i18n.t('popup.panels.autoList.running.log')}</p>
          <ListGroup style={{ maxHeight: 200, overflowY: 'auto' }}>
            {state.log.map((entry, i) => (
              <ListGroup.Item key={i} className="py-1 small">
                {entry.message}
                {entry.detail && entry.detail.length > 0 && (
                  <ul className="mb-0 mt-1 ps-3" style={{ listStyle: 'disc' }}>
                    {entry.detail.map((line, j) => (
                      <li key={j} className="text-secondary">{line}</li>
                    ))}
                  </ul>
                )}
              </ListGroup.Item>
            ))}
            <div ref={logEndRef} />
          </ListGroup>
        </Stack>
      </Panel>
    );
  }

  // ── IDLE ─────────────────────────────────────────────────────────────────
  return (
    <Panel title={i18n.t('popup.panels.autoList.title')}>
      <Stack gap={3} className="mt-2">
        <Form.Group>
          <Form.Label>{i18n.t('popup.panels.autoList.idle.fileLabel')}</Form.Label>
          <Form.Control
            type="file"
            accept=".csv"
            onChange={(e) => {
              const file = (e.target as HTMLInputElement).files?.[0] ?? null;
              setPendingFile(file);
              setCsvError(null);
            }}
          />
          {csvError && <Form.Text className="text-danger">{csvError}</Form.Text>}
        </Form.Group>
        <Button disabled={!pendingFile} onClick={handleStart}>
          {i18n.t('popup.panels.autoList.idle.startButton')}
        </Button>
      </Stack>
    </Panel>
  );
}

export default AutoListPanel;
