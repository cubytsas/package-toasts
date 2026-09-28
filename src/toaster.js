import { createToastStore } from "./store.js";

const normalize = (message, options = {}) => {
  const content =
    message && typeof message === "object" && !Array.isArray(message) && "title" in message
      ? message
      : { title: message };
  return { ...options, ...content };
};

const toMessage = (value, result) => (typeof value === "function" ? value(result) : value);

/**
 * Create an isolated toaster. `toast(message, options)` returns an id; tone helpers
 * (`success`, `error`, `info`, `warning`, `loading`) and `promise` are attached.
 */
export function createToaster(options) {
  const store = createToastStore(options);

  const toast = (message, toastOptions) => store.add(normalize(message, toastOptions));
  toast.success = (message, toastOptions) => toast(message, { ...toastOptions, tone: "success" });
  toast.error = (message, toastOptions) => toast(message, { ...toastOptions, tone: "error" });
  toast.info = (message, toastOptions) => toast(message, { ...toastOptions, tone: "info" });
  toast.warning = (message, toastOptions) => toast(message, { ...toastOptions, tone: "warning" });
  toast.loading = (message, toastOptions) =>
    toast(message, { dismissible: false, ...toastOptions, tone: "loading" });

  /** Show a loading toast that turns into success or error when the promise settles. */
  toast.promise = (promise, messages, toastOptions = {}) => {
    const id = toast.loading(messages.loading, toastOptions);
    const settle = (tone, message) =>
      store.update(id, {
        ...normalize(message, toastOptions),
        tone,
        dismissible: toastOptions.dismissible ?? true,
        duration: toastOptions.duration,
      });
    Promise.resolve(promise).then(
      (result) => settle("success", toMessage(messages.success, result)),
      (error) => settle("error", toMessage(messages.error, error)),
    );
    return promise;
  };

  toast.update = (id, patch) => store.update(id, patch);
  toast.dismiss = (id) => (id === undefined ? store.dismissAll() : store.dismiss(id));

  return { toast, store };
}

/** Default app-wide toaster. */
export const toaster = createToaster();
export const toast = toaster.toast;
