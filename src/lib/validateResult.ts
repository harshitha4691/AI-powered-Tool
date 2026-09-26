import type { Flashcard, QuizQuestion, StudyDeckResult } from '../types/result';

export type ValidationOutcome =
  | {
      success: true;
      data: StudyDeckResult;
    }
  | {
      success: false;
      code: 'EMPTY_RESPONSE' | 'MALFORMED_JSON' | 'INVALID_SHAPE';
      message: string;
      rawSnippet?: string;
      details?: string;
    };

/**
 * Defensive parser and shape validator for LLM output.
 * Ensures unpredictably formed AI text is strictly verified before reaching React state.
 */
export function validateStudyDeckResult(raw: unknown): ValidationOutcome {
  // 1. Check for empty or falsy raw input
  if (raw === null || raw === undefined) {
    return {
      success: false,
      code: 'EMPTY_RESPONSE',
      message: 'Received empty response from the AI model.',
    };
  }

  let parsed: unknown = raw;

  // 2. Parse if raw is a string
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) {
      return {
        success: false,
        code: 'EMPTY_RESPONSE',
        message: 'The model returned an empty text payload.',
      };
    }

    // Strip markdown code fences if model enclosed JSON in ```json ... ```
    let cleanJson = trimmed;
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    }

    try {
      parsed = JSON.parse(cleanJson);
    } catch (err: unknown) {
      const syntaxError = err instanceof Error ? err.message : 'Unknown JSON syntax error';
      return {
        success: false,
        code: 'MALFORMED_JSON',
        message: 'The model returned malformed JSON that could not be parsed.',
        details: syntaxError,
        rawSnippet: trimmed.slice(0, 300) + (trimmed.length > 300 ? '...' : ''),
      };
    }
  }

  // 3. Structural validation (Check object)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      success: false,
      code: 'INVALID_SHAPE',
      message: 'Output root must be a JSON object containing "cards" and "quiz" properties.',
      details: `Received type "${Array.isArray(parsed) ? 'array' : typeof parsed}" instead of object.`,
    };
  }

  const obj = parsed as Record<string, unknown>;

  // 4. Validate 'cards' array
  if (!Array.isArray(obj.cards)) {
    return {
      success: false,
      code: 'INVALID_SHAPE',
      message: 'The response is missing the required "cards" array.',
      details: `Field "cards" is ${typeof obj.cards}.`,
    };
  }

  if (obj.cards.length === 0) {
    return {
      success: false,
      code: 'EMPTY_RESPONSE',
      message: 'The model returned a "cards" array with 0 items.',
    };
  }

  // Validate each card element
  const validatedCards: Flashcard[] = [];
  for (let i = 0; i < obj.cards.length; i++) {
    const card = obj.cards[i];
    if (!card || typeof card !== 'object') {
      return {
        success: false,
        code: 'INVALID_SHAPE',
        message: `Card at index ${i} is not a valid object.`,
      };
    }

    const cardObj = card as Record<string, unknown>;
    if (typeof cardObj.question !== 'string' || !cardObj.question.trim()) {
      return {
        success: false,
        code: 'INVALID_SHAPE',
        message: `Card #${i + 1} is missing a valid "question" string.`,
      };
    }

    if (typeof cardObj.answer !== 'string' || !cardObj.answer.trim()) {
      return {
        success: false,
        code: 'INVALID_SHAPE',
        message: `Card #${i + 1} ("${cardObj.question.slice(0, 30)}...") is missing an "answer" string.`,
      };
    }

    const difficultyVal = cardObj.difficulty;
    const difficulty: 'easy' | 'medium' | 'hard' =
      difficultyVal === 'easy' || difficultyVal === 'hard' ? difficultyVal : 'medium';

    validatedCards.push({
      id: typeof cardObj.id === 'string' && cardObj.id ? cardObj.id : `card-${i + 1}-${Date.now()}`,
      question: cardObj.question.trim(),
      answer: cardObj.answer.trim(),
      category: typeof cardObj.category === 'string' ? cardObj.category.trim() : 'General',
      hint: typeof cardObj.hint === 'string' ? cardObj.hint.trim() : undefined,
      difficulty,
    });
  }

  // 5. Validate 'quiz' array
  const validatedQuiz: QuizQuestion[] = [];
  if (Array.isArray(obj.quiz)) {
    for (let i = 0; i < obj.quiz.length; i++) {
      const q = obj.quiz[i];
      if (!q || typeof q !== 'object') continue;
      const qObj = q as Record<string, unknown>;

      if (typeof qObj.question !== 'string' || !qObj.question.trim()) continue;

      if (!Array.isArray(qObj.options) || qObj.options.length < 2) continue;

      const cleanOptions = qObj.options.map((opt) => String(opt).trim()).filter(Boolean);
      if (cleanOptions.length < 2) continue;

      let correctIndex = typeof qObj.correctOptionIndex === 'number' ? Math.floor(qObj.correctOptionIndex) : 0;
      if (correctIndex < 0 || correctIndex >= cleanOptions.length) {
        correctIndex = 0;
      }

      validatedQuiz.push({
        id: typeof qObj.id === 'string' && qObj.id ? qObj.id : `q-${i + 1}-${Date.now()}`,
        question: qObj.question.trim(),
        options: cleanOptions,
        correctOptionIndex: correctIndex,
        explanation: typeof qObj.explanation === 'string' ? qObj.explanation.trim() : 'Correct answer highlighted above.',
      });
    }
  }

  const deckTitle =
    typeof obj.deckTitle === 'string' && obj.deckTitle.trim()
      ? obj.deckTitle.trim()
      : 'Interactive Study Deck';

  const summary =
    typeof obj.summary === 'string' && obj.summary.trim()
      ? obj.summary.trim()
      : `Generated ${validatedCards.length} flashcards and ${validatedQuiz.length} quiz questions.`;

  const estimatedStudyTimeMinutes =
    typeof obj.estimatedStudyTimeMinutes === 'number' && obj.estimatedStudyTimeMinutes > 0
      ? Math.round(obj.estimatedStudyTimeMinutes)
      : Math.max(3, Math.round(validatedCards.length * 1.5));

  const tags = Array.isArray(obj.tags)
    ? obj.tags.map((t) => String(t).trim()).filter(Boolean)
    : ['Study Set', 'AI Generated'];

  return {
    success: true,
    data: {
      deckTitle,
      summary,
      estimatedStudyTimeMinutes,
      tags,
      cards: validatedCards,
      quiz: validatedQuiz,
    },
  };
}
