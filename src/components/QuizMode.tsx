import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle,
  XCircle,
  HelpCircle,
  RotateCcw,
  ArrowRight,
  Target,
} from 'lucide-react';
import type { QuizQuestion } from '../types/result';

interface QuizModeProps {
  questions: QuizQuestion[];
  onQuizComplete?: (score: number, total: number) => void;
}

export const QuizMode: React.FC<QuizModeProps> = ({ questions, onQuizComplete }) => {
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>(questions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [wrongQuestionIds, setWrongQuestionIds] = useState<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isRetestMode, setIsRetestMode] = useState(false);

  const resetQuiz = useCallback((qList: QuizQuestion[], retest = false) => {
    setActiveQuestions(qList);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setIsCompleted(false);
    setIsRetestMode(retest);
    if (!retest) {
      setWrongQuestionIds(new Set());
    }
  }, []);

  // Sync questions when prop changes
  useEffect(() => {
    resetQuiz(questions);
  }, [questions, resetQuiz]);

  const currentQ = activeQuestions[currentIndex];

  const handleSelectOption = useCallback((index: number) => {
    if (isAnswerSubmitted || !currentQ) return;
    setSelectedOption(index);
    setIsAnswerSubmitted(true);

    const isCorrect = index === currentQ.correctOptionIndex;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    } else {
      setWrongQuestionIds((prev) => new Set(prev).add(currentQ.id));
    }
  }, [isAnswerSubmitted, currentQ]);

  const handleNextQuestion = useCallback(() => {
    if (currentIndex + 1 < activeQuestions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      // Quiz finished
      setIsCompleted(true);
      const finalScore = score;
      onQuizComplete?.(finalScore, activeQuestions.length);

      if (finalScore === activeQuestions.length) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    }
  }, [currentIndex, activeQuestions.length, score, onQuizComplete]);

  // Re-test wrong answers handler
  const handleRetestWrong = () => {
    const wrongList = questions.filter((q) => wrongQuestionIds.has(q.id));
    if (wrongList.length > 0) {
      resetQuiz(wrongList, true);
    }
  };

  // Keyboard shortcut listener for options (1-4, Enter to proceed)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        isCompleted ||
        !currentQ
      ) {
        return;
      }

      if (!isAnswerSubmitted) {
        if (['1', '2', '3', '4'].includes(e.key)) {
          const optIndex = parseInt(e.key, 10) - 1;
          if (optIndex < currentQ.options.length) {
            handleSelectOption(optIndex);
          }
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleNextQuestion();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isAnswerSubmitted, currentQ, isCompleted, handleSelectOption, handleNextQuestion]);

  if (!questions || questions.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
        No quiz questions generated.
      </div>
    );
  }

  // Quiz Finished / Summary View
  if (isCompleted) {
    const percentage = Math.round((score / activeQuestions.length) * 100);
    const hasWrong = wrongQuestionIds.size > 0 && !isRetestMode;

    return (
      <div className="quiz-summary-card glass-panel" role="region" aria-label="Quiz Results">
        <div className="score-circle">
          <span className="score-number">{percentage}%</span>
          <span className="score-label">
            {score} / {activeQuestions.length} Correct
          </span>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.4rem' }}>
            {percentage === 100
              ? '🎉 Flawless Mastery!'
              : percentage >= 75
              ? '👏 Strong Retention!'
              : '💪 Keep Drilling!'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '440px' }}>
            {percentage === 100
              ? 'You answered every question accurately on the first attempt. Excellent comprehension!'
              : `You missed ${activeQuestions.length - score} question${
                  activeQuestions.length - score === 1 ? '' : 's'
                }. Review the concepts and re-test targeted mistakes below.`}
          </p>
        </div>

        <div className="quiz-results-actions">
          {hasWrong && (
            <button
              id="retest-wrong-answers-btn"
              type="button"
              className="action-btn-primary retest-btn"
              onClick={handleRetestWrong}
            >
              <Target size={17} />
              <span>Re-test {wrongQuestionIds.size} Missed Question{wrongQuestionIds.size === 1 ? '' : 's'}</span>
            </button>
          )}

          <button
            id="retake-full-quiz-btn"
            type="button"
            className="btn-secondary"
            onClick={() => resetQuiz(questions, false)}
          >
            <RotateCcw size={15} />
            <span>Retake Full Quiz</span>
          </button>
        </div>
      </div>
    );
  }

  const optionLetters = ['A', 'B', 'C', 'D', 'E'];
  const progressPercent = ((currentIndex + 1) / activeQuestions.length) * 100;

  return (
    <div className="quiz-container">
      {/* Quiz Progress & Stats Bar */}
      <div className="quiz-header-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <HelpCircle size={18} color="var(--accent-primary)" />
          <span>
            {isRetestMode ? 'Targeted Re-test Mode' : 'Active Recall Quiz'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            Score: <strong style={{ color: 'var(--accent-success)' }}>{score}</strong>
          </span>
          <span style={{ color: 'var(--text-muted)' }}>
            Question {currentIndex + 1} of {activeQuestions.length}
          </span>
        </div>
      </div>

      <div className="quiz-progress-track">
        <div className="quiz-progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      {/* Active Question Card */}
      <div className="quiz-card glass-panel">
        <div className="quiz-question-number">
          Question {currentIndex + 1} • Select the best answer (1-4 on keyboard)
        </div>

        <h3 className="quiz-question-title">{currentQ.question}</h3>

        {/* Options List */}
        <div className="quiz-options-list">
          {currentQ.options.map((option, optIdx) => {
            let stateClass = '';
            if (isAnswerSubmitted) {
              if (optIdx === currentQ.correctOptionIndex) {
                stateClass = 'correct';
              } else if (optIdx === selectedOption) {
                stateClass = 'incorrect';
              }
            } else if (selectedOption === optIdx) {
              stateClass = 'selected';
            }

            return (
              <button
                key={optIdx}
                id={`quiz-opt-${optIdx}`}
                type="button"
                className={`quiz-option-btn ${stateClass}`}
                onClick={() => handleSelectOption(optIdx)}
                disabled={isAnswerSubmitted}
              >
                <span className="option-letter">{optionLetters[optIdx] || optIdx + 1}</span>
                <span style={{ flex: 1 }}>{option}</span>
                {isAnswerSubmitted && optIdx === currentQ.correctOptionIndex && (
                  <CheckCircle size={18} color="var(--accent-success)" />
                )}
                {isAnswerSubmitted &&
                  optIdx === selectedOption &&
                  optIdx !== currentQ.correctOptionIndex && (
                    <XCircle size={18} color="var(--accent-danger)" />
                  )}
              </button>
            );
          })}
        </div>

        {/* Interactive Explanation Box */}
        {isAnswerSubmitted && (
          <div
            className={`quiz-feedback-box ${
              selectedOption === currentQ.correctOptionIndex ? 'correct' : 'incorrect'
            }`}
          >
            <div className="feedback-title">
              {selectedOption === currentQ.correctOptionIndex ? (
                <>
                  <CheckCircle size={17} />
                  <span>Correct!</span>
                </>
              ) : (
                <>
                  <XCircle size={17} />
                  <span>Incorrect</span>
                </>
              )}
            </div>
            <p className="feedback-explanation">{currentQ.explanation}</p>
          </div>
        )}

        {/* Continue to Next Question */}
        {isAnswerSubmitted && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button
              id="quiz-next-btn"
              type="button"
              className="action-btn-primary"
              onClick={handleNextQuestion}
            >
              <span>{currentIndex + 1 < activeQuestions.length ? 'Next Question' : 'View Results'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
