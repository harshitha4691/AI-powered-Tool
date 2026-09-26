import React, { useState } from 'react';
import { ShieldAlert, ChevronDown, ChevronUp, Zap, Clock, FileWarning, HelpCircle } from 'lucide-react';
import type { GenerationRequest } from '../types/result';

interface FailureSimulatorProps {
  onTriggerSimulation: (type: GenerationRequest['simulateError']) => void;
  onTriggerRaceCondition: () => void;
  isLoading: boolean;
}

export const FailureSimulator: React.FC<FailureSimulatorProps> = ({
  onTriggerSimulation,
  onTriggerRaceCondition,
  isLoading,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="simulator-drawer" role="region" aria-label="Interviewer Testing Suite">
      <div className="simulator-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldAlert size={16} color="var(--accent-warning)" />
          <span>Interviewer Evaluation Toolbar: Failure Mode Testing</span>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="btn-secondary"
          style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
        >
          <span>{isOpen ? 'Collapse' : 'Expand Tests'}</span>
          {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {isOpen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            Click any test below to verify that malformed AI outputs, missing JSON fields,
            server crashes, timeouts, and stale race conditions route directly to defensive UI states
            without crashing or blank renders:
          </p>

          <div className="simulator-buttons">
            <button
              id="test-sim-malformed"
              type="button"
              className="sim-btn"
              onClick={() => onTriggerSimulation('malformed')}
              disabled={isLoading}
              title="Return broken JSON with syntax error"
            >
              <FileWarning size={13} style={{ display: 'inline', marginRight: '4px' }} />
              Test Malformed JSON
            </button>

            <button
              id="test-sim-wrong-shape"
              type="button"
              className="sim-btn"
              onClick={() => onTriggerSimulation('wrong-shape')}
              disabled={isLoading}
              title="Return valid JSON missing cards array"
            >
              <HelpCircle size={13} style={{ display: 'inline', marginRight: '4px' }} />
              Test Wrong Shape
            </button>

            <button
              id="test-sim-empty"
              type="button"
              className="sim-btn"
              onClick={() => onTriggerSimulation('empty')}
              disabled={isLoading}
              title="Return whitespace/empty payload"
            >
              Test Empty Payload
            </button>

            <button
              id="test-sim-timeout"
              type="button"
              className="sim-btn"
              onClick={() => onTriggerSimulation('timeout')}
              disabled={isLoading}
              title="Simulate slow response exceeding 25s threshold"
            >
              <Clock size={13} style={{ display: 'inline', marginRight: '4px' }} />
              Test 25s Timeout
            </button>

            <button
              id="test-sim-500"
              type="button"
              className="sim-btn"
              onClick={() => onTriggerSimulation('server-error')}
              disabled={isLoading}
              title="Simulate upstream server 500 error"
            >
              Test 500 Server Outage
            </button>

            <button
              id="test-sim-race"
              type="button"
              className="sim-btn"
              onClick={onTriggerRaceCondition}
              disabled={isLoading}
              style={{ background: 'rgba(99, 102, 241, 0.15)', borderColor: 'rgba(99, 102, 241, 0.4)', color: '#c7d2fe' }}
              title="Test useRef(requestId) guard against slow/fast race condition"
            >
              <Zap size={13} style={{ display: 'inline', marginRight: '4px' }} />
              Test Stale Response Guard (Race Condition)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
