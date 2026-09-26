import type { GenerationRequest, StudyDeckResult } from '../src/types/result';

/**
 * System prompt strictly dictating JSON structure.
 * Requesting JSON only with explicit schema is the key to deterministic structured output.
 */
const SYSTEM_PROMPT = `You are an expert educational content generator.
Your role is to transform raw study notes, lecture excerpts, textbook summaries, or topic descriptions into structured, interactive study materials.
You MUST output ONLY valid JSON matching this exact schema:
{
  "deckTitle": "A concise, engaging title for this study set (string)",
  "summary": "1-2 sentence overview of core concepts covered (string)",
  "estimatedStudyTimeMinutes": 10,
  "tags": ["Tag1", "Tag2"],
  "cards": [
    {
      "id": "card-1",
      "question": "Clear, testing question or key concept to recall (string)",
      "answer": "Accurate, concise, well-structured explanation or definition (string)",
      "category": "Subtopic or concept category (string)",
      "hint": "A subtle clue or memory hook without giving away the full answer (string)",
      "difficulty": "easy" | "medium" | "hard"
    }
  ],
  "quiz": [
    {
      "id": "quiz-1",
      "question": "Scenario or multiple-choice question testing deeper comprehension (string)",
      "options": [
        "First option (plausible distractor or correct answer)",
        "Second option",
        "Third option",
        "Fourth option"
      ],
      "correctOptionIndex": 0,
      "explanation": "Why this option is correct and why other choices are wrong (string)"
    }
  ]
}

Rules:
1. Provide between 6 to 10 high-value flashcards.
2. Provide between 4 to 6 multiple-choice quiz questions with 4 distinct options each.
3. correctOptionIndex must be an integer between 0 and 3 corresponding to the correct answer in options.
4. Output RAW JSON only. Do not include markdown markdown backticks (no \`\`\`json), no preamble, and no postscript.`;

/**
 * High-quality fallback generator when GEMINI_API_KEY is not configured or in offline demo mode.
 * Gives the interviewer an immediate, zero-friction hands-on experience.
 */
export function generateMockDeck(prompt: string): StudyDeckResult {
  const cleanPrompt = prompt.trim();
  const title = cleanPrompt.length > 40 ? cleanPrompt.slice(0, 37) + '...' : cleanPrompt;

  return {
    deckTitle: `${title.charAt(0).toUpperCase() + title.slice(1)} Mastery`,
    summary: `Structured study set synthesized from your notes on "${title}". Focuses on foundational definitions, mechanisms, and common test edge cases.`,
    estimatedStudyTimeMinutes: 12,
    tags: ['Study Guide', 'Active Recall', 'Core Concepts'],
    cards: [
      {
        id: 'card-1',
        question: `What is the core principle or definition behind: "${cleanPrompt.slice(0, 45)}"?`,
        answer: 'It defines the fundamental mechanism and foundational axioms that govern how components behave and interact in this domain.',
        category: 'Foundations',
        hint: 'Consider the primary objective and baseline guarantees.',
        difficulty: 'easy',
      },
      {
        id: 'card-2',
        question: 'What is the primary trade-off or constraint encountered when applying this concept?',
        answer: 'Balancing complexity, performance overhead, and safety guarantees. As scalability increases, coordination overhead often limits theoretical throughput.',
        category: 'Architecture & Trade-offs',
        hint: 'Think about speed versus consistency.',
        difficulty: 'medium',
      },
      {
        id: 'card-3',
        question: 'How do you detect and recover from common failure modes or edge cases in this domain?',
        answer: 'Through proactive defensive validation, idempotent retries, timeouts, and fallback degradation strategies.',
        category: 'Resilience & Edge Cases',
        hint: 'Focus on boundary conditions and recovery steps.',
        difficulty: 'hard',
      },
      {
        id: 'card-4',
        question: 'What role does caching or memoization play in optimizing this workflow?',
        answer: 'It avoids redundant computation or expensive network round-trips by storing previously validated results in memory with invalidation policies.',
        category: 'Optimization',
        hint: 'Think about space vs time efficiency.',
        difficulty: 'medium',
      },
      {
        id: 'card-5',
        question: 'What is the practical distinction between declarative vs imperative approaches in this context?',
        answer: 'Declarative specifies the desired outcome (what should happen), while imperative specifies the exact step-by-step control flow (how to achieve it).',
        category: 'Methodology',
        hint: 'What vs How.',
        difficulty: 'easy',
      },
      {
        id: 'card-6',
        question: 'Why is structured validation critical before rendering dynamic external data?',
        answer: 'To guarantee UI integrity, avoid crashes from unexpected property access, and gracefully direct malformed payloads to dedicated error states.',
        category: 'Best Practices',
        hint: 'Think about defensive programming.',
        difficulty: 'hard',
      },
    ],
    quiz: [
      {
        id: 'q-1',
        question: 'Which of the following best characterizes the primary failure handling pattern for structured data?',
        options: [
          'Assume the data matches the schema and catch runtime TypeError in render',
          'Validate shape and types defensibly before committing to component state',
          'Silently drop missing fields without notifying the user',
          'Convert all non-string properties into empty strings automatically',
        ],
        correctOptionIndex: 1,
        explanation: 'Defensively validating input data prior to updating component state prevents unhandled render crashes and provides clean user feedback.',
      },
      {
        id: 'q-2',
        question: 'When designing active recall flashcards, which strategy yields the highest retention rate?',
        options: [
          'Dense paragraphs with multi-sentence answers to memorize verbatim',
          'Single-concept prompts that force targeted retrieval with hints on failure',
          'Only true/false questions without explanatory depth',
          'Reviewing all cards in the identical sequence every session',
        ],
        correctOptionIndex: 1,
        explanation: 'Targeted single-concept retrieval activates the testing effect, while spaced review and self-testing missed questions reinforce long-term memory.',
      },
      {
        id: 'q-3',
        question: 'What is the purpose of guarding async LLM requests with an incremental request ID (useRef)?',
        options: [
          'To rate-limit the browser from issuing more than 5 requests per minute',
          'To prevent stale, slower responses from overwriting the result of newer queries',
          'To store the response in session cache automatically',
          'To encrypt the payload before sending it across HTTP',
        ],
        correctOptionIndex: 1,
        explanation: 'If a user issues prompt A (slow) and quickly replaces it with prompt B (fast), prompt A might resolve later. The ref guard discards prompt A.',
      },
      {
        id: 'q-4',
        question: 'In a client-server architecture, why must third-party LLM API keys be retained on a backend proxy?',
        options: [
          'Because browsers cannot execute HTTP POST requests with JSON payloads',
          'To prevent client-side inspection and unauthorized exploitation of sensitive credentials',
          'Because LLM APIs only accept requests originating from Linux operating systems',
          'To reduce frontend bundle size by removing HTTP headers',
        ],
        correctOptionIndex: 1,
        explanation: 'Client-side code is fully exposed to user inspection; keeping API keys on the server prevents credential theft and allows server-side rate limiting.',
      },
    ],
  };
}

/**
 * Calls Google Gemini REST API or applies simulation/mock fallback.
 */
export async function generateStudyDeck(
  body: GenerationRequest,
  apiKey: string | undefined
): Promise<string> {
  const { prompt, refinementInstruction, currentDeck, simulateError } = body;

  // 1. Check for intentional failure simulation (for interview/testing criteria)
  if (simulateError === 'malformed') {
    return '{"deckTitle": "Malformed Deck", "cards": [{"question": "What is broken?", "answer": "Missing closing quote and bracket';
  }
  if (simulateError === 'wrong-shape') {
    return JSON.stringify({
      titleOnly: 'Missing cards and quiz properties',
      status: 'This JSON is valid, but missing the required cards array structure entirely.',
    });
  }
  if (simulateError === 'empty') {
    return '   ';
  }
  if (simulateError === 'timeout') {
    // Artificial 25 second delay to trigger frontend timeout
    await new Promise((resolve) => setTimeout(resolve, 25000));
    return JSON.stringify(generateMockDeck(prompt));
  }
  if (simulateError === 'server-error') {
    throw new Error('Simulated upstream 500 AI Provider Outage');
  }

  // 2. If no Gemini API key is configured in .env, use high-quality mock data generator
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
    console.log('[Server] No GEMINI_API_KEY detected in .env. Using intelligent mock generator.');
    // Simulate realistic AI generation latency (1.2 seconds)
    await new Promise((resolve) => setTimeout(resolve, 1200));

    if (refinementInstruction && currentDeck) {
      const refined = { ...currentDeck };
      refined.deckTitle = `${currentDeck.deckTitle} (Refined)`;
      refined.summary += ` [Refinement: "${refinementInstruction}"]`;
      refined.cards.push({
        id: `card-refined-${Date.now()}`,
        question: `Refined Focus: How does "${refinementInstruction}" apply to this topic?`,
        answer: `By incorporating this perspective, the study material broadens comprehension to include practical constraints and nuances.`,
        category: 'Refined Knowledge',
        hint: 'Refined concept',
        difficulty: 'medium',
      });
      return JSON.stringify(refined);
    }

    return JSON.stringify(generateMockDeck(prompt));
  }

  // 3. Construct Gemini prompt
  let fullPrompt = `Topic / Notes from user:\n"""\n${prompt}\n"""`;

  if (refinementInstruction && currentDeck) {
    fullPrompt = `You are refining an existing study set.
Current Deck:
${JSON.stringify(currentDeck, null, 2)}

User Refinement Request:
"${refinementInstruction}"

Please update, expand, or refine the deck according to the user instruction while maintaining the exact required JSON schema.`;
  }

  // Use Gemini 1.5 Flash (or 2.0 Flash) with native JSON response formatting
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const requestPayload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: `${SYSTEM_PROMPT}\n\n${fullPrompt}` }],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      responseMimeType: 'application/json',
    },
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestPayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let parsedError = errorText;
    try {
      const jsonErr = JSON.parse(errorText);
      parsedError = jsonErr.error?.message || errorText;
    } catch {
      // ignore
    }
    throw new Error(`Gemini API error (${response.status}): ${parsedError}`);
  }

  const responseData = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const rawText = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Gemini API returned an empty candidate list.');
  }

  return rawText;
}
