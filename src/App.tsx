import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, BrainCircuit, Cpu, ExternalLink } from 'lucide-react';
import { PromptInput } from './components/PromptInput';
import { ResultView } from './components/ResultView';
import { LoadingState } from './components/LoadingState';
import { ErrorState } from './components/ErrorState';
import { DeckHistory } from './components/DeckHistory';
import { FailureSimulator } from './components/FailureSimulator';
import { callBackendApi, checkServerHealth } from './lib/api';
import type {
  StudyDeckResult,
  ApiErrorResponse,
  SavedDeck,
  GenerationRequest,
  Flashcard,
  QuizQuestion,
} from './types/result';

const LOCAL_STORAGE_KEY = 'flam_study_assistant_decks_v1';

export const App: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [error, setError] = useState<ApiErrorResponse['error'] | null>(null);
  const [currentDeck, setCurrentDeck] = useState<StudyDeckResult | null>(null);
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [cardMastery, setCardMastery] = useState<Record<string, boolean>>({});
  const [savedDecks, setSavedDecks] = useState<SavedDeck[]>([]);
  const [serverHealth, setServerHealth] = useState<{
    hasApiKey: boolean;
    provider: string;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // CRITICAL REQUIREMENT: Guarding against stale responses
  // Stored in a ref so concurrent or subsequent requests increment the ID.
  // Responses with an ID matching an older request are discarded immediately.
  const requestId = useRef<number>(0);
  const activeAbortController = useRef<AbortController | null>(null);

  // Load saved decks from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SavedDeck[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedDecks(parsed);
          // Load most recent deck
          const latest = parsed[0];
          setCurrentDeck(latest.deck);
          setActiveDeckId(latest.id);
          setCardMastery(latest.cardMastery || {});
        }
      }
    } catch (err) {
      console.error('Failed to load saved decks from localStorage:', err);
    }

    // Check server status
    checkServerHealth().then((health) => {
      if (health) {
        setServerHealth({
          hasApiKey: health.hasApiKey,
          provider: health.provider,
        });
      }
    });
  }, []);

  // Save to localStorage whenever savedDecks updates
  const persistDecks = (decks: SavedDeck[]) => {
    setSavedDecks(decks);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(decks));
    } catch (err) {
      console.warn('Could not persist decks to localStorage:', err);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  /**
   * Core generation orchestrator with race-condition guard
   */
  const handleGenerate = useCallback(
    async (
      overridePrompt?: string,
      simulateError?: GenerationRequest['simulateError']
    ) => {
      const targetPrompt = (overridePrompt ?? prompt).trim();
      if (!targetPrompt && !simulateError) return;

      // Abort any ongoing client request
      if (activeAbortController.current) {
        activeAbortController.current.abort();
      }
      activeAbortController.current = new AbortController();

      // Increment request counter for stale response guard
      const currentRequestId = ++requestId.current;

      setIsLoading(true);
      setError(null);

      const response = await callBackendApi(
        {
          prompt: targetPrompt || 'Default Study Topic',
          simulateError,
        },
        {
          signal: activeAbortController.current.signal,
        }
      );

      // STALE RESPONSE GUARD:
      // If a newer request has begun while this one was in-flight, discard this result!
      if (currentRequestId !== requestId.current) {
        console.warn(
          `[Stale Response Guard] Discarded response #${currentRequestId} because request #${requestId.current} is now active.`
        );
        return;
      }

      setIsLoading(false);

      if (!response.success) {
        // Discard any previous deck and show the dedicated error state
        setCurrentDeck(null);
        setError(response.error);
        return;
      }

      // Success: commit to React state
      const newDeck = response.data;
      const newDeckId = `deck-${Date.now()}`;
      const newSavedItem: SavedDeck = {
        id: newDeckId,
        createdAt: new Date().toISOString(),
        deck: newDeck,
        originalPrompt: targetPrompt,
        cardMastery: {},
      };

      setCurrentDeck(newDeck);
      setActiveDeckId(newDeckId);
      setCardMastery({});

      // Prepend to saved decks
      const updated = [newSavedItem, ...savedDecks.filter((d: SavedDeck) => d.deck.deckTitle !== newDeck.deckTitle)];
      persistDecks(updated.slice(0, 15)); // Keep last 15 decks
    },
    [prompt, savedDecks]
  );

  /**
   * Refinement loop: edits existing deck with follow-up instructions
   */
  const handleRefine = async (instruction: string) => {
    if (!currentDeck || !instruction.trim()) return;

    const currentRequestId = ++requestId.current;
    setIsRefining(true);

    const response = await callBackendApi({
      prompt: currentDeck.deckTitle,
      refinementInstruction: instruction,
      currentDeck,
    });

    if (currentRequestId !== requestId.current) return;
    setIsRefining(false);

    if (!response.success) {
      showToast(`Refinement failed: ${response.error.message}`);
      return;
    }

    const updatedDeck = response.data;
    setCurrentDeck(updatedDeck);

    // Update in saved decks
    if (activeDeckId) {
      const updated = savedDecks.map((item: SavedDeck) =>
        item.id === activeDeckId ? { ...item, deck: updatedDeck } : item
      );
      persistDecks(updated);
    }

    showToast('✨ Deck successfully updated with your refinement!');
  };

  /**
   * Toggle mastery status of a card
   */
  const handleToggleMastery = (cardId: string) => {
    setCardMastery((prev: Record<string, boolean>) => {
      const updated = { ...prev, [cardId]: !prev[cardId] };
      if (activeDeckId) {
        const updatedDecks = savedDecks.map((item: SavedDeck) =>
          item.id === activeDeckId ? { ...item, cardMastery: updated } : item
        );
        persistDecks(updatedDecks);
      }
      return updated;
    });
  };

  /**
   * Save quiz high score
   */
  const handleQuizComplete = (score: number, total: number) => {
    if (activeDeckId) {
      const updatedDecks = savedDecks.map((item: SavedDeck) =>
        item.id === activeDeckId
          ? {
            ...item,
            quizHighScore: {
              score,
              total,
              completedAt: new Date().toISOString(),
            },
          }
          : item
      );
      persistDecks(updatedDecks);
    }
  };

  /**
   * Switch active deck from history
   */
  const handleSelectDeck = (saved: SavedDeck) => {
    setCurrentDeck(saved.deck);
    setActiveDeckId(saved.id);
    setCardMastery(saved.cardMastery || {});
    setError(null);
  };

  /**
   * Delete deck from history
   */
  const handleDeleteDeck = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedDecks.filter((d: SavedDeck) => d.id !== id);
    persistDecks(updated);
    if (activeDeckId === id) {
      if (updated.length > 0) {
        handleSelectDeck(updated[0]);
      } else {
        setCurrentDeck(null);
        setActiveDeckId(null);
        setCardMastery({});
      }
    }
  };

  /**
   * Demonstration of Stale Response Guard:
   * Fires a slow request (simulating latency), followed 200ms later by a fast request.
   * Proves that the slow request does NOT overwrite the fast request.
   */
  const handleTestRaceCondition = async () => {
    showToast('🧪 Dispatched Slow Request #1 followed by Fast Request #2...');
    // Slow request
    handleGenerate('Prompt 1: Slow query taking 4s', 'timeout');
    // Fast request dispatched quickly after
    setTimeout(() => {
      handleGenerate('Prompt 2: Fast query finishing in 1s');
      showToast('⚡ Request #2 finished! Request #1 will be silently dropped by stale guard.');
    }, 400);
  };

  /**
   * Export active deck as raw JSON
   */
  const handleExportJson = () => {
    if (!currentDeck) return;
    const blob = new Blob([JSON.stringify(currentDeck, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentDeck.deckTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_deck.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Export active deck as Markdown study guide
   */
  const handleExportMarkdown = () => {
    if (!currentDeck) return;
    let md = `# ${currentDeck.deckTitle}\n\n`;
    md += `> ${currentDeck.summary}\n\n`;
    md += `## Flashcards (${currentDeck.cards.length})\n\n`;
    currentDeck.cards.forEach((c: Flashcard, idx: number) => {
      md += `### ${idx + 1}. ${c.question}\n`;
      md += `**Answer:** ${c.answer}\n`;
      if (c.hint) md += `*Hint:* ${c.hint}\n`;
      md += `\n---\n\n`;
    });
    md += `## Quiz Questions (${currentDeck.quiz.length})\n\n`;
    currentDeck.quiz.forEach((q: QuizQuestion, idx: number) => {
      md += `### Q${idx + 1}: ${q.question}\n`;
      q.options.forEach((opt: string, optIdx: number) => {
        md += `- [${optIdx === q.correctOptionIndex ? 'x' : ' '}] ${opt}\n`;
      });
      md += `\n*Explanation:* ${q.explanation}\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentDeck.deckTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_guide.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'var(--bg-tertiary)',
            color: '#ffffff',
            border: '1px solid var(--accent-primary)',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 9999,
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <Sparkles size={16} color="var(--accent-primary)" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="app-header">
        <div>
          <div className="brand-badge">Flam Frontend Internship Assignment</div>
          <h1 className="brand-title">
            <BrainCircuit size={28} color="var(--accent-primary)" />
            <span>ActiveRecall AI</span>
          </h1>
          <p className="brand-subtitle">
            Turn unpredictable notes into structured 3D flashcards and interactive quizzes.
          </p>
        </div>

        <div className="header-actions">
          {serverHealth && (
            <div className="status-badge" title="Backend Proxy Status">
              <span className={`status-dot ${serverHealth.hasApiKey ? '' : 'mock'}`} />
              <Cpu size={14} />
              <span>
                {serverHealth.hasApiKey
                  ? 'Gemini 1.5 Flash (Live)'
                  : 'Demo Engine (Add GEMINI_API_KEY to .env)'}
              </span>
            </div>
          )}

          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
            style={{ fontSize: '0.78rem' }}
          >
            <span>Get Gemini Key</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </header>

      {/* Free-form Text Input */}
      <PromptInput
        input={prompt}
        setInput={setPrompt}
        onSubmit={(override) => handleGenerate(override)}
        isLoading={isLoading}
      />

      {/* Evaluator Failure Mode Testing Toolbar */}
      <FailureSimulator
        onTriggerSimulation={(errorType) => handleGenerate(prompt, errorType)}
        onTriggerRaceCondition={handleTestRaceCondition}
        isLoading={isLoading}
      />

      {/* Conditional State Rendering */}
      <main id="main-content">
        {isLoading && (
          <LoadingState
            onCancel={() => {
              if (activeAbortController.current) {
                activeAbortController.current.abort('USER_CANCEL');
              }
              setIsLoading(false);
            }}
          />
        )}

        {!isLoading && error && (
          <ErrorState
            error={error}
            onRetry={() => handleGenerate()}
            onReset={() => setError(null)}
          />
        )}

        {!isLoading && !error && currentDeck && (
          <ResultView
            data={currentDeck}
            cardMastery={cardMastery}
            onToggleMastery={handleToggleMastery}
            onRefine={handleRefine}
            isRefining={isRefining}
            onQuizComplete={handleQuizComplete}
          />
        )}

        {/* Empty state when app first loads and no deck is chosen */}
        {!isLoading && !error && !currentDeck && (
          <div
            className="glass-panel"
            style={{
              padding: '3rem 2rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <Sparkles size={40} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Ready to Study Smarter?</h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '520px', fontSize: '0.92rem' }}>
              Paste your messy lecture notes, a syllabus topic, or click any of the sample buttons
              above. The AI will extract core concepts, generate 3D flip flashcards, and build an
              interactive quiz with mistake re-testing.
            </p>
          </div>
        )}
      </main>

      {/* Saved Sessions & Deck History */}
      <DeckHistory
        savedDecks={savedDecks}
        activeDeckId={activeDeckId || undefined}
        onSelectDeck={handleSelectDeck}
        onDeleteDeck={handleDeleteDeck}
        onExportJson={handleExportJson}
        onExportMarkdown={handleExportMarkdown}
      />
    </div>
  );
};

export default App;
