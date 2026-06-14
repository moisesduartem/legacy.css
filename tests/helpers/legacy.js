import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { JSDOM } from "jsdom";

const legacyPath = resolve("src/legacy.ts");
const legacyUrl = pathToFileURL(legacyPath).href;
let importId = 0;

const globalNames = [
  "window",
  "document",
  "CSS",
  "HTMLElement",
  "HTMLDialogElement",
  "CustomEvent",
  "Event",
  "KeyboardEvent",
];

export async function createLegacyDom(html = "", options = {}) {
  const dom = new JSDOM("<!doctype html><html><body>" + html + "</body></html>", {
    pretendToBeVisual: true,
    url: "http://localhost/",
  });

  if (!dom.window.CSS) {
    dom.window.CSS = {};
  }

  if (!dom.window.CSS.escape) {
    dom.window.CSS.escape = (value) => String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  }

  if (options.beforeEval) {
    options.beforeEval(dom.window);
  }

  const previousGlobals = new Map();

  globalNames.forEach((name) => {
    previousGlobals.set(name, globalThis[name]);
    globalThis[name] = dom.window[name];
  });

  dom.__legacyRestoreGlobals = () => {
    previousGlobals.forEach((value, name) => {
      if (value === undefined) {
        delete globalThis[name];
        return;
      }

      globalThis[name] = value;
    });
  };

  await import(legacyUrl + "?test=" + ++importId);

  return dom;
}

export function closeDom(dom) {
  if (dom.__legacyRestoreGlobals) {
    dom.__legacyRestoreGlobals();
  }

  dom.window.close();
}

export function nextFrame(window) {
  return new Promise((resolvePromise) => {
    window.setTimeout(resolvePromise, 0);
  });
}
