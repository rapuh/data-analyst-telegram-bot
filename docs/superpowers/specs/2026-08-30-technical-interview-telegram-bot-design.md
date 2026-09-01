# Technical Interview Telegram Bot Design

## Status and goal

Approved for implementation on 2026-08-30. Build a free, Vercel-hosted Telegram bot for technical data-analyst interview practice. It uses a static question bank, no database, and works while the user's PC is off.

## Fixed scope

- Exactly 460 four-option MCQs: SQL 100; Python, Pandas, libraries, and EDA 180; statistics and hypothesis testing 80; Excel 40; Tableau 60.
- Each question has an `easy`, `moderate`, or `hard` tag. Difficulty never affects selection.
- Each question is sampled independently and uniformly with replacement from the entire 460-question bank. Immediate repeats are valid.
- Answers are tap-only through Telegram inline-keyboard buttons. Free-text answers are ignored.
- After any option tap, silently acknowledge the callback, then send two separate messages in order: the correct answer plus a concise explanation, then the next independently random MCQ.
- Never score, judge the user's choice, indicate right/wrong, or use quiz colors.
- `/start` is the only command and sends one random MCQ.
- Exclude user-background, behavioral, finance-specific, employer/client, tracking, reminders, dashboards, forecasting, databases, paid runtime AI, and other extras.

## Architecture

A TypeScript Vercel Node.js Function at `api/webhook.ts` authenticates Telegram webhook requests and delegates update handling to focused modules under `src/`. Telegram API calls use native `fetch`; no bot framework is needed. Five JSON files under `data/questions/` are imported and combined into one immutable array.

Callback data is `answer:<question-id>:<choice-index>` and never embeds the correct answer. A valid callback is acknowledged without text or alert, the source question is looked up by ID, a neutral answer message is sent, and only then is a new random MCQ sent. Stale or malformed callbacks are silently acknowledged and do not produce misleading content.

## Security

- `TELEGRAM_BOT_TOKEN` and `TELEGRAM_WEBHOOK_SECRET` are server-only environment variables.
- Secret-bearing `.env*` files are ignored; `.env.example` contains names only.
- `X-Telegram-Bot-Api-Secret-Token` is compared with the configured secret using a timing-safe comparison before request processing.
- Tokens, secrets, full updates, and user text are never logged.
- Unsupported methods return `405`, unauthorized requests `401`, malformed JSON `400`, and missing configuration a generic `500`.

## Messages and errors

Question messages show topic, difficulty, the prompt, and four inline buttons labelled A-D with option text. The answer message is neutral: `Correct answer: B. <choice text>` followed by the concise explanation. It never refers to the selected option.

Telegram API failures produce sanitized internal errors without the token. The webhook returns non-2xx when required outbound calls fail so Telegram may retry. With no persistence, retry deduplication and exactly-once delivery are explicit v1 limitations.

## Verification

Tests enforce exact totals and topic counts, schema validity, unique IDs/prompts, allowed difficulty tags, four choices, valid answer keys, neutral language, forbidden-scope terms, uniform replacement behavior, callback secrecy, message ordering, ignored free text, secure webhook handling, secret hygiene, and a clean TypeScript build.

## Deployment boundary

The project includes setup and deployment instructions but does not create a Telegram bot, use credentials, register a webhook, link or deploy a Vercel project, push a repository, or commit. Those actions require separate explicit authorization.
