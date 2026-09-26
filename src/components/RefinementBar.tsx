import React, { useState } from 'react';
import { Sliders, Send, Sparkles } from 'lucide-react';

interface RefinementBarProps {
  onRefine: (instruction: string) => void;
  isLoading: boolean;
}

const QUICK_REFINEMENTS = [
  'Add 3 more advanced interview questions',
  'Add mnemonic memory hooks to all cards',
  'Focus on common failure modes & edge cases',
  'Simplify explanations for beginners',
];

export const RefinementBar: React.FC<RefinementBarProps> = ({ onRefine, isLoading }) => {
  const [instruction, setInstruction] = useState('');

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!instruction.trim() || isLoading) return;
    onRefine(instruction);
    setInstruction('');
  };

  return (
    <div className="refinement-card glass-panel" aria-label="Deck Refinement">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Sliders size={16} color="var(--accent-primary)" />
        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff' }}>
          Refine & Expand This Deck
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          (Iterative AI refinement without losing your deck)
        </span>
      </div>

      <form onSubmit={handleSubmit} className="refinement-input-row">
        <input
          id="refine-deck-input"
          type="text"
          className="refinement-input"
          placeholder="e.g. 'Add 2 harder scenario questions' or 'Include mnemonics for Coffman conditions'..."
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          disabled={isLoading}
        />
        <button
          id="refine-submit-btn"
          type="submit"
          className="action-btn-primary"
          style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}
          disabled={isLoading || !instruction.trim()}
        >
          <Sparkles size={15} />
          <span>{isLoading ? 'Refining...' : 'Refine Deck'}</span>
          <Send size={13} />
        </button>
      </form>

      <div className="refinement-chips">
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Suggested refinements:</span>
        {QUICK_REFINEMENTS.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            className="refinement-chip"
            onClick={() => onRefine(chip)}
            disabled={isLoading}
          >
            + {chip}
          </button>
        ))}
      </div>
    </div>
  );
};
