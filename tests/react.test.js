import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Toaster, useToast } from "../src/react.js";
import { toast as defaultToast, createToaster } from "../src/index.js";

test("Toaster renders children on the server and exposes useToast", () => {
  const custom = createToaster();
  let received;
  function Probe() {
    received = useToast();
    return h("span", null, "app");
  }
  assert.equal(renderToStaticMarkup(h(Toaster, { toaster: custom }, h(Probe))), "<span>app</span>");
  assert.equal(received, custom.toast);

  renderToStaticMarkup(h(Probe));
  assert.equal(received, defaultToast);
});
