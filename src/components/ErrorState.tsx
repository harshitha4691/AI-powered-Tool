import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp, Bug, Terminal } from 'lucide-react';
import type { ApiErrorResponse } from '../types/result';

interface ErrorStateProps {
  error: ApiErrorResponse['error'];
  onRetry: () => void;
  onReset?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry, onReset }) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const getErrorHeader = () => {
    switch (error.code) {
      case 'MALFORMED_JSON':
        return {
          title: 'AI Output Could Not Be Parsed',
          description:
            'The language model produced output that broke JSON syntax rules (e.g. truncated quotes or missing brackets). Our defensive validation caught this before it reached the UI.',
        };
      case 'INVALID_SHAPE':
        return {
          title: 'Unexpected Data Structure',
          description:
            'The AI returned valid JSON, but the data schema was missing required fields (such as the "cards" array or card questions/answers).',
        };
      case 'EMPTY_RESPONSE':
        return {
          title: 'Empty AI Response',
          description:
            'The AI model returned an empty text payload or 0 flashcards. Please provide more detailed notes or try another topic.',
        };
      case 'TIMEOUT':
        return {
          title: 'Request Timed Out',
          description:
            'The AI model took longer than 25 seconds to generate structured content. Upstream servers may be under heavy load.',
        };
      case 'NETWORK_ERROR':
        return {
          title: 'Backend Proxy Unreachable',
          description:
            'Failed to establish connection with the backend proxy server at port 3001. Please check if the server is running.',
        };
      default:
        return {
          title: 'Generation Failed',
          description: error.message || 'An unexpected error occurred while processing the request.',
        };
    }
  };

  const header = getErrorHeader();

  return (
    <div className="error-card" role="alert" aria-live="assertive">
      <div className="error-header">
        <div className="error-icon-box">
          <AlertTriangle size={24} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <h3 className="error-title">{header.title}</h3>
            <span className="error-code-badge">{error.code}</span>
          </div>
          <p className="error-message" style={{ marginTop: '0.4rem' }}>
            {header.description}
          </p>
        </div>
      </div>

      {(error.details || error.rawSnippet) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowTechnicalDetails((prev) => !prev)}
            style={{ fontSize: '0.8rem', width: 'fit-content', padding: '0.35rem 0.75rem' }}
          >
            <Bug size={14} />
            <span>{showTechnicalDetails ? 'Hide Diagnostic Details' : 'View Diagnostic Details'}</span>
            {showTechnicalDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showTechnicalDetails && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {error.details && (
                <div style={{ fontSize: '0.85rem', color: '#fca5a5' }}>
                  <strong>Detail:</strong> {error.details}
                </div>
              )}
              {error.rawSnippet && (
                <div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      marginBottom: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    <Terminal size={12} /> Raw Model Snippet Caught by Validator:
                  </div>
                  <pre className="error-raw-snippet">{error.rawSnippet}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="error-actions">
        <button
          id="error-retry-btn"
          type="button"
          className="action-btn-primary"
          onClick={onRetry}
          style={{ background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' }}
        >
          <RefreshCw size={16} />
          <span>Retry Generation</span>
        </button>

        {onReset && (
          <button type="button" className="btn-secondary" onClick={onReset}>
            Edit Input Notes
          </button>
        )}
      </div>
    </div>
  );
};
