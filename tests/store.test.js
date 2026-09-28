import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";
import { createToaster, createToastStore } from "../src/index.js";

beforeEach(() => mock.timers.enable({ apis: ["setTimeout", "Date"] }));
afterEach(() => mock.timers.reset());

const open = (store) => store.getSnapshot().filter((toast) => toast.state === "open");

test("toasts auto-dismiss after their tone duration and are removed after exit", () => {
  const store = createToastStore({ durations: { success: 1000 }, exitDuration: 100 });
  const id = store.add({ title: "Guardado", tone: "success" });
  assert.equal(store.get(id).state, "open");

  mock.timers.tick(999);
  assert.equal(store.get(id).state, "open");
  mock.timers.tick(1);
  assert.equal(store.get(id).state, "leaving");
  mock.timers.tick(100);
  assert.equal(store.get(id), undefined);
});

test("loading toasts persist until updated", () => {
  const store = createToastStore({ durations: { success: 500 } });
  const id = store.add({ title: "Subiendo", tone: "loading" });
  mock.timers.tick(60_000);
  assert.equal(store.get(id).state, "open");

  store.update(id, { tone: "success", title: "Listo" });
  mock.timers.tick(500);
  assert.equal(store.get(id).state, "leaving");
});

test("pause and resume keep the remaining time", () => {
  const store = createToastStore({ durations: { default: 1000 } });
  const id = store.add({ title: "Hola" });
  mock.timers.tick(600);
  store.pause();
  mock.timers.tick(5000);
  assert.equal(store.get(id).state, "open");
  store.resume();
  mock.timers.tick(399);
  assert.equal(store.get(id).state, "open");
  mock.timers.tick(1);
  assert.equal(store.get(id).state, "leaving");
});

test("max visible toasts dismisses the oldest and reports the reason", () => {
  const reasons = [];
  const store = createToastStore({ max: 2 });
  store.add({ title: "1", onDismiss: (reason) => reasons.push(reason) });
  store.add({ title: "2" });
  store.add({ title: "3" });
  assert.deepEqual(open(store).map((toast) => toast.title), ["2", "3"]);
  assert.deepEqual(reasons, ["overflow"]);
});

test("reusing an id updates instead of stacking", () => {
  const store = createToastStore();
  store.add({ id: "sync", title: "Sincronizando", tone: "loading" });
  store.add({ id: "sync", title: "Sincronizado", tone: "success" });
  assert.equal(store.getSnapshot().length, 1);
  assert.equal(store.get("sync").title, "Sincronizado");
});

test("toast helpers set tones and dismiss", () => {
  const { toast, store } = createToaster();
  const id = toast.error("Falló", { description: "Intenta de nuevo" });
  assert.equal(store.get(id).tone, "error");
  assert.equal(store.get(id).description, "Intenta de nuevo");
  assert.equal(store.get(toast.loading("Cargando")).dismissible, false);
  toast.dismiss();
  assert.equal(open(store).length, 0);
});

test("toast.promise moves from loading to success or error", async () => {
  mock.timers.reset();
  const { toast, store } = createToaster();
  await toast.promise(Promise.resolve(3), {
    loading: "Exportando",
    success: (count) => `${count} archivos`,
    error: "Error",
  });
  await Promise.resolve();
  const [done] = store.getSnapshot();
  assert.equal(done.tone, "success");
  assert.equal(done.title, "3 archivos");
  assert.equal(done.dismissible, true);

  await toast.promise(Promise.reject(new Error("boom")), {
    loading: "Exportando",
    success: "OK",
    error: (error) => ({ title: "Falló", description: error.message }),
  }).catch(() => {});
  await Promise.resolve();
  const failed = store.getSnapshot().at(-1);
  assert.equal(failed.tone, "error");
  assert.equal(failed.description, "boom");
  toast.dismiss();
});
