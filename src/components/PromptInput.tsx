import React from 'react';
import { Sparkles, BookOpen, Send, Eraser } from 'lucide-react';

interface PromptInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (promptText?: string) => void;
  isLoading: boolean;
}

const PRESET_SAMPLES = [
  {
    title: 'OS Concurrency',
    text: 'Operating Systems: Mutex locks, binary and counting semaphores, race conditions, critical section problem, and the four Coffman conditions for deadlocks (mutual exclusion, hold & wait, no preemption, circular wait). Include deadlock prevention strategies.',
  },
  {
    title: 'Cellular Respiration',
    text: 'Cellular Respiration: Glycolysis in cytoplasm, Krebs citric acid cycle in mitochondrial matrix, oxidative phosphorylation and electron transport chain on the inner mitochondrial membrane, ATP yield, NADH and FADH2 electron carriers.',
  },
  {
    title: 'System Design Caching',
    text: 'Distributed Caching Strategies: Cache-Aside vs Write-Through vs Write-Behind, eviction policies (LRU, LFU, FIFO), handling cache stampede/thundering herd, and cache penetration vs cache breakdown with Bloom filters.',
  },
];

export const PromptInput: React.FC<PromptInputProps> = ({
  input,
  setInput,
  onSubmit,
  isLoading,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        onSubmit();
      }
    }
  };

  const loadSample = (sampleText: string) => {
    setInput(sampleText);
  };

  return (
    <section className="input-section glass-panel" aria-label="Study Notes Input">
      <div className="input-header">
        <label htmlFor="study-notes-input" className="input-label">
          <BookOpen size={18} className="text-indigo-400" />
          <span>Paste Study Notes, Syllabus, or Topic</span>
        </label>

        <div className="sample-prompts-bar">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Try a sample:</span>
          {PRESET_SAMPLES.map((sample, idx) => (
            <button
              key={idx}
              id={`sample-prompt-btn-${idx}`}
              type="button"
              className="sample-btn"
              onClick={() => loadSample(sample.text)}
              disabled={isLoading}
              title={`Load sample notes: ${sample.title}`}
            >
              {sample.title}
            </button>
          ))}
        </div>
      </div>

      <div className="textarea-container">
        <textarea
          id="study-notes-input"
          className="freeform-textarea"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Paste lecture notes, raw bullet points, textbook excerpts, or any topic here... (e.g. 'Photosynthesis stages', 'JavaScript Event Loop & Microtasks', 'React 19 Server Components')"
          disabled={isLoading}
          rows={4}
        />
      </div>

      <div className="input-footer">
        <div className="input-meta-text">
          <span>{input.trim().length} characters</span>
          {input.trim().length > 0 && (
            <>
              <span>•</span>
              <button
                type="button"
                onClick={() => setInput('')}
                disabled={isLoading}
                style={{
                  color: 'var(--text-muted)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.78rem',
                }}
                title="Clear input"
              >
                <Eraser size={13} /> Clear
              </button>
            </>
          )}
          <span>•</span>
          <span style={{ opacity: 0.8 }}>Press Ctrl + Enter to generate</span>
        </div>

        <button
          id="generate-deck-btn"
          type="button"
          className="action-btn-primary"
          onClick={() => onSubmit()}
          disabled={isLoading || !input.trim()}
        >
          <Sparkles size={17} />
          <span>{isLoading ? 'Synthesizing...' : 'Generate Study Deck'}</span>
          <Send size={15} style={{ opacity: 0.8 }} />
        </button>
      </div>
    </section>
  );
};
