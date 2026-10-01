# Contributing

## Repository layout

- `src/` contains the toast store, framework-independent renderer, React bindings, and host management.
- `src/styles/toasts.css` contains the published toast styles.
- `types/` contains the public TypeScript declarations.
- `tests/` covers store timing and React integration.
- `README.md` documents consumer usage; `CHANGELOG.md` records package changes.

## Behavior conventions

- Keep toast state and timers framework-independent in `store.js`.
- Pause reasons must be independent so visibility, focus, and pointer interactions cannot resume one another prematurely.
- Preserve live-region announcements, keyboard dismissal, reduced motion, and action-link safety.
- Keep React exports, declaration files, CSS classes, and README examples in sync.
