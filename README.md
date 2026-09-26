# AI-Powered Study Assistant — Flam Frontend Assignment

An intelligent study assistant that transforms free-form study notes, lecture transcripts, or textbook topics into interactive active-recall flashcards and multiple-choice quizzes with wrong-answer re-testing and defense-in-depth LLM output validation.

---

## 📁 Project Structure

This project follows the strict separation of concerns requested in the assignment:

```text
flam-frontend-assignment/
├── src/
│   ├── components/
│   │   ├── PromptInput.tsx        # Free-form notes/topic input with preset samples & shortcuts
│   │   ├── ResultView.tsx         # Routes parsed data to Flashcards or Quiz modes
│   │   ├── FlashcardDeck.tsx      # Interactive 3D flip cards, mastery tracker, keyboard navigation
│   │   ├── QuizMode.tsx           # MCQ quiz with instant feedback, scoring & "Re-test Wrong Answers"
│   │   ├── ErrorState.tsx         # Shared defensive error UI with technical diagnostic inspector
│   │   ├── LoadingState.tsx       # Multi-stage animated loading progress indicator
│   │   ├── RefinementBar.tsx      # Iterative prompt refinement without losing current deck state
│   │   ├── DeckHistory.tsx        # Saved session manager with JSON & Markdown export
│   │   └── FailureSimulator.tsx   # Interactive evaluation toolbar for testing edge cases
│   ├── lib/
│   │   ├── api.ts                 # Backend proxy client with 25s timeout & AbortController guard
│   │   └── validateResult.ts      # Strict client & server-side schema & type validator
│   ├── types/
│   │   └── result.ts              # Strongly-typed schemas for cards, quiz, requests & errors
│   ├── styles/
│   │   └── index.css              # Custom responsive dark-mode design system with glassmorphism
│   ├── App.tsx                    # Root orchestrator with useRef stale response race-condition guard
│   └── main.tsx                   # React 19 entry point
├── server/
│   ├── generate.ts                # Gemini API integration + intelligent offline mock fallback
│   └── index.ts                   # Express proxy retaining API keys on the backend (port 3001)
├── .env.example                   # Environment configuration template
├── package.json                   # Dependencies, scripts & dev tools
└── README.md
```

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
- **With Gemini API Key**: Paste your Google Gemini API key into `GEMINI_API_KEY` in `.env`.
- **Zero-Config Demo Mode**: If `GEMINI_API_KEY` is left blank, the application automatically runs using the built-in **Intelligent Mock AI Engine**, allowing reviewers to test all features instantly without requiring an API key or incurring rate limits.

### 3. Start Development Server
```bash
npm run dev
```
This runs both the Express backend (`http://localhost:3001`) and Vite frontend (`http://localhost:5173`) concurrently.

---

## 🧠 Core Features & User Workflows

### 1. Free-form Input (`PromptInput.tsx`)
- Paste raw lecture notes, bullet points, or high-level topics.
- One-click sample topics (`OS Concurrency`, `Cellular Respiration`, `System Design Caching`).
- Keyboard shortcut: **`Ctrl + Enter`** (or `Cmd + Enter`) to synthesize.

### 2. Active Recall Flashcards (`FlashcardDeck.tsx`)
- **3D Card Flip**: Realistic flip animation with front (question/category/hint) and back (answer).
- **Audio Pronunciation**: Text-to-speech voice playback for auditory learners.
- **Mastery Tracking**: Mark cards as *Mastered* vs *Needs Practice* (toggled with `M` key).
- **Filter & Shuffle**: Filter by all, mastered, or needs-practice, and randomize study order.
- **Keyboard Shortcuts**: `Space` to flip, `←` / `→` arrows to navigate.

### 3. Interactive Quiz & Re-Testing (`QuizMode.tsx`)
- Scenario-based multiple-choice questions with 4 distinct options.
- Instant feedback with clear explanations for why the correct answer is right.
- Keyboard navigation: press `1`, `2`, `3`, `4` to pick an option, and `Enter` to advance.
- **Re-test Wrong Answers**: When finished, users can click **"Re-test Wrong Answers"** to re-attempt only the questions they missed.
- Confetti celebration upon achieving a 100% score.

### 4. Iterative Refinement (`RefinementBar.tsx`)
- Ask follow-up instructions (e.g. *"Add 3 harder questions"* or *"Include mnemonic memory hooks"*) without losing the current study deck.

### 5. Local Persistence & Export (`DeckHistory.tsx`)
- Automatically saves generated study sets and mastery status to browser `localStorage`.
- Export decks as structured **JSON** or printable **Markdown Study Guides**.

---

## 🛡️ Robustness & Engineering Highlights

| Requirement | Implementation Detail |
| :--- | :--- |
| **API Key Security** | Browser never touches the Gemini API key. All requests pass through an Express proxy backend (`server/index.ts` & `server/generate.ts`). |
| **Defensive Validation** | `validateResult.ts` rigorously validates JSON shape, array boundaries, and property types on both backend and frontend before committing data to React state. |
| **Stale Response Guard** | Guaranteed race-condition protection using `useRef(requestId)`. If a user fires a second request while the first is in-flight, slower responses are discarded. |
| **Request Timeout Guard** | Integrated `AbortController` automatically terminates requests taking longer than 25 seconds, preventing indefinite UI loading states. |
| **Interviewer Test Suite** | Dedicated **Failure Mode Evaluation Toolbar** in the UI allows instant testing of: malformed JSON, wrong schemas, empty payloads, 25s timeouts, 500 outages, and async race conditions. |

---

## 🛠️ Verification & Scripts

- `npm run dev`: Starts Express proxy (port 3001) and Vite dev server (port 5173).
- `npm run build`: Type-checks with `tsc -b` and builds production bundle with Vite.
- `npm run lint`: Fast linting with `oxlint`.
