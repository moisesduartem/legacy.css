import { afterEach, vi } from "vitest";
import { closeDom, createLegacyDom, nextFrame } from "./legacy";
import type { JSDOM } from "jsdom";

export { nextFrame };

export let dom: JSDOM | null = null;

afterEach(() => {
  vi.restoreAllMocks();

  if (dom) {
    closeDom(dom);
    dom = null;
  }
});

export async function createComponentDom(html = "", options: Parameters<typeof createLegacyDom>[1] = {}): Promise<JSDOM> {
  dom = await createLegacyDom(html, options);

  return dom;
}

export function html(strings: TemplateStringsArray, ...values: unknown[]): string {
  return strings.reduce((result, string, index) => result + string + (values[index] || ""), "");
}

export function dispatch(target: Element, type: string, options: Record<string, unknown> = {}): Event {
  const view = target.ownerDocument.defaultView;

  if (!view) {
    throw new Error("Cannot dispatch without a window");
  }

  const event = new view.Event(type, {
    bubbles: true,
    cancelable: true,
  });

  Object.entries(options).forEach(([key, value]) => {
    Object.defineProperty(event, key, { value });
  });

  target.dispatchEvent(event);

  return event;
}
