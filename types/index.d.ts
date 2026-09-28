import type { Action, IconName } from "@cubyt/ui";

export type ToastTone = "default" | "success" | "error" | "warning" | "info" | "loading";
export type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";
export type ToastDismissReason =
  | "timeout"
  | "overflow"
  | "close-button"
  | "escape"
  | "swipe"
  | "action"
  | "programmatic";

export type ToastAction = Action & {
  label: string;
  /** Set to `false` to keep the toast after the action runs. */
  dismiss?: boolean;
};

export type ToastOptions = {
  /** Reuse an id to update an existing toast instead of stacking a new one. */
  id?: string;
  description?: string;
  tone?: ToastTone;
  /** Milliseconds before auto-dismiss. `Infinity` keeps it until dismissed. */
  duration?: number;
  action?: ToastAction;
  /** Icon name, custom element (React), or `false` to hide it. */
  icon?: IconName | false | unknown;
  /** Show the close button and allow Escape/swipe. Defaults to `true`. */
  dismissible?: boolean;
  onDismiss?: (reason: ToastDismissReason) => void;
};

export type ToastMessage = string | { title: string; description?: string };

export type Toast = ToastOptions & {
  id: string;
  title?: unknown;
  tone: ToastTone;
  createdAt: number;
  state: "open" | "leaving";
};

export interface ToastStore {
  add(toast: Partial<Toast> & { title?: unknown }): string;
  update(id: string, patch: Partial<Toast>): void;
  dismiss(id: string, reason?: ToastDismissReason): void;
  dismissAll(reason?: ToastDismissReason): void;
  remove(id: string): void;
  pause(): void;
  resume(): void;
  readonly paused: boolean;
  get(id: string): Toast | undefined;
  getSnapshot(): Toast[];
  subscribe(listener: (toasts: Toast[]) => void): () => void;
}

export type ToastStoreOptions = {
  /** Maximum visible toasts; older ones are dismissed. Defaults to 3. */
  max?: number;
  /** Default durations per tone in ms. */
  durations?: Partial<Record<ToastTone, number>>;
  /** Time a toast stays in the `leaving` state before removal. Defaults to 200. */
  exitDuration?: number;
};

export declare function createToastStore(options?: ToastStoreOptions): ToastStore;

export type PromiseMessages<T> = {
  loading: ToastMessage;
  success: ToastMessage | ((value: T) => ToastMessage);
  error: ToastMessage | ((error: unknown) => ToastMessage);
};

export interface ToastFunction {
  (message: ToastMessage, options?: ToastOptions): string;
  success(message: ToastMessage, options?: ToastOptions): string;
  error(message: ToastMessage, options?: ToastOptions): string;
  info(message: ToastMessage, options?: ToastOptions): string;
  warning(message: ToastMessage, options?: ToastOptions): string;
  loading(message: ToastMessage, options?: ToastOptions): string;
  promise<T>(promise: Promise<T>, messages: PromiseMessages<T>, options?: ToastOptions): Promise<T>;
  update(id: string, patch: Partial<Toast>): void;
  /** Dismiss one toast, or all when called without an id. */
  dismiss(id?: string): void;
}

export type Toaster = { toast: ToastFunction; store: ToastStore };

export declare function createToaster(options?: ToastStoreOptions): Toaster;
export declare const toaster: Toaster;
export declare const toast: ToastFunction;

export declare const TONE_ICONS: Record<"success" | "error" | "warning" | "info", IconName>;
export declare const NOTICE_TONES: Record<ToastTone, "success" | "danger" | "warning" | "info">;

export declare function enableSwipe(node: HTMLElement, onDismiss: () => void): () => void;

export declare function mountToaster(options?: {
  toaster?: Toaster;
  position?: ToastPosition;
  /** Fallback host when no modal dialog is open. Defaults to `document.body`. */
  container?: HTMLElement;
  label?: string;
  closeLabel?: string;
}): { element: HTMLElement; destroy(): void };

export declare function getToastHost(fallback?: HTMLElement): HTMLElement;
export declare function watchToastHost(
  onChange: (host: HTMLElement) => void,
  fallback?: HTMLElement,
): { host: HTMLElement; stop(): void };
