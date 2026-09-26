export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  category?: string;
  hint?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export interface StudyDeckResult {
  deckTitle: string;
  summary: string;
  estimatedStudyTimeMinutes?: number;
  tags?: string[];
  cards: Flashcard[];
  quiz: QuizQuestion[];
}

export interface GenerationRequest {
  prompt: string;
  refinementInstruction?: string;
  currentDeck?: StudyDeckResult;
  simulateError?: 'malformed' | 'wrong-shape' | 'empty' | 'timeout' | 'server-error';
}

export interface ApiSuccessResponse {
  success: true;
  data: StudyDeckResult;
  metadata?: {
    provider: 'gemini' | 'mock-ai';
    model: string;
    generationTimeMs: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code:
      | 'MALFORMED_JSON'
      | 'INVALID_SHAPE'
      | 'EMPTY_RESPONSE'
      | 'SERVER_ERROR'
      | 'TIMEOUT'
      | 'RATE_LIMIT'
      | 'NETWORK_ERROR'
      | 'STALE_REQUEST'
      | 'UNKNOWN';
    message: string;
    rawSnippet?: string;
    details?: string;
  };
}

export type ApiResponse = ApiSuccessResponse | ApiErrorResponse;

export interface SavedDeck {
  id: string;
  createdAt: string;
  deck: StudyDeckResult;
  originalPrompt: string;
  cardMastery: Record<string, boolean>; // card id -> mastered
  quizHighScore?: {
    score: number;
    total: number;
    completedAt: string;
  };
}
