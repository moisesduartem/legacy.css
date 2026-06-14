import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { JSDOM } from "jsdom";

interface LegacyDomOptions {
  beforeEval?: (window: any) => void;
}

const legacyPath = resolve("src/legacy.ts");
const legacyUrl = pathToFileURL(legacyPath).href;
let importId = 0;

const globalNames = [
  "window",
  "document",
  "CSS",
  "Element",
  "HTMLElement",
  "HTMLDialogElement",
  "CustomEvent",
  "Event",
  "KeyboardEvent",
];

export async function createLegacyDom(html = "", options: LegacyDomOptions = {}) {
  const dom = new JSDOM("<!doctype html><html><body>" + html + "</body></html>", {
    pretendToBeVisual: true,
    url: "http://localhost/",
  });

  if (!dom.window.CSS) {
    dom.window.CSS = {};
  }

  if (!dom.window.CSS.escape) {
    dom.window.CSS.escape = (value: unknown) => String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  }

  if (options.beforeEval) {
    options.beforeEval(dom.window);
  }

  const previousGlobals = new Map();
  const globalScope = globalThis as Record<string, unknown>;

  globalNames.forEach((name) => {
    previousGlobals.set(name, globalScope[name]);
    globalScope[name] = dom.window[name];
  });

  dom.__legacyRestoreGlobals = () => {
    previousGlobals.forEach((value: unknown, name: string) => {
      if (value === undefined) {
        delete globalScope[name];
        return;
      }

      globalScope[name] = value;
    });
  };

  await import(legacyUrl + "?test=" + ++importId);

  return dom;
}

export function closeDom(dom: JSDOM): void {
  if (dom.__legacyRestoreGlobals) {
    dom.__legacyRestoreGlobals();
  }

  dom.window.close();
}

export function nextFrame(window: { setTimeout(callback: () => void, delay: number): void }): Promise<void> {
  return new Promise((resolvePromise) => {
    window.setTimeout(resolvePromise, 0);
  });
}
