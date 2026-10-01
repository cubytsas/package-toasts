# @cubyt/toasts

Accessible toast notifications for Cubyt Sas products, with a framework-agnostic store, a vanilla renderer and a React `Toaster`.

- `toast.success/error/info/warning/loading/promise` with per-tone durations and `max` visible toasts.
- Pause on hover or focus, Escape and swipe to dismiss, and a polite live region (errors use `role="alert"`).
- Timers pause while the page is hidden and while the toast region is hovered or focused.
- Action buttons route through [`@cubyt/navigation`](https://github.com/cubytsas/package-navigation) (SPA route, full redirect or new tab, with unsafe URLs rejected).
- While a `<dialog>` modal is open, toasts render inside it so they remain clickable and announced.

## Install

```sh
npm install @cubyt/toasts @cubyt/ui @cubyt/style
```

For local development in this repository:

```sh
npm install ../branding/packages/ui ../branding/packages/toasts
```

```css
@import "@cubyt/style/tokens.css";
@import "@cubyt/ui/ui.css";
@import "@cubyt/toasts/toasts.css";
```

## React

```tsx
import { Toaster, toast } from "@cubyt/toasts/react";

<Toaster position="bottom-right">
  <App />
</Toaster>;

toast.success("Dominio verificado");
toast.error({ title: "No se pudo guardar", description: "Revisa tu conexión." });
toast("Invitación enviada", { action: { label: "Ver", href: "/es/dashboard/miembros" } });

await toast.promise(api.exportOrg(), {
  loading: "Exportando datos…",
  success: (file) => `Exportado: ${file.name}`,
  error: (error) => ({ title: "Falló la exportación", description: error.message }),
});
```

`useToast()` returns the `toast` function of the closest `<Toaster>` (or the shared default). `useToasts()` returns the live list for custom renderers.

## Without a framework

```js
import { mountToaster, toast } from "@cubyt/toasts";

mountToaster({ position: "top-center" });
const id = toast.loading("Sincronizando…");
toast.update(id, { tone: "success", title: "Sincronizado", duration: 3000 });
```

## Options

| Option | Description |
| --- | --- |
| `description` | Secondary text. |
| `tone` | `default`, `success`, `error`, `warning`, `info`, `loading`. |
| `duration` | Milliseconds, or `Infinity`. The defaults are 4s for success, 5s for info, 7s for warning, 8s for error, and infinite for loading. |
| `action` | `{ label, href?, external?, newTab?, onClick?, dismiss? }` |
| `id` | Reusing an id updates the existing toast instead of stacking another. |
| `dismissible` | Close button, Escape and swipe. Loading toasts default to `false`. |
| `onDismiss(reason)` | `timeout`, `overflow`, `close-button`, `escape`, `swipe`, `action` or `programmatic`. |

Use `createToaster({ max, durations })` for an isolated instance and pass it to `<Toaster toaster={…}>` or `mountToaster({ toaster })`.
