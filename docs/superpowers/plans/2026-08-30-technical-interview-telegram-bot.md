# Technical Interview Telegram Bot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Build a tested, GitHub-ready, Vercel-hostable Telegram MCQ bot with exactly 460 technical data-analyst interview questions.

**Architecture:** A single TypeScript Vercel webhook adapter verifies Telegram's secret header and delegates to pure modules. Five JSON files form one validated immutable bank; every question is selected independently and uniformly with replacement.

**Tech Stack:** Node.js 22+, TypeScript, Vercel Functions, Telegram Bot API, Vitest, JSON

**Spec:** `docs/superpowers/specs/2026-08-30-technical-interview-telegram-bot-design.md`

## Global Constraints

- SQL 100; Python/Pandas/libraries/EDA 180; statistics/hypothesis testing 80; Excel 40; Tableau 60; total 460.
- Uniform independent sampling with replacement across all 460 questions; no filtering or history.
- Four tap-only options; after a tap, send a neutral answer/explanation message and then a separate next-question message.
- No score, judgment, right/wrong indication, colors, persistence, or excluded extras.
- Tokens and webhook secrets exist only in server-side environment variables.
- Do not commit, deploy, register a webhook, or use external credentials without explicit authorization.

---

### Task 1: Foundation and bank contract

Create the Node/TypeScript/Vitest configuration, `.gitignore`, `.env.example`, `src/types.ts`, `src/questions.ts`, empty topic JSON arrays, and `tests/question-bank.test.ts`. Start with the failing contract test, verify RED, implement the loader and configuration, then verify the test fails only on missing bank counts.

The contract exports `Question`, `Topic`, `Difficulty`, `questions: readonly Question[]`, and `questionsById: ReadonlyMap<string, Question>`. Tests require exact topic totals, allowed difficulties, unique IDs and normalized prompts, four non-empty unique choices, integer answer indexes from 0-3, and non-empty explanations.

### Task 2: SQL and Excel banks

Author `data/questions/sql.json` with IDs `sql-001` through `sql-100` and `data/questions/excel.json` with IDs `excel-001` through `excel-040`. Use four plausible options, one unambiguous key, concise explanations, mixed difficulty, no forbidden scope, and no duplicate prompts. Run the bank tests and review every answer/explanation pair.

### Task 3: Python, Pandas, libraries, and EDA bank

Author `data/questions/python-pandas-eda.json` with IDs `python-001` through `python-180`, covering Python fundamentals, NumPy, Pandas, analysis libraries, cleaning, and EDA. Run the bank tests and review for ambiguity, duplication, unsupported version claims, and key/explanation mismatches.

### Task 4: Statistics and Tableau banks

Author `data/questions/statistics.json` with IDs `stats-001` through `stats-080` and `data/questions/tableau.json` with IDs `tableau-001` through `tableau-060`. Cover statistics, probability, sampling, intervals, hypothesis tests, assumptions, power and interpretation; and Tableau connections, fields, filters/order, calculations, LODs, table calculations, data models, visualization and publishing. Run the complete bank tests and review accuracy.

### Task 5: Random selection, callbacks, and message rendering

Test first, then create `src/random.ts`, `src/callbacks.ts`, `src/messages.ts` plus focused tests. Export `chooseQuestion(random?)`, callback encode/parse helpers, `buildQuestionMessage(question)`, and `buildAnswerText(question)`. Tests cover first/last boundaries, immediate repeats, invalid random values, callback secrecy, four buttons, and neutral answer wording.

### Task 6: Telegram client and update workflow

Test first, then create `src/telegram.ts`, `src/update-handler.ts` and focused tests. Export a fetch-based `TelegramClient`, `createTelegramClient(token, fetchImpl?)`, and `handleUpdate(update, client, random?)`. Cover `/start`, ignored text, valid callbacks, malformed/stale callbacks, silent acknowledgement, exact two-message ordering, POST JSON, and sanitized errors.

### Task 7: Secure Vercel webhook

Test first, then create `src/security.ts`, `api/webhook.ts` and focused tests. Use Node `crypto.timingSafeEqual`; cover unauthorized requests, missing environment, malformed JSON, valid delegation, sanitized errors, and unsupported methods.

### Task 8: Documentation and repository checks

Create `README.md`, `LICENSE`, and `vercel.json`. Test required files/scripts, ignored secrets, and absence of Telegram-token patterns. Document BotFather creation, local validation, Vercel environment setup, production deployment, `setWebhook`, verification, rotation and removal using placeholders only. Run all tests and the production TypeScript build.

### Task 9: Final review and verification

Review every source/data/doc file against the spec. Run a clean install, full tests, build, exact JSON count audit, secret/forbidden-scope search, and final code review. Do not commit or deploy; report that live setup awaits explicit credentials and authorization.
