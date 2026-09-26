import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  RotateCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  HelpCircle,
  Shuffle,
  Volume2,
  Sparkles,
} from 'lucide-react';
import type { Flashcard } from '../types/result';

interface FlashcardDeckProps {
  cards: Flashcard[];
  cardMastery: Record<string, boolean>;
  onToggleMastery: (cardId: string) => void;
}

export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({
  cards,
  cardMastery,
  onToggleMastery,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'needs-practice' | 'mastered'>('all');
  const [shuffledCards, setShuffledCards] = useState<Flashcard[]>(cards);

  // Synchronize when cards prop updates
  useEffect(() => {
    setShuffledCards(cards);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [cards]);

  // Filter cards based on mastery status
  const visibleCards = useMemo(() => {
    if (filterMode === 'mastered') {
      return shuffledCards.filter((c) => Boolean(cardMastery[c.id]));
    }
    if (filterMode === 'needs-practice') {
      return shuffledCards.filter((c) => !cardMastery[c.id]);
    }
    return shuffledCards;
  }, [shuffledCards, filterMode, cardMastery]);

  // Guard current index within bounds
  const activeIndex = visibleCards.length > 0 ? Math.min(currentIndex, visibleCards.length - 1) : 0;
  const currentCard = visibleCards[activeIndex];

  const totalMastered = useMemo(() => {
    return cards.filter((c) => Boolean(cardMastery[c.id])).length;
  }, [cards, cardMastery]);

  const handleNext = useCallback(() => {
    if (visibleCards.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1 < visibleCards.length ? prev + 1 : 0));
  }, [visibleCards.length]);

  const handlePrev = useCallback(() => {
    if (visibleCards.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 >= 0 ? prev - 1 : visibleCards.length - 1));
  }, [visibleCards.length]);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleShuffle = () => {
    setIsFlipped(false);
    const randomized = [...shuffledCards].sort(() => Math.random() - 0.5);
    setShuffledCards(randomized);
    setCurrentIndex(0);
  };

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentCard || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const textToSpeak = isFlipped ? currentCard.answer : currentCard.question;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.code === 'KeyM' && currentCard) {
        e.preventDefault();
        onToggleMastery(currentCard.id);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleFlip, handleNext, handlePrev, onToggleMastery, currentCard]);

  if (!cards || cards.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
        No flashcards generated.
      </div>
    );
  }

  const isCurrentMastered = currentCard ? Boolean(cardMastery[currentCard.id]) : false;

  return (
    <div className="flashcard-wrapper">
      {/* Top Controls & Filter */}
      <div className="deck-controls-top">
        <div className="filter-pills">
          <button
            type="button"
            className={`pill-btn ${filterMode === 'all' ? 'active' : ''}`}
            onClick={() => {
              setFilterMode('all');
              setCurrentIndex(0);
            }}
          >
            All ({cards.length})
          </button>
          <button
            type="button"
            className={`pill-btn ${filterMode === 'needs-practice' ? 'active' : ''}`}
            onClick={() => {
              setFilterMode('needs-practice');
              setCurrentIndex(0);
            }}
          >
            Needs Practice ({cards.length - totalMastered})
          </button>
          <button
            type="button"
            className={`pill-btn ${filterMode === 'mastered' ? 'active' : ''}`}
            onClick={() => {
              setFilterMode('mastered');
              setCurrentIndex(0);
            }}
          >
            Mastered ({totalMastered})
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleShuffle}
            title="Randomize card sequence"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
          >
            <Shuffle size={14} />
            <span>Shuffle</span>
          </button>

          <span className="progress-text">
            {totalMastered}/{cards.length} Mastered
          </span>
        </div>
      </div>

      {visibleCards.length === 0 ? (
        <div
          className="glass-panel"
          style={{ padding: '3rem 2rem', textAlign: 'center', maxWidth: '500px' }}
        >
          <Sparkles size={36} color="var(--accent-success)" style={{ margin: '0 auto 1rem' }} />
          <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
            {filterMode === 'mastered'
              ? 'No cards mastered yet!'
              : 'All cards in this deck are mastered!'}
          </h4>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            {filterMode === 'mastered'
              ? 'Flip through cards and press "Mark as Mastered" once you feel confident.'
              : 'Great job! Switch back to "All" cards to review again.'}
          </p>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setFilterMode('all')}
          >
            Show All Cards
          </button>
        </div>
      ) : (
        <>
          {/* 3D Flip Card Scene */}
          <div
            id="active-flashcard"
            className="card-scene"
            onClick={handleFlip}
            role="button"
            tabIndex={0}
            aria-label={`Flashcard: ${currentCard?.question}. Click to flip.`}
          >
            <div className={`card-object ${isFlipped ? 'is-flipped' : ''}`}>
              {/* Front Face */}
              <div className="card-face card-face-front">
                <div className="card-top-bar">
                  <span className="card-badge">
                    {currentCard?.category || 'General'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {currentCard?.difficulty && (
                      <span className={`card-badge difficulty-${currentCard.difficulty}`}>
                        {currentCard.difficulty}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleSpeak}
                      className="btn-secondary"
                      style={{ padding: '0.3rem', borderRadius: '50%' }}
                      title="Listen to question"
                    >
                      <Volume2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="card-main-content">
                  <div className="card-prompt-label">Question / Concept</div>
                  <h3 className="card-question-text">{currentCard?.question}</h3>
                </div>

                <div className="card-bottom-bar">
                  <span>
                    Card {activeIndex + 1} of {visibleCards.length}
                  </span>
                  <div className="flip-hint">
                    <RotateCw size={14} />
                    <span>Click or Space to flip</span>
                  </div>
                </div>
              </div>

              {/* Back Face */}
              <div className="card-face card-face-back">
                <div className="card-top-bar">
                  <span className="card-badge" style={{ color: 'var(--accent-secondary)' }}>
                    Solution & Explanation
                  </span>
                  <button
                    type="button"
                    onClick={handleSpeak}
                    className="btn-secondary"
                    style={{ padding: '0.3rem', borderRadius: '50%' }}
                    title="Listen to answer"
                  >
                    <Volume2 size={15} />
                  </button>
                </div>

                <div className="card-main-content">
                  <div className="card-prompt-label">Answer</div>
                  <p className="card-answer-text">{currentCard?.answer}</p>

                  {currentCard?.hint && (
                    <div className="card-hint-box">
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          color: 'var(--accent-warning)',
                          marginBottom: '0.2rem',
                        }}
                      >
                        <HelpCircle size={13} /> Memory Hook / Hint
                      </div>
                      {currentCard.hint}
                    </div>
                  )}
                </div>

                <div className="card-bottom-bar">
                  <span>
                    Card {activeIndex + 1} of {visibleCards.length}
                  </span>
                  <div className="flip-hint">
                    <RotateCw size={14} />
                    <span>Click or Space to flip</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation & Mastery Controls */}
          <div className="card-nav-bar">
            <button
              id="prev-card-btn"
              type="button"
              className="nav-btn"
              onClick={handlePrev}
              title="Previous card (Left Arrow)"
              aria-label="Previous card"
            >
              <ChevronLeft size={22} />
            </button>

            <button
              id="toggle-mastery-btn"
              type="button"
              className={`mastery-toggle-btn ${isCurrentMastered ? 'is-mastered' : ''}`}
              onClick={() => currentCard && onToggleMastery(currentCard.id)}
            >
              <CheckCircle2 size={17} />
              <span>{isCurrentMastered ? 'Mastered' : 'Mark as Mastered'}</span>
            </button>

            <button
              id="next-card-btn"
              type="button"
              className="nav-btn"
              onClick={handleNext}
              title="Next card (Right Arrow)"
              aria-label="Next card"
            >
              <ChevronRight size={22} />
            </button>
          </div>

          {/* Keyboard Navigation Shortcuts Bar */}
          <div className="keyboard-hints">
            <span>
              <kbd className="kbd-badge">Space</kbd> Flip Card
            </span>
            <span>
              <kbd className="kbd-badge">←</kbd> / <kbd className="kbd-badge">→</kbd> Navigate
            </span>
            <span>
              <kbd className="kbd-badge">M</kbd> Toggle Mastery
            </span>
          </div>
        </>
      )}
    </div>
  );
};
