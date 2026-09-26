import React, { useEffect, useState } from 'react';
import { XCircle, CheckCircle2, Cpu } from 'lucide-react';

interface LoadingStateProps {
  onCancel?: () => void;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ onCancel }) => {
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const steps = [
    { label: 'Connecting to backend proxy...', minTime: 0 },
    { label: 'Prompting Gemini with strict JSON schema...', minTime: 1 },
    { label: 'Extracting key concepts, cards & quiz items...', minTime: 3 },
    { label: 'Defensively validating JSON shape & types...', minTime: 6 },
  ];

  return (
    <div className="loading-card glass-panel" role="status" aria-live="polite">
      <div className="spinner-outer">
        <div className="spinner-ring" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>
          Crafting Your Interactive Study Deck
        </h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          Transforming free-form notes into structured active recall components ({secondsElapsed}s)
        </p>
      </div>

      <div className="loading-steps">
        {steps.map((step, idx) => {
          const isPassed = secondsElapsed >= step.minTime;
          const isCurrent =
            secondsElapsed >= step.minTime &&
            (idx === steps.length - 1 || secondsElapsed < steps[idx + 1].minTime);

          return (
            <div
              key={idx}
              className={`loading-step-item ${isCurrent ? 'active' : ''}`}
              style={{ opacity: isPassed ? 1 : 0.4 }}
            >
              {isPassed ? (
                <CheckCircle2 size={16} color="var(--accent-success)" />
              ) : (
                <Cpu size={16} color="var(--text-muted)" />
              )}
              <span>{step.label}</span>
            </div>
          );
        })}
      </div>

      {secondsElapsed > 12 && (
        <p style={{ fontSize: '0.8rem', color: 'var(--accent-warning)', maxWidth: '400px' }}>
          LLM reasoning is taking a few extra seconds. Generating thorough flashcards and multiple-choice explanations...
        </p>
      )}

      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
          style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}
          title="Abort slow request"
        >
          <XCircle size={15} />
          <span>Cancel Request</span>
        </button>
      )}
    </div>
  );
};
