import type { ReactElement, ReactNode } from "react";
import type { Toast, ToastFunction, Toaster as ToasterInstance, ToastPosition } from "./index.js";

export { createToaster, toast, toaster } from "./index.js";

export declare function Toaster(props: {
  /** Defaults to the shared app-wide toaster. */
  toaster?: ToasterInstance;
  position?: ToastPosition;
  label?: string;
  closeLabel?: string;
  /** Fallback host when no modal dialog is open. Defaults to `document.body`. */
  container?: HTMLElement;
  className?: string;
  children?: ReactNode;
}): ReactElement;

export declare function useToast(): ToastFunction;
export declare function useToasts(toaster?: ToasterInstance): Toast[];
