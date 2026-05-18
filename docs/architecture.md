# Architecture

## Runtime

The app has one Node process:

- Express serves `/api/*`.
- In development, Vite middleware serves the React app.
- In production, Express serves the built `dist` directory.

## Server Modules

- `server/index.js`: process entrypoint.
- `server/start-production.js`: production entrypoint that sets `NODE_ENV`.
- `server/app.js`: Express app factory; injectable for tests and future hosting adapters.
- `server/config.js`: environment parsing and defaults.
- `server/model-providers.js`: provider pool adapters for OpenAI-compatible APIs and Claude Messages API.
- `server/rate-limit.js`: fixed-window request limiter.
- `server/session.js`: signed HttpOnly session cookie for public access protection.
- `server/meeting.js`: meeting domain logic, JSON contract, prompt, validation, sanitization.
- `shared/personas.js`: shared persona and preset data used by both frontend and backend.

## Frontend Modules

- `src/App.jsx`: main UI composition.
- `src/components.jsx`: visual components.
- `src/data/personas.js`: frontend re-export for shared personas.
- `src/hooks/useTypewriter.js`: playback text reveal behavior.
- `src/lib/roundtable.js`: pure roundtable state helpers.
- `src/lib/minutes.js`: markdown export helpers.
- `src/services/roundtableApi.js`: browser-to-server API calls.

## Data Flow

1. User sets topic, preset, optional access code, and optional context notes.
2. Frontend builds a compact meeting payload.
3. If access protection is enabled, the frontend exchanges `APP_ACCESS_CODE` once through `POST /api/sessions`.
4. The server stores access state in a signed HttpOnly cookie.
5. `POST /api/meetings` validates topic, session, budget limits, and API configuration.
6. Server routes each speaker turn through the configured provider pool.
7. Server asks the moderator provider to summarize vote, risks, and actions.
8. Server parses, validates, and sanitizes model output.
9. Frontend plays the returned meeting through the existing roundtable UI.

## Distribution

Use one of:

- Source: `npm ci && npm run build && npm run start`
- Docker: `docker build -t ai-roundtable-room .`

Provider pool:

- `AI_PROVIDERS=openai,deepseek,glm,custom1`
- `${PROVIDER_ID}_API_KEY`
- `${PROVIDER_ID}_BASE_URL`
- `${PROVIDER_ID}_MODEL`
- `ROLE_PROVIDERS=li:deepseek,heng:openai,che:glm`

Recommended public deployment secret:

- `APP_ACCESS_CODE`
- `SESSION_SECRET`

Recommended abuse control:

- `DAILY_MEETING_LIMIT`
