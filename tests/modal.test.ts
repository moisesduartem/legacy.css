// @ts-nocheck
import { describe, expect, it, vi } from "vitest";
import { createComponentDom, dom, html } from "./helpers/components";

describe("LegacyCss.modal", () => {
  it("opens, toggles, closes, and restores focus with fallback dialog behavior", async () => {
    await createComponentDom(html`
      <button id="open">Open</button>
      <dialog id="modal"><button id="field" data-modal-autofocus>Field</button></dialog>
    `);
    const { document, LegacyCss } = dom.window;
    const opener = document.getElementById("open");
    const dialog = document.getElementById("modal");

    opener.focus();
    LegacyCss.modal.open("#modal");

    expect(dialog.open).toBe(true);
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(document.activeElement).toBe(document.getElementById("field"));
    expect(document.body.style.overflow).toBe("hidden");

    LegacyCss.modal.toggle(dialog);

    expect(dialog.open).toBe(false);
    expect(dialog.hasAttribute("aria-modal")).toBe(false);
    expect(document.activeElement).toBe(opener);
    expect(document.body.style.overflow).toBe("");
  });

  it("closes fallback dialogs from data-modal-close clicks and Escape", async () => {
    await createComponentDom(html`
      <dialog id="modal">
        <button id="close" data-modal-close>Close</button>
      </dialog>
    `);
    const { document, LegacyCss, KeyboardEvent } = dom.window;
    const dialog = document.getElementById("modal");

    LegacyCss.modal.open(dialog);
    document.getElementById("close").click();
    expect(dialog.open).toBe(false);

    LegacyCss.modal.open(dialog);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(dialog.open).toBe(false);
  });

  it("handles native dialogs, null targets, focus fallback, and nested fallback locks", async () => {
    await createComponentDom(html`
      <button id="open">Open</button>
      <dialog id="native"></dialog>
      <dialog id="outer"></dialog>
      <dialog id="inner"></dialog>
    `);
    const { document, Event, KeyboardEvent, LegacyCss } = dom.window;
    const opener = document.getElementById("open");
    const native = document.getElementById("native");
    const outer = document.getElementById("outer");
    const inner = document.getElementById("inner");

    native.showModal = vi.fn(function () {
      this.setAttribute("open", "");
    });
    native.close = vi.fn(function (returnValue) {
      this.returnValue = returnValue;
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    });

    expect(LegacyCss.modal.open(null)).toBeNull();
    expect(LegacyCss.modal.toggle(null)).toBeNull();
    expect(LegacyCss.modal.close(null)).toBeNull();

    opener.focus();
    LegacyCss.modal.open({ 0: native, jquery: "test" });
    expect(native.showModal).toHaveBeenCalledTimes(1);
    expect(native.open).toBe(true);
    expect(native.getAttribute("tabindex")).toBe("-1");
    expect(LegacyCss.modal.open(native)).toBe(native);

    LegacyCss.modal.close(native, "saved");
    expect(native.close).toHaveBeenCalledWith("saved");
    expect(native.returnValue).toBe("saved");
    expect(document.activeElement).toBe(opener);

    LegacyCss.modal.close(native);
    expect(native.close).toHaveBeenCalledTimes(1);

    LegacyCss.modal.open(outer);
    LegacyCss.modal.open(inner);
    expect(document.body.style.overflow).toBe("hidden");

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(inner.open).toBe(true);

    LegacyCss.modal.close(inner);
    expect(document.body.style.overflow).toBe("hidden");

    outer.click();
    expect(outer.open).toBe(false);
    expect(document.body.style.overflow).toBe("");
  });

  it("uses node-name dialog fallback when HTMLDialogElement is unavailable", async () => {
    await createComponentDom("<dialog id=\"modal\"></dialog>", {
      beforeEval(window) {
        window.HTMLDialogElement = undefined;
      },
    });
    const { document, LegacyCss } = dom.window;
    const dialog = document.getElementById("modal");

    expect(LegacyCss.modal.open(dialog)).toBe(dialog);
    expect(dialog.open).toBe(true);
  });

  it("covers modal defensive and fallback focus paths", async () => {
    await createComponentDom(html`
      <button id="open">Open</button>
      <dialog id="modal"><button id="field">Field</button></dialog>
      <dialog id="plain"></dialog>
      <div id="not-modal"></div>
    `);
    const { document, KeyboardEvent, LegacyCss } = dom.window;
    const opener = document.getElementById("open");
    const modal = document.getElementById("modal");
    const field = document.getElementById("field");
    const plain = document.getElementById("plain");

    expect(LegacyCss.modal.open(document.getElementById("not-modal"))).toBeNull();
    expect(LegacyCss.modal.open({ 0: document.getElementById("not-modal"), jquery: "test" })).toBeNull();

    opener.focus();
    let fieldFallback = false;
    field.focus = vi.fn((options) => {
      if (options && !fieldFallback) {
        fieldFallback = true;
        throw new Error("focus options unsupported");
      }
    });

    let openerFallback = false;
    opener.focus = vi.fn((options) => {
      if (options && !openerFallback) {
        openerFallback = true;
        throw new Error("focus options unsupported");
      }
    });

    LegacyCss.modal.open(modal);
    expect(field.focus).toHaveBeenCalledTimes(2);
    LegacyCss.modal.close(modal);
    expect(opener.focus).toHaveBeenCalledTimes(2);

    plain.focus = vi.fn((options) => {
      if (options) {
        throw new Error("focus options unsupported");
      }
    });

    LegacyCss.modal.open(plain);
    expect(plain.focus).toHaveBeenCalledTimes(2);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(plain.open).toBe(false);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

    nativeOpenWithoutFallback(document, LegacyCss);
  });
});



function nativeOpenWithoutFallback(document, LegacyCss) {
  const dialog = document.createElement("dialog");

  dialog.showModal = function () {
    this.setAttribute("open", "");
  };
  document.body.append(dialog);
  LegacyCss.modal.open(dialog);
  document.dispatchEvent(new document.defaultView.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  LegacyCss.modal.close(dialog);
}
