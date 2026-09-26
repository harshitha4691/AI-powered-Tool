import React from 'react';
import { History, Download, Trash2, Calendar, Layers } from 'lucide-react';
import type { SavedDeck } from '../types/result';

interface DeckHistoryProps {
  savedDecks: SavedDeck[];
  activeDeckId?: string;
  onSelectDeck: (deck: SavedDeck) => void;
  onDeleteDeck: (id: string, e: React.MouseEvent) => void;
  onExportJson: () => void;
  onExportMarkdown: () => void;
}

export const DeckHistory: React.FC<DeckHistoryProps> = ({
  savedDecks,
  activeDeckId,
  onSelectDeck,
  onDeleteDeck,
  onExportJson,
  onExportMarkdown,
}) => {
  if (savedDecks.length === 0) {
    return null;
  }

  return (
    <div className="glass-panel" style={{ padding: '1.25rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <History size={17} color="var(--accent-primary)" />
          <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff' }}>
            Saved Decks & Sessions ({savedDecks.length})
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onExportJson}
            title="Download active deck as raw structured JSON"
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
          >
            <Download size={13} />
            <span>Export JSON</span>
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={onExportMarkdown}
            title="Download printable study guide"
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
          >
            <Download size={13} />
            <span>Export Markdown</span>
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '0.75rem',
        }}
      >
        {savedDecks.map((item) => {
          const isActive = item.id === activeDeckId;
          const masteredCount = Object.values(item.cardMastery).filter(Boolean).length;
          const formattedDate = new Date(item.createdAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div
              key={item.id}
              onClick={() => onSelectDeck(item)}
              role="button"
              tabIndex={0}
              style={{
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${isActive ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
                transition: 'all var(--transition-fast)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <h5
                  style={{
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '180px',
                  }}
                  title={item.deck.deckTitle}
                >
                  {item.deck.deckTitle}
                </h5>

                <button
                  type="button"
                  onClick={(e) => onDeleteDeck(item.id, e)}
                  style={{
                    color: 'var(--text-muted)',
                    padding: '0.2rem',
                    borderRadius: '4px',
                  }}
                  title="Delete deck from history"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Layers size={11} /> {item.deck.cards.length} cards ({masteredCount} mastered)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Calendar size={11} /> {formattedDate}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
