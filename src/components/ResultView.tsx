import React, { useState } from 'react';
import { Layers, HelpCircle, Clock, Tag } from 'lucide-react';
import type { StudyDeckResult } from '../types/result';
import { FlashcardDeck } from './FlashcardDeck';
import { QuizMode } from './QuizMode';
import { RefinementBar } from './RefinementBar';

interface ResultViewProps {
  data: StudyDeckResult;
  cardMastery: Record<string, boolean>;
  onToggleMastery: (cardId: string) => void;
  onRefine: (instruction: string) => void;
  isRefining: boolean;
  onQuizComplete?: (score: number, total: number) => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  data,
  cardMastery,
  onToggleMastery,
  onRefine,
  isRefining,
  onQuizComplete,
}) => {
  const [activeTab, setActiveTab] = useState<'cards' | 'quiz'>('cards');

  return (
    <section className="result-section" aria-label="Study Results">
      {/* Deck Metadata Header Card */}
      <div className="deck-meta-card glass-panel">
        <div className="deck-header-info">
          <h2>{data.deckTitle}</h2>
          <p className="deck-summary">{data.summary}</p>

          <div className="deck-tags">
            {data.estimatedStudyTimeMinutes && (
              <span className="deck-tag" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Clock size={12} color="var(--accent-warning)" />
                <span>~{data.estimatedStudyTimeMinutes} min study time</span>
              </span>
            )}
            {data.tags?.map((tag, idx) => (
              <span key={idx} className="deck-tag" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Tag size={11} color="var(--accent-primary)" />
                <span>{tag}</span>
              </span>
            ))}
          </div>
        </div>

        {/* View Mode Switcher (Flashcards vs Quiz) */}
        <div className="view-mode-tabs" role="tablist">
          <button
            id="tab-flashcards"
            type="button"
            role="tab"
            aria-selected={activeTab === 'cards'}
            className={`tab-btn ${activeTab === 'cards' ? 'active' : ''}`}
            onClick={() => setActiveTab('cards')}
          >
            <Layers size={16} />
            <span>Flashcards ({data.cards.length})</span>
          </button>

          <button
            id="tab-quiz"
            type="button"
            role="tab"
            aria-selected={activeTab === 'quiz'}
            className={`tab-btn ${activeTab === 'quiz' ? 'active' : ''}`}
            onClick={() => setActiveTab('quiz')}
          >
            <HelpCircle size={16} />
            <span>Quiz Mode ({data.quiz.length})</span>
          </button>
        </div>
      </div>

      {/* Main Interactive View Router */}
      <div className="interactive-content-area">
        {activeTab === 'cards' ? (
          <FlashcardDeck
            cards={data.cards}
            cardMastery={cardMastery}
            onToggleMastery={onToggleMastery}
          />
        ) : (
          <QuizMode
            questions={data.quiz}
            onQuizComplete={onQuizComplete}
          />
        )}
      </div>

      {/* Iterative Refinement Bar */}
      <RefinementBar onRefine={onRefine} isLoading={isRefining} />
    </section>
  );
};
