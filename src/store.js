const DEFAULT_DURATIONS = {
  default: 5000,
  info: 5000,
  success: 4000,
  warning: 7000,
  error: 8000,
  loading: Infinity,
};

/**
 * Framework-agnostic toast state: ordering, `max` visible toasts, auto-dismiss
 * timers that can be paused (hover/focus), and a short `leaving` state for exit
 * animations before removal.
 */
export function createToastStore(options = {}) {
  const { max = 3, durations = {}, exitDuration = 200 } = options;
  const defaults = { ...DEFAULT_DURATIONS, ...durations };
  let toasts = [];
  let counter = 0;
  let paused = false;
  const listeners = new Set();
  const timers = new Map();

  const emit = () => {
    toasts = toasts.slice();
    for (const listener of listeners) listener(toasts);
  };

  const find = (id) => toasts.find((toast) => toast.id === id);
  const effectiveDuration = (toast) => toast.duration ?? defaults[toast.tone] ?? defaults.default;

  const clearTimer = (id) => {
    const timer = timers.get(id);
    if (timer?.handle) clearTimeout(timer.handle);
    timers.delete(id);
  };

  const startTimer = (id, remaining) => {
    clearTimer(id);
    if (!Number.isFinite(remaining)) return;
    const timer = { remaining, start: Date.now(), handle: undefined };
    if (!paused) timer.handle = setTimeout(() => dismiss(id, "timeout"), remaining);
    timers.set(id, timer);
  };

  function add(input) {
    const id = input.id ?? `cubyt-toast-${++counter}`;
    if (find(id)) {
      update(id, input);
      return id;
    }
    const toast = {
      tone: "default",
      dismissible: true,
      ...input,
      id,
      createdAt: Date.now(),
      state: "open",
    };
    toasts = [...toasts, toast];

    const open = toasts.filter((item) => item.state === "open");
    for (const extra of open.slice(0, Math.max(open.length - max, 0))) {
      markLeaving(extra.id, "overflow");
    }
    startTimer(id, effectiveDuration(toast));
    emit();
    return id;
  }

  function update(id, patch) {
    const current = find(id);
    if (!current) return;
    const next = { ...current, ...patch, id, state: current.state };
    toasts = toasts.map((toast) => (toast.id === id ? next : toast));
    if (next.state === "open" && ("duration" in patch || "tone" in patch)) {
      startTimer(id, effectiveDuration(next));
    }
    emit();
  }

  function markLeaving(id, reason) {
    const toast = find(id);
    if (!toast || toast.state !== "open") return false;
    clearTimer(id);
    toasts = toasts.map((item) => (item.id === id ? { ...item, state: "leaving" } : item));
    toast.onDismiss?.(reason);
    setTimeout(() => remove(id), exitDuration);
    return true;
  }

  function dismiss(id, reason = "programmatic") {
    if (markLeaving(id, reason)) emit();
  }

  function remove(id) {
    clearTimer(id);
    const before = toasts.length;
    toasts = toasts.filter((toast) => toast.id !== id);
    if (toasts.length !== before) emit();
  }

  return {
    add,
    update,
    dismiss,
    remove,
    dismissAll(reason = "programmatic") {
      let changed = false;
      for (const toast of toasts) changed = markLeaving(toast.id, reason) || changed;
      if (changed) emit();
    },
    pause() {
      if (paused) return;
      paused = true;
      const now = Date.now();
      for (const timer of timers.values()) {
        clearTimeout(timer.handle);
        timer.handle = undefined;
        timer.remaining = Math.max(timer.remaining - (now - timer.start), 0);
      }
    },
    resume() {
      if (!paused) return;
      paused = false;
      for (const [id, timer] of [...timers]) startTimer(id, timer.remaining);
    },
    get paused() {
      return paused;
    },
    get: find,
    getSnapshot: () => toasts,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
