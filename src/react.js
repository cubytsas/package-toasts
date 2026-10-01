import {
  createContext,
  createElement as h,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { cx, resolveAction } from "@cubyt/ui";
import { Button, Icon, IconButton, Spinner } from "@cubyt/ui/react";
import { enableSwipe, NOTICE_TONES, TONE_ICONS } from "./dom.js";
import { watchToastHost } from "./host.js";
import { toaster as defaultToaster } from "./toaster.js";

const ToasterContext = createContext(defaultToaster);
const EMPTY = [];

function ToastItem({ toast, store, closeLabel }) {
  const ref = useRef(null);
  const tone = toast.tone ?? "default";
  const dismissible = toast.dismissible !== false;

  useEffect(() => {
    if (!dismissible || !ref.current) return undefined;
    return enableSwipe(ref.current, () => store.dismiss(toast.id, "swipe"));
  }, [dismissible, store, toast.id]);

  const icon =
    tone === "loading"
      ? h(Spinner, { size: 18 })
      : toast.icon === false
        ? null
        : typeof toast.icon === "string" || (!toast.icon && TONE_ICONS[tone])
          ? h(Icon, { name: toast.icon || TONE_ICONS[tone], size: 18 })
          : toast.icon;

  return h(
    "li",
    {
      ref,
      className: cx("cubyt-toast", "cubyt-notice", `cubyt-notice--${NOTICE_TONES[tone] ?? "info"}`),
      "data-tone": tone,
      "data-state": toast.state,
      role: tone === "error" ? "alert" : undefined,
      "aria-atomic": true,
      tabIndex: 0,
      onKeyDown: (event) => {
        if (event.key === "Escape" && dismissible) {
          event.stopPropagation();
          store.dismiss(toast.id, "escape");
        }
      },
    },
    icon ? h("span", { className: "cubyt-notice__icon" }, icon) : null,
    h(
      "div",
      { className: "cubyt-notice__body" },
      toast.title ? h("p", { className: "cubyt-notice__title" }, toast.title) : null,
      toast.description ? h("p", { className: "cubyt-notice__text" }, toast.description) : null,
    ),
    toast.action?.label
      ? h(
          "div",
          { className: "cubyt-toast__actions" },
          h(
            Button,
            {
              variant: "secondary",
              size: "sm",
              onClick: async (event) => {
                await resolveAction(toast.action, event);
                if (toast.action.dismiss !== false) store.dismiss(toast.id, "action");
              },
            },
            toast.action.label,
          ),
        )
      : null,
    dismissible
      ? h(IconButton, {
          icon: h(Icon, { name: "x", size: 14 }),
          label: closeLabel,
          variant: "ghost",
          className: "cubyt-toast__close",
          onClick: () => store.dismiss(toast.id, "close-button"),
        })
      : null,
  );
}

/**
 * Render toasts from a toaster (the default one unless `toaster` is passed).
 * Children can call `useToast()` to reach that toaster.
 */
export function Toaster({
  toaster = defaultToaster,
  position = "bottom-right",
  label = "Notificaciones",
  closeLabel = "Cerrar notificación",
  container,
  className,
  children,
}) {
  const { store } = toaster;
  const toasts = useSyncExternalStore(store.subscribe, store.getSnapshot, () => EMPTY);
  const [host, setHost] = useState(null);

  useEffect(() => {
    const watcher = watchToastHost(setHost, container);
    setHost(watcher.host);
    return watcher.stop;
  }, [container]);

  useEffect(() => {
    const syncVisibility = () =>
      document.hidden ? store.pause("visibility") : store.resume("visibility");
    syncVisibility();
    document.addEventListener("visibilitychange", syncVisibility);
    return () => {
      document.removeEventListener("visibilitychange", syncVisibility);
      store.resume("visibility");
    };
  }, [store]);

  const region = h(
    "section",
    {
      className: cx("cubyt-toaster", className),
      "aria-label": label,
      "data-position": position,
      "data-empty": toasts.length === 0,
      onPointerEnter: () => store.pause("pointer"),
      onPointerLeave: () => store.resume("pointer"),
      onFocus: () => store.pause("focus"),
      onBlur: (event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) store.resume("focus");
      },
    },
    h(
      "ol",
      { className: "cubyt-toaster__list", "aria-live": "polite", "aria-relevant": "additions text" },
      toasts.map((toast) => h(ToastItem, { key: toast.id, toast, store, closeLabel })),
    ),
  );

  return h(ToasterContext.Provider, { value: toaster }, children, host ? createPortal(region, host) : null);
}

/** The `toast()` function of the closest `<Toaster>` (or the default toaster). */
export function useToast() {
  return useContext(ToasterContext).toast;
}

/** Live list of toasts, for custom renderers. */
export function useToasts(toaster) {
  const contextToaster = useContext(ToasterContext);
  const { store } = toaster ?? contextToaster;
  return useSyncExternalStore(store.subscribe, store.getSnapshot, () => EMPTY);
}

export { toast, toaster, createToaster } from "./toaster.js";
