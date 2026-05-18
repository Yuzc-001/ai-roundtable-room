# Contributing

## Local Checks

Run before opening a change:

```bash
npm run check
```

## Code Shape

- Keep UI components in `src/components.jsx` visually compatible unless the change is explicitly UI work.
- Put reusable frontend logic in `src/lib`, `src/hooks`, or `src/services`.
- Put server startup wiring in `server/index.js`; put reusable server behavior in `server/app.js`, `server/config.js`, `server/rate-limit.js`, and `server/meeting.js`.
- Keep shared persona/preset data in `shared/personas.js`; frontend imports it through `src/data/personas.js`.
- Add tests for behavior changes.

## Security

- Never expose `OPENAI_API_KEY` to the browser.
- Keep user input validation at the API boundary.
- Keep generated model output sanitized before returning it to the frontend.
