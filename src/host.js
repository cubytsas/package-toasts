/**
 * Modal dialogs make the rest of the page inert, so toasts rendered in `<body>`
 * would be unreachable and silent while a modal is open. The host is therefore
 * the top-most open modal `<dialog>`, falling back to `fallback`.
 */
export function getToastHost(fallback) {
  const base = fallback ?? document.body;
  let dialogs = [];
  try {
    dialogs = [...document.querySelectorAll("dialog:modal")];
  } catch {
    dialogs = [...document.querySelectorAll("dialog[open][data-cubyt-modal-id]")];
  }
  return dialogs.at(-1) ?? base;
}

/** Call `onChange(host)` whenever the top-most modal dialog changes. */
export function watchToastHost(onChange, fallback) {
  let current = getToastHost(fallback);
  const check = () => {
    const next = getToastHost(fallback);
    if (next !== current || !next.isConnected) {
      current = next;
      onChange(next);
    }
  };
  const observer = new MutationObserver(check);
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["open"],
  });
  return { host: current, stop: () => observer.disconnect() };
}
