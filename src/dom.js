import { createIcon, cx, resolveAction } from "@cubyt/ui";
import { watchToastHost } from "./host.js";
import { toaster as defaultToaster } from "./toaster.js";

export const TONE_ICONS = {
  success: "check-circle",
  error: "alert-circle",
  warning: "alert-triangle",
  info: "info",
};

export const NOTICE_TONES = {
  success: "success",
  error: "danger",
  warning: "warning",
  info: "info",
  loading: "info",
  default: "info",
};

const SWIPE_THRESHOLD = 60;

function el(tag, className, attributes = {}) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  for (const [key, value] of Object.entries(attributes)) {
    if (value !== undefined && value !== null && value !== false) node.setAttribute(key, value === true ? "" : String(value));
  }
  return node;
}

/** Attach horizontal swipe-to-dismiss to a toast element. */
export function enableSwipe(node, onDismiss) {
  let start = null;
  const onDown = (event) => {
    if (event.target.closest("button, a")) return;
    start = { x: event.clientX, id: event.pointerId };
    node.setPointerCapture?.(event.pointerId);
  };
  const onMove = (event) => {
    if (!start || event.pointerId !== start.id) return;
    const dx = event.clientX - start.x;
    node.style.setProperty("--cubyt-toast-swipe", `${dx}px`);
    node.dataset.swiping = "true";
  };
  const onUp = (event) => {
    if (!start || event.pointerId !== start.id) return;
    const dx = event.clientX - start.x;
    start = null;
    delete node.dataset.swiping;
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      node.dataset.swipeOut = dx > 0 ? "right" : "left";
      onDismiss();
    } else {
      node.style.removeProperty("--cubyt-toast-swipe");
    }
  };
  const events = [
    ["pointerdown", onDown],
    ["pointermove", onMove],
    ["pointerup", onUp],
    ["pointercancel", onUp],
  ];
  for (const [type, handler] of events) node.addEventListener(type, handler);
  return () => {
    for (const [type, handler] of events) node.removeEventListener(type, handler);
  };
}

function renderToast(toast, { store, closeLabel }) {
  const tone = toast.tone ?? "default";
  const node = el("li", cx("cubyt-toast", "cubyt-notice", `cubyt-notice--${NOTICE_TONES[tone] ?? "info"}`), {
    "data-tone": tone,
    "data-state": toast.state,
    role: tone === "error" ? "alert" : undefined,
    "aria-atomic": "true",
    tabindex: "0",
  });

  const iconWrap = el("span", "cubyt-notice__icon");
  if (tone === "loading") iconWrap.append(el("span", "cubyt-spinner"));
  else if (toast.icon !== false && (toast.icon || TONE_ICONS[tone])) {
    iconWrap.append(createIcon(toast.icon || TONE_ICONS[tone], { size: 18 }));
  }
  if (iconWrap.childNodes.length) node.append(iconWrap);

  const body = el("div", "cubyt-notice__body");
  if (toast.title) {
    const title = el("p", "cubyt-notice__title");
    title.textContent = String(toast.title);
    body.append(title);
  }
  if (toast.description) {
    const text = el("p", "cubyt-notice__text");
    text.textContent = String(toast.description);
    body.append(text);
  }
  node.append(body);

  if (toast.action?.label) {
    const actions = el("div", "cubyt-toast__actions");
    const button = el("button", "cubyt-btn cubyt-btn--secondary cubyt-btn--sm", { type: "button" });
    button.textContent = toast.action.label;
    button.addEventListener("click", async (event) => {
      await resolveAction(toast.action, event);
      if (toast.action.dismiss !== false) store.dismiss(toast.id, "action");
    });
    actions.append(button);
    node.append(actions);
  }

  if (toast.dismissible !== false) {
    const close = el("button", "cubyt-icon-btn cubyt-icon-btn--ghost cubyt-toast__close", {
      type: "button",
      "aria-label": closeLabel,
      title: closeLabel,
    });
    close.append(createIcon("x", { size: 14 }));
    close.addEventListener("click", () => store.dismiss(toast.id, "close-button"));
    node.append(close);
    node.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        store.dismiss(toast.id, "escape");
      }
    });
    enableSwipe(node, () => store.dismiss(toast.id, "swipe"));
  }
  return node;
}

/**
 * Mount a vanilla toaster region. Toasts render in the top-most open modal dialog
 * when one exists so they stay interactive and announced.
 */
export function mountToaster(options = {}) {
  const {
    toaster = defaultToaster,
    position = "bottom-right",
    container,
    label = "Notificaciones",
    closeLabel = "Cerrar notificación",
  } = options;
  const { store } = toaster;

  const region = el("section", "cubyt-toaster", { "aria-label": label, "data-position": position });
  const list = el("ol", "cubyt-toaster__list", { "aria-live": "polite", "aria-relevant": "additions text" });
  region.append(list);

  const pause = () => store.pause();
  const resume = () => {
    if (!region.matches(":hover") && !region.contains(document.activeElement)) store.resume();
  };
  region.addEventListener("pointerenter", pause);
  region.addEventListener("pointerleave", resume);
  region.addEventListener("focusin", pause);
  region.addEventListener("focusout", () => setTimeout(resume, 0));

  const nodes = new Map();
  const render = (toasts) => {
    const ids = new Set(toasts.map((toast) => toast.id));
    for (const [id, entry] of nodes) {
      if (!ids.has(id)) {
        entry.node.remove();
        nodes.delete(id);
      }
    }
    for (const toast of toasts) {
      const entry = nodes.get(toast.id);
      if (entry && entry.toast === toast) continue;
      const node = renderToast(toast, { store, closeLabel });
      if (entry) entry.node.replaceWith(node);
      else list.append(node);
      nodes.set(toast.id, { toast, node });
    }
    region.dataset.empty = toasts.length === 0 ? "true" : "false";
  };

  const watcher = watchToastHost((host) => host.append(region), container);
  watcher.host.append(region);
  render(store.getSnapshot());
  const unsubscribe = store.subscribe(render);

  return {
    element: region,
    destroy() {
      unsubscribe();
      watcher.stop();
      region.remove();
    },
  };
}
