# Changelog

All notable changes to `@cubyt/toasts` are documented here.

## [1.1.0] - 2026-10-01

### Changed

- Pause toast timers while the document is hidden, without allowing visibility and interaction pauses to cancel one another.
- Move the stylesheet under `src/styles/` while preserving the public `@cubyt/toasts/toasts.css` import.
- Simplify the README and document repository conventions.

## [1.0.1] - 2026-09-28

### Changed

- Publish from GitHub Actions with npm provenance attestations linking the package to its source commit and workflow.
- Align the optional `@cubyt/style` peer dependency with the published `1.0.1` design-token package.

## [1.0.0] - 2026-09-28

Initial public release.

### Added

- Toast store with per-tone durations, `max` visible toasts, pausable timers and exit states.
- `toast()` API with `success`, `error`, `info`, `warning`, `loading`, `promise`, `update` and `dismiss`.
- Vanilla renderer (`mountToaster`) and React `Toaster`, `useToast` and `useToasts`.
- Accessible live region, Escape and swipe to dismiss, pause on hover/focus, and actions routed through `@cubyt/navigation`.
- Toasts follow the top-most open modal dialog so they stay interactive while a modal is open.
- `toasts.css` built on `@cubyt/ui` notice tones.
- TypeScript declarations, explicit package exports and a minimal npm file allowlist.
- MIT license.
