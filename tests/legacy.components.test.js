import { afterEach, describe, expect, it, vi } from "vitest";
import { closeDom, createLegacyDom, nextFrame } from "./helpers/legacy.js";

let dom;

afterEach(() => {
  vi.restoreAllMocks();

  if (dom) {
    closeDom(dom);
    dom = null;
  }
});

function html(strings, ...values) {
  return strings.reduce((result, string, index) => result + string + (values[index] || ""), "");
}

function dispatch(target, type, options = {}) {
  const event = new target.ownerDocument.defaultView.Event(type, {
    bubbles: true,
    cancelable: true,
  });

  Object.entries(options).forEach(([key, value]) => {
    Object.defineProperty(event, key, { value });
  });

  target.dispatchEvent(event);

  return event;
}

describe("LegacyCss.theme", () => {
  it("sets, reads, normalizes, and stores the global theme", async () => {
    dom = await createLegacyDom();
    const { document, LegacyCss, localStorage } = dom.window;

    expect(LegacyCss.theme.get()).toBe("light");
    expect(LegacyCss.theme.set("dark")).toBe("dark");
    expect(document.documentElement.dataset.legacyTheme).toBe("dark");
    expect(localStorage.getItem("legacy.css.theme")).toBe("dark");
    expect(LegacyCss.theme.get()).toBe("dark");

    expect(LegacyCss.theme.apply("unknown")).toBe("light");
    expect(document.documentElement.dataset.legacyTheme).toBe("light");
  });

  it("applies a stored theme during startup", async () => {
    dom = await createLegacyDom("", {
      beforeEval(window) {
        window.localStorage.setItem("legacy.css.theme", "dark");
      },
    });

    expect(dom.window.document.documentElement.dataset.legacyTheme).toBe("dark");
    expect(dom.window.LegacyCss.theme.get()).toBe("dark");
  });

  it("registers a jQuery theme bridge", async () => {
    dom = await createLegacyDom("", {
      beforeEval(window) {
        const jQuery = function () {
          return { each: () => undefined };
        };

        jQuery.fn = {};
        window.jQuery = jQuery;
      },
    });
    const { document, jQuery } = dom.window;

    expect(jQuery.theme()).toBe("light");
    expect(jQuery.theme("dark")).toBe("dark");
    expect(document.documentElement.dataset.legacyTheme).toBe("dark");
    expect(jQuery.theme()).toBe("dark");
  });
});

describe("LegacyCss.modal", () => {
  it("opens, toggles, closes, and restores focus with fallback dialog behavior", async () => {
    dom = await createLegacyDom(html`
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
    dom = await createLegacyDom(html`
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
    dom = await createLegacyDom(html`
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
    dom = await createLegacyDom("<dialog id=\"modal\"></dialog>", {
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
    dom = await createLegacyDom(html`
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

describe("LegacyCss.toast", () => {
  it("renders toasts, dispatches events, and clears them", async () => {
    dom = await createLegacyDom("<div id=\"target\"></div>");
    const { document, LegacyCss } = dom.window;
    const events = [];
    document.addEventListener("toast:show", (event) => events.push(event.type));
    document.addEventListener("toast:close", (event) => events.push(event.type));

    const toast = LegacyCss.toast.show({
      title: "Saved",
      message: "The request was updated.",
      type: "success",
      container: "#target",
      duration: 0,
    });

    expect(toast).toBeTruthy();
    expect(toast.classList.contains("toast-success")).toBe(true);
    expect(toast.getAttribute("role")).toBe("status");
    expect(toast.querySelector(".toast-title").textContent).toBe("Saved");
    expect(toast.textContent).toContain("The request was updated.");
    expect(events).toEqual(["toast:show"]);

    const cleared = LegacyCss.toast.clear("#target");

    expect(cleared).toHaveLength(1);
    expect(document.querySelector(".toast")).toBeNull();
    expect(events).toEqual(["toast:show", "toast:close"]);
  });

  it("creates positioned regions and auto-dismisses with timers", async () => {
    dom = await createLegacyDom();
    const { document, LegacyCss } = dom.window;
    const timeoutSpy = vi.spyOn(dom.window, "setTimeout").mockImplementation((callback) => {
      callback();
      return 1;
    });

    const toast = LegacyCss.toast.show("Queued", {
      position: "top-right",
      type: "danger",
    });

    expect(timeoutSpy).toHaveBeenCalled();
    expect(toast.isConnected).toBe(false);
    expect(document.querySelector("[data-toast-region]").dataset.position).toBe("top-right");
    expect(toast.getAttribute("role")).toBe("alert");
  });

  it("handles node messages, custom dismiss buttons, timers, and invalid targets", async () => {
    dom = await createLegacyDom(html`
      <div id="target"></div>
      <section id="existing" class="toast">Existing</section>
    `);
    const { document, LegacyCss } = dom.window;
    const clearTimeoutSpy = vi.spyOn(dom.window, "clearTimeout");
    const message = document.createElement("span");

    message.textContent = "Node message";
    const toast = LegacyCss.toast.show(message, {
      closeLabel: "Dismiss",
      closeText: "Dismiss",
      container: document.getElementById("target"),
      duration: 100,
      type: "unknown",
    });

    expect(toast.classList.contains("toast-unknown")).toBe(false);
    expect(toast.querySelector(".toast-body span")).toBe(message);
    expect(toast.querySelector(".toast-close").getAttribute("aria-label")).toBe("Dismiss");

    toast.querySelector(".toast-close").click();
    expect(clearTimeoutSpy).toHaveBeenCalled();
    expect(toast.isConnected).toBe(false);

    expect(LegacyCss.toast.close()).toBeNull();
    expect(LegacyCss.toast.close("#missing")).toBeNull();
    expect(LegacyCss.toast.close(document.getElementById("target"))).toBeNull();
    expect(LegacyCss.toast.clear("#missing")).toEqual([]);
    expect(LegacyCss.toast.show("Missing", { container: "#missing" })).toBeNull();
  });

  it("handles jQuery-like messages, existing regions, and non-dismissible toasts", async () => {
    dom = await createLegacyDom(html`
      <div class="toast-region" data-position="bottom-right"></div>
      <div id="container"></div>
      <span id="message">Wrapped</span>
    `);
    const { document, LegacyCss } = dom.window;
    const message = document.getElementById("message");

    const toast = LegacyCss.toast.show({ 0: message, jquery: "test" }, {
      dismissible: false,
      duration: 0,
      type: "muted",
    });
    const contained = LegacyCss.toast.show("Contained", {
      container: { 0: document.getElementById("container"), jquery: "test" },
      duration: 0,
    });

    expect(document.querySelectorAll(".toast-region")).toHaveLength(1);
    expect(toast.querySelector(".toast-close")).toBeNull();
    expect(toast.querySelector(".toast-body span")).toBe(message);
    expect(toast.classList.contains("toast-muted")).toBe(true);
    expect(document.getElementById("container").contains(contained)).toBe(true);
  });

  it("covers toast resolver fallback branches", async () => {
    dom = await createLegacyDom(html`
      <div id="target"></div>
      <section id="toast" data-toast>Toast</section>
    `);
    const { document, LegacyCss } = dom.window;
    const toast = document.getElementById("toast");

    expect(LegacyCss.toast.close({ 0: toast, jquery: "test" })).toBe(toast);
    expect(LegacyCss.toast.clear({})).toEqual([]);
    expect(LegacyCss.toast.show("Missing", { container: {} })).toBeNull();
    expect(LegacyCss.toast.show(null, { container: "#target", duration: 0 }).textContent).toContain("Close");
  });
});

describe("LegacyCss.popover", () => {
  it("wires ARIA and opens only one popover at a time", async () => {
    dom = await createLegacyDom(html`
      <button id="one" data-popover-target="#first">One</button>
      <div id="first" class="popover" hidden>First</div>
      <button id="two" data-popover-target="#second">Two</button>
      <div id="second" class="popover" hidden>Second</div>
    `);
    const { document, LegacyCss } = dom.window;
    const one = document.getElementById("one");
    const first = document.getElementById("first");
    const second = document.getElementById("second");

    LegacyCss.popover.setup(one);
    expect(one.getAttribute("aria-haspopup")).toBe("dialog");
    expect(one.getAttribute("aria-expanded")).toBe("false");
    expect(first.getAttribute("role")).toBe("dialog");

    LegacyCss.popover.open(one);
    expect(first.hidden).toBe(false);
    expect(one.getAttribute("aria-expanded")).toBe("true");

    LegacyCss.popover.open("#two");
    expect(first.hidden).toBe(true);
    expect(second.hidden).toBe(false);
  });

  it("toggles from clicks and closes on outside click or Escape", async () => {
    dom = await createLegacyDom(html`
      <button id="trigger" data-popover-target="#menu">Menu</button>
      <div id="menu" class="popover" hidden>Menu</div>
      <button id="outside">Outside</button>
    `);
    const { document, LegacyCss, KeyboardEvent } = dom.window;
    const trigger = document.getElementById("trigger");
    const menu = document.getElementById("menu");

    LegacyCss.popover.setup(trigger);
    trigger.click();
    expect(menu.hidden).toBe(false);

    document.getElementById("outside").click();
    expect(menu.hidden).toBe(true);

    LegacyCss.popover.open(trigger);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(menu.hidden).toBe(true);
  });

  it("handles placements, ids, popover targets, and reposition events", async () => {
    dom = await createLegacyDom(html`
      <button id="top" data-popover-target="#top-menu" data-popover-placement="top">Top</button>
      <div id="top-menu" hidden>Top</div>
      <button id="right" data-popover="right-menu" data-popover-placement="right">Right</button>
      <div id="right-menu" hidden>Right</div>
      <button id="left" data-popover="left-menu" data-popover-placement="left">Left</button>
      <div id="left-menu" class="popover" hidden>Left</div>
      <button id="missing" data-popover-target="#missing-menu">Missing</button>
    `);
    const { document, Event, LegacyCss } = dom.window;

    ["top", "right", "left"].forEach((id) => {
      const trigger = document.getElementById(id);
      const popover = document.getElementById(id + "-menu");

      trigger.getBoundingClientRect = () => ({
        bottom: 60,
        height: 20,
        left: 40,
        right: 100,
        top: 40,
        width: 60,
      });
      popover.getBoundingClientRect = () => ({
        bottom: 0,
        height: 20,
        left: 0,
        right: 0,
        top: 0,
        width: 30,
      });
    });

    LegacyCss.popover.setup("#missing");
    expect(LegacyCss.popover.open("#missing")).toBeNull();

    LegacyCss.popover.open("#top");
    expect(document.getElementById("top-menu").style.top).toBe("16px");
    dom.window.dispatchEvent(new Event("resize"));
    expect(document.getElementById("top-menu").style.top).toBe("16px");

    LegacyCss.popover.open("#right");
    expect(document.getElementById("right-menu").style.left).toBe("104px");

    LegacyCss.popover.open("#left");
    expect(document.getElementById("left-menu").style.left).toBe("8px");
    expect(LegacyCss.popover.close(document.getElementById("left-menu"))).toBe(document.getElementById("left-menu"));
    expect(document.getElementById("left-menu").hidden).toBe(true);

    expect(LegacyCss.popover.close(null)).toBeNull();
    expect(LegacyCss.popover.toggle("#missing")).toBeNull();
  });

  it("ignores irrelevant popover key and click events", async () => {
    dom = await createLegacyDom(html`
      <button id="trigger" data-popover-target="#menu">Menu</button>
      <div id="menu" hidden><button id="inside">Inside</button></div>
    `);
    const { document, KeyboardEvent, LegacyCss } = dom.window;
    const trigger = document.getElementById("trigger");
    const menu = document.getElementById("menu");

    LegacyCss.popover.setup(trigger);
    trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(menu.hidden).toBe(true);

    trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(menu.hidden).toBe(true);

    LegacyCss.popover.open(trigger);
    document.dispatchEvent(new Event("click"));
    expect(menu.hidden).toBe(false);
    document.getElementById("inside").click();
    expect(menu.hidden).toBe(false);

    trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(menu.hidden).toBe(true);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    dom.window.dispatchEvent(new Event("resize"));
  });

  it("covers popover resolver and closed-state branches", async () => {
    dom = await createLegacyDom(html`
      <button id="empty" data-popover="">Empty</button>
      <button id="trigger" data-popover-target="#menu">Menu</button>
      <div id="menu" hidden><span id="child">Child</span></div>
      <div id="content" data-popover-content>Content</div>
      <div id="plain"></div>
    `);
    const { document, Event, KeyboardEvent, LegacyCss } = dom.window;

    expect(LegacyCss.popover.setup({ 0: document.getElementById("trigger"), jquery: "test" })).toBe(
      document.getElementById("trigger")
    );
    expect(LegacyCss.popover.setup("#plain")).toBeNull();
    expect(LegacyCss.popover.open("#empty")).toBeNull();
    expect(LegacyCss.popover.close("#empty")).toBeNull();
    expect(LegacyCss.popover.close("#plain")).toBeNull();

    LegacyCss.popover.open("#trigger");
    dom.window.dispatchEvent(new Event("scroll"));
    expect(document.getElementById("menu").hidden).toBe(false);
    expect(LegacyCss.popover.close(document.getElementById("child"))).toBeNull();
    expect(LegacyCss.popover.close(document.getElementById("content"))).toBe(document.getElementById("content"));

    document.getElementById("trigger").dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  });
});

describe("LegacyCss.tabs", () => {
  it("selects the initial tab and supports clicks, indexes, and selectors", async () => {
    dom = await createLegacyDom(html`
      <div id="tabs" data-tabs>
        <div role="tablist">
          <button id="tab-a" role="tab" aria-selected="true" aria-controls="panel-a">A</button>
          <button id="tab-b" role="tab" aria-selected="false" aria-controls="panel-b">B</button>
        </div>
        <section id="panel-a" role="tabpanel">A panel</section>
        <section id="panel-b" role="tabpanel" hidden>B panel</section>
      </div>
    `);
    const { document, LegacyCss } = dom.window;

    LegacyCss.tabs.setup("#tabs");
    expect(document.getElementById("panel-a").hidden).toBe(false);
    expect(document.getElementById("panel-b").hidden).toBe(true);

    document.getElementById("tab-b").click();
    expect(document.getElementById("tab-b").getAttribute("aria-selected")).toBe("true");
    expect(document.getElementById("panel-a").hidden).toBe(true);

    LegacyCss.tabs.select("#tabs", 0);
    expect(document.getElementById("tab-a").getAttribute("aria-selected")).toBe("true");

    LegacyCss.tabs.select("#tabs", "#tab-b");
    expect(document.getElementById("tab-b").getAttribute("tabindex")).toBe("0");
  });

  it("supports keyboard navigation", async () => {
    dom = await createLegacyDom(html`
      <div id="tabs" data-tabs>
        <div role="tablist">
          <button id="tab-a" role="tab" aria-controls="panel-a">A</button>
          <button id="tab-b" role="tab" aria-controls="panel-b">B</button>
        </div>
        <section id="panel-a" role="tabpanel">A panel</section>
        <section id="panel-b" role="tabpanel">B panel</section>
      </div>
    `);
    const { document, KeyboardEvent, LegacyCss } = dom.window;
    const first = document.getElementById("tab-a");

    LegacyCss.tabs.setup("#tabs");
    first.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));

    expect(document.activeElement).toBe(document.getElementById("tab-b"));
    expect(document.getElementById("panel-b").hidden).toBe(false);
  });

  it("handles keyboard variants, missing panels, setup repeats, and invalid selectors", async () => {
    dom = await createLegacyDom(html`
      <div id="tabs" data-tabs>
        <div role="tablist">
          <button id="tab-a" role="tab" aria-controls="panel:a">A</button>
          <button id="tab-b" role="tab">B</button>
          <button id="tab-c" role="tab" aria-controls="panel-c">C</button>
        </div>
        <section id="panel:a" role="tabpanel">A panel</section>
        <section id="panel-c" role="tabpanel" tabindex="-1">C panel</section>
      </div>
      <div id="empty" data-tabs></div>
    `);
    const { document, KeyboardEvent, LegacyCss } = dom.window;
    const tabs = document.getElementById("tabs");
    const first = document.getElementById("tab-a");

    dom.window.CSS.escape = () => {
      throw new Error("escape failed");
    };

    expect(LegacyCss.tabs.setup(null)).toBeNull();
    expect(LegacyCss.tabs.setup("#empty")).toBe(document.getElementById("empty"));
    expect(LegacyCss.tabs.setup(tabs)).toBe(tabs);
    expect(LegacyCss.tabs.setup(first)).toBe(tabs);
    expect(LegacyCss.tabs.setup({ 0: tabs, jquery: "test" })).toBe(tabs);

    expect(document.getElementById("panel:a").hidden).toBe(false);
    expect(document.getElementById("panel-c").getAttribute("tabindex")).toBe("-1");

    expect(LegacyCss.tabs.select("#tabs", 99)).toBeNull();
    expect(LegacyCss.tabs.select("#missing", 0)).toBeNull();
    expect(LegacyCss.tabs.select("#tabs", "#missing")).toBeNull();

    first.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    expect(document.activeElement).toBe(document.getElementById("tab-c"));

    document.getElementById("tab-c").dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    expect(document.activeElement).toBe(first);

    first.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    expect(document.activeElement).toBe(document.getElementById("tab-c"));

    document.getElementById("tab-c").dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
    expect(document.activeElement).toBe(document.getElementById("tab-b"));

    document.getElementById("tab-b").dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(document.activeElement).toBe(document.getElementById("tab-b"));
  });

  it("covers tab resolver fallback branches", async () => {
    dom = await createLegacyDom(html`
      <div id="plain"></div>
      <div id="tabs" data-tabs>
        <div role="tablist"><span id="not-tab">Nope</span></div>
      </div>
    `);
    const { document, KeyboardEvent, LegacyCss } = dom.window;

    expect(LegacyCss.tabs.setup({ 0: document.getElementById("tabs"), jquery: "test" })).toBe(
      document.getElementById("tabs")
    );
    expect(LegacyCss.tabs.setup({})).toBeNull();
    expect(LegacyCss.tabs.select(document.getElementById("plain"), 0)).toBeNull();

    document.getElementById("tabs").removeAttribute("data-tabs");
    document.getElementById("not-tab").dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(document.activeElement).not.toBe(document.getElementById("not-tab"));
  });
});

describe("LegacyCss.dragdrop", () => {
  it("makes items draggable and calls callbacks with the move payload", async () => {
    const onDrag = vi.fn();
    const onDrop = vi.fn();
    const onChangeColumn = vi.fn();

    dom = await createLegacyDom(html`
      <div id="board" data-dragdrop>
        <section id="todo" data-dragdrop-column data-column="todo">
          <article id="request-1" data-dragdrop-item data-id="request-1">Request 1</article>
        </section>
        <section id="done" data-dragdrop-column data-column="done"></section>
      </div>
    `);
    const { document, LegacyCss } = dom.window;
    const board = document.getElementById("board");
    const item = document.getElementById("request-1");
    const done = document.getElementById("done");
    const dataTransfer = {
      setData: vi.fn(),
    };

    LegacyCss.dragdrop.setup(board, { onDrag, onDrop, onChangeColumn });

    expect(item.getAttribute("draggable")).toBe("true");

    dispatch(item, "dragstart", { dataTransfer });
    dispatch(done, "dragover", { clientY: 0, dataTransfer });
    dispatch(done, "drop", { dataTransfer });

    expect(done.contains(item)).toBe(true);
    expect(onDrag).toHaveBeenCalledWith(expect.objectContaining({ fromColumnId: "todo" }));
    expect(onDrop).toHaveBeenCalledWith(
      expect.objectContaining({ fromColumnId: "todo", toColumnId: "done" })
    );
    expect(onChangeColumn).toHaveBeenCalledTimes(1);
    expect(item.classList.contains("is-dragging")).toBe(false);
  });

  it("handles reorder, repeated setup, invalid targets, and drag cancellation", async () => {
    const onDrop = vi.fn();
    const onChangeColumn = vi.fn();

    dom = await createLegacyDom(html`
      <button id="outside">Outside</button>
      <div id="board" data-dragdrop>
        <section id="todo" data-dragdrop-column>
          <article id="first" data-dragdrop-item draggable="true">First</article>
          <article id="second" data-dragdrop-item>Second</article>
        </section>
      </div>
      <div id="not-board"><article id="loose" data-dragdrop-item>Loose</article></div>
    `);
    const { document, LegacyCss } = dom.window;
    const board = document.getElementById("board");
    const first = document.getElementById("first");
    const second = document.getElementById("second");

    expect(LegacyCss.dragdrop.setup(null)).toBeNull();
    expect(LegacyCss.dragdrop.setup("#missing")).toBeNull();
    expect(LegacyCss.dragdrop.setup({ 0: board, jquery: "test" }, { onDrop })).toBe(board);
    expect(LegacyCss.dragdrop.setup(second, { onChangeColumn })).toBe(board);
    expect(first.getAttribute("draggable")).toBe("true");

    first.getBoundingClientRect = () => ({ top: 20, height: 20 });
    dispatch(second, "dragstart");
    dispatch(document.getElementById("outside"), "dragover", { clientY: 0 });
    dispatch(first, "dragover", { clientY: 25 });
    dispatch(first, "drop");
    expect(onDrop).toHaveBeenCalledTimes(1);
    expect(onChangeColumn).not.toHaveBeenCalled();
    expect(document.getElementById("todo").firstElementChild).toBe(second);

    dispatch(first, "dragstart");
    dispatch(board, "dragend");
    expect(first.classList.contains("is-dragging")).toBe(false);

    dispatch(document.getElementById("outside"), "dragstart");
    dispatch(document.getElementById("loose"), "dragstart");
  });

  it("covers dragdrop invalid event states and column cleanup", async () => {
    dom = await createLegacyDom(html`
      <div id="board" data-dragdrop>
        <article id="orphan" data-dragdrop-item>Orphan</article>
        <section id="first-column" data-dragdrop-column class="is-drag-over">
          <article id="first" data-dragdrop-item>First</article>
        </section>
        <section id="second-column" data-dragdrop-column>
          <article id="second" data-dragdrop-item>Second</article>
        </section>
      </div>
      <section id="outside-column" data-dragdrop-column></section>
    `);
    const { document, LegacyCss } = dom.window;
    const board = document.getElementById("board");
    const first = document.getElementById("first");
    const secondColumn = document.getElementById("second-column");

    LegacyCss.dragdrop.setup(board);

    expect(LegacyCss.dragdrop.setup({})).toBeNull();
    dispatch(board, "dragstart");
    dispatch(board, "dragover");
    dispatch(board, "drop");
    dispatch(document.getElementById("orphan"), "dragstart");

    dispatch(first, "dragstart");
    dispatch(board, "dragover", { target: document.getElementById("outside-column") });
    dispatch(board, "drop", { target: document.getElementById("outside-column") });
    expect(first.classList.contains("is-dragging")).toBe(true);

    dispatch(secondColumn, "dragover", { clientY: 999 });
    expect(document.getElementById("first-column").classList.contains("is-drag-over")).toBe(false);
    dispatch(secondColumn, "drop");
    expect(first.classList.contains("is-dragging")).toBe(false);
  });
});

describe("LegacyCss.multiselect", () => {
  it("creates a custom control and keeps it synchronized with the select", async () => {
    dom = await createLegacyDom(html`
      <label for="reviewers">Reviewers</label>
      <select id="reviewers" multiple data-placeholder="Choose reviewers">
        <option value="ana">Ana</option>
        <option value="bruno" selected>Bruno</option>
        <option value="carla" disabled>Carla</option>
      </select>
    `);
    const { document, LegacyCss } = dom.window;
    const select = document.getElementById("reviewers");
    const changes = vi.fn();
    select.addEventListener("change", changes);

    LegacyCss.multiselect.setup(select);
    const root = document.querySelector(".multiselect");
    const toggle = root.querySelector(".multiselect-toggle");
    const options = root.querySelectorAll(".multiselect-option");

    expect(select.classList.contains("multiselect-source")).toBe(true);
    expect(toggle.getAttribute("aria-label")).toBe("Reviewers");
    expect(root.querySelector(".multiselect-label").textContent).toBe("Bruno");

    LegacyCss.multiselect.open(root);
    expect(root.classList.contains("is-open")).toBe(true);

    options[0].click();
    expect(select.options[0].selected).toBe(true);
    expect(root.querySelector(".multiselect-label").textContent).toBe("Ana, Bruno");
    expect(changes).toHaveBeenCalledTimes(1);

    options[2].click();
    expect(select.options[2].selected).toBe(false);
  });

  it("supports keyboard open, movement, option toggle, and Escape close", async () => {
    dom = await createLegacyDom(html`
      <select id="reviewers" multiple>
        <option value="ana">Ana</option>
        <option value="bruno">Bruno</option>
      </select>
    `);
    const { document, KeyboardEvent, LegacyCss } = dom.window;
    const select = document.getElementById("reviewers");

    LegacyCss.multiselect.setup(select);
    const root = document.querySelector(".multiselect");
    const toggle = root.querySelector(".multiselect-toggle");
    const options = root.querySelectorAll(".multiselect-option");

    toggle.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    expect(root.classList.contains("is-open")).toBe(true);
    expect(document.activeElement).toBe(options[0]);

    options[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    expect(document.activeElement).toBe(options[1]);

    options[1].dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(select.options[1].selected).toBe(true);

    root.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(root.classList.contains("is-open")).toBe(false);
    expect(document.activeElement).toBe(toggle);
  });

  it("handles empty selects, disabled state, form reset, and outside clicks", async () => {
    dom = await createLegacyDom(html`
      <button id="outside">Outside</button>
      <form id="form">
        <select id="empty" multiple></select>
        <select id="roles" name="roles" multiple>
          <option value="admin" selected>Admin</option>
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
        </select>
        <select id="teams" multiple disabled>
          <option value="ops">Ops</option>
        </select>
      </form>
    `);
    const { document, LegacyCss } = dom.window;
    const empty = document.getElementById("empty");
    const roles = document.getElementById("roles");
    const teams = document.getElementById("teams");

    LegacyCss.multiselect.setup(empty);
    LegacyCss.multiselect.setup(roles);
    LegacyCss.multiselect.setup(teams);

    expect(empty.nextElementSibling.querySelector(".multiselect-empty").textContent).toBe("No options");
    expect(roles.nextElementSibling.querySelector(".multiselect-label").textContent).toBe("Admin");
    expect(roles.nextElementSibling.querySelector(".multiselect-toggle").id).toBe("roles-toggle");
    expect(teams.nextElementSibling.querySelector(".multiselect-toggle").disabled).toBe(true);

    roles.options[1].selected = true;
    roles.options[2].selected = true;
    roles.dispatchEvent(new Event("change", { bubbles: true }));
    expect(roles.nextElementSibling.querySelector(".multiselect-label").textContent).toBe("3 selected");

    LegacyCss.multiselect.open(roles);
    expect(roles.nextElementSibling.classList.contains("is-open")).toBe(true);
    document.getElementById("outside").click();
    expect(roles.nextElementSibling.classList.contains("is-open")).toBe(false);

    roles.options[1].selected = true;
    roles.options[2].selected = true;
    document.getElementById("form").reset();
    await nextFrame(dom.window);
    expect(roles.nextElementSibling.querySelector(".multiselect-label").textContent).toBe("Admin");

    LegacyCss.multiselect.open(teams);
    expect(teams.nextElementSibling.classList.contains("is-open")).toBe(false);
  });

  it("handles alternate resolution, labels, keyboard variants, and no-op targets", async () => {
    dom = await createLegacyDom(html`
      <button id="outside">Outside</button>
      <select id="labelled" multiple aria-label="Named">
        <option value="a">A</option>
        <option value="b" disabled>B</option>
        <option value="c">C</option>
      </select>
      <select name="generated" multiple>
        <option value="x">X</option>
      </select>
      <select id="single"><option>Single</option></select>
    `);
    const { document, KeyboardEvent, LegacyCss } = dom.window;
    const labelled = document.getElementById("labelled");
    const generated = document.querySelector('[name="generated"]');
    const single = document.getElementById("single");

    expect(LegacyCss.multiselect.setup(null)).toBeNull();
    expect(LegacyCss.multiselect.setup({})).toBeNull();
    expect(LegacyCss.multiselect.setup(single)).toBeNull();
    expect(LegacyCss.multiselect.open(null)).toBeNull();
    expect(LegacyCss.multiselect.close(null)).toBeNull();
    expect(LegacyCss.multiselect.toggle(null)).toBeNull();

    LegacyCss.multiselect.setup({ 0: labelled, jquery: "test" });
    LegacyCss.multiselect.setup(generated);

    const root = labelled.nextElementSibling;
    const toggle = root.querySelector(".multiselect-toggle");
    const options = root.querySelectorAll(".multiselect-option");

    expect(toggle.getAttribute("aria-label")).toBe("Named");
    expect(generated.nextElementSibling.querySelector(".multiselect-toggle").id).toBe("generated-toggle");
    expect(LegacyCss.multiselect.setup(root)).toBe(labelled);
    expect(LegacyCss.multiselect.setup(options[0])).toBe(labelled);
    expect(LegacyCss.multiselect.open(document.getElementById("outside"))).toBeNull();
    expect(LegacyCss.multiselect.close(single)).toBeNull();

    toggle.click();
    expect(root.classList.contains("is-open")).toBe(true);
    toggle.click();
    expect(root.classList.contains("is-open")).toBe(false);

    toggle.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(document.activeElement).toBe(options[0]);
    options[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
    expect(document.activeElement).toBe(options[2]);
    options[2].dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    expect(document.activeElement).toBe(options[0]);
    options[0].dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    expect(document.activeElement).toBe(options[2]);
    options[2].dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    expect(labelled.options[2].selected).toBe(true);

    options[1].click();
    dispatch(options[1], "click");
    expect(labelled.options[1].selected).toBe(false);

    labelled.disabled = true;
    labelled.dispatchEvent(new Event("change", { bubbles: true }));
    expect(toggle.disabled).toBe(true);
    options[0].dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(labelled.options[0].selected).toBe(false);
  });

  it("falls back when multiselect label lookup fails", async () => {
    dom = await createLegacyDom("<select id=\"bad:id\" multiple><option>A</option></select>");
    const { document, LegacyCss } = dom.window;

    dom.window.CSS.escape = () => {
      throw new Error("escape failed");
    };

    LegacyCss.multiselect.setup("#bad\\:id");
    expect(document.querySelector(".multiselect-toggle").hasAttribute("aria-label")).toBe(false);
  });

  it("covers multiselect no-state and invalid event branches", async () => {
    dom = await createLegacyDom(html`
      <select id="plain" multiple><option>A</option></select>
      <select id="other" multiple><option>B</option></select>
      <div class="multiselect" id="broken"><button class="multiselect-toggle">Broken</button></div>
    `);
    const { document, KeyboardEvent, LegacyCss } = dom.window;
    const plain = document.getElementById("plain");
    const other = document.getElementById("other");

    expect(LegacyCss.multiselect.close(plain)).toBe(plain);
    expect(LegacyCss.multiselect.toggle(plain)).toBe(plain);
    expect(LegacyCss.multiselect.open(document.getElementById("broken"))).toBe(other);

    LegacyCss.multiselect.setup(plain);
    LegacyCss.multiselect.setup(other);
    const root = plain.nextElementSibling;
    const toggle = root.querySelector(".multiselect-toggle");
    const option = root.querySelector(".multiselect-option");

    LegacyCss.multiselect.open(plain);
    LegacyCss.multiselect.open(other);
    expect(root.classList.contains("is-open")).toBe(false);

    plain.dispatchEvent(new Event("change", { bubbles: true }));
    root.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    dispatch(root, "keydown", { target: document });
    toggle.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    option.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    document.dispatchEvent(new Event("click"));
  });
});

describe("LegacyCss.pagination", () => {
  it("renders local data, navigates pages, and changes page size", async () => {
    dom = await createLegacyDom(html`
      <table><tbody id="rows"></tbody></table>
      <nav id="pages" class="pagination"></nav>
    `);
    const { document, LegacyCss } = dom.window;
    const data = [
      { id: "A", status: "Open" },
      { id: "B", status: "Closed" },
      { id: "C", status: "Pending" },
    ];

    LegacyCss.pagination.setup("#pages", {
      data,
      target: "#rows",
      pageSize: 2,
      pageSizes: [1, 2],
    });
    await nextFrame(dom.window);

    expect(document.querySelector("#rows").textContent).toContain("A");
    expect(document.querySelector("#rows").textContent).not.toContain("Pending");
    expect(document.querySelector(".pagination-summary").textContent).toBe("Page 1 of 2 (3 items)");

    LegacyCss.pagination.goTo("#pages", 2);
    await nextFrame(dom.window);
    expect(document.querySelector("#rows").textContent).toContain("C");

    document.querySelector("[data-pagination-size]").value = "1";
    dispatch(document.querySelector("[data-pagination-size]"), "change");
    await nextFrame(dom.window);
    expect(document.querySelector(".pagination-summary").textContent).toBe("Page 1 of 3 (3 items)");
  });

  it("supports custom async loading, renderers, refresh, and error events", async () => {
    dom = await createLegacyDom(html`
      <ul id="rows"></ul>
      <nav id="pages" class="pagination"></nav>
    `);
    const { document, LegacyCss } = dom.window;
    const error = new Error("failed");
    const load = vi
      .fn()
      .mockResolvedValueOnce({ items: ["A", "B"], total: 3 })
      .mockRejectedValueOnce(error);
    const errors = [];

    document.getElementById("pages").addEventListener("pagination:error", (event) => {
      errors.push(event.detail.error);
    });

    LegacyCss.pagination.setup("#pages", {
      load,
      target: "#rows",
      pageSize: 2,
      pageSizes: [2],
      renderItem(item) {
        const row = document.createElement("li");
        row.textContent = item;
        return row;
      },
    });
    await nextFrame(dom.window);

    expect(load).toHaveBeenCalledWith({ page: 1, pageSize: 2, offset: 0 });
    expect(document.querySelectorAll("#rows li")).toHaveLength(2);

    LegacyCss.pagination.refresh("#pages");
    await nextFrame(dom.window);
    await nextFrame(dom.window);

    expect(errors).toEqual([error]);
    expect(document.querySelector(".pagination-summary").textContent).toBe("Page 1 of 2 (3 items)");
  });

  it("supports attribute configuration, click actions, ellipses, and string renderers", async () => {
    dom = await createLegacyDom(html`
      <ul id="rows"></ul>
      <nav
        id="pages"
        data-pagination
        data-target="#rows"
        data-page="6"
        data-page-size="1"
        data-page-sizes="1,2,bad,2"
        data-max-pages="5"
      ></nav>
    `);
    const { document, LegacyCss } = dom.window;
    const changes = [];
    const data = Array.from({ length: 10 }, (_, index) => "Item " + (index + 1));

    document.getElementById("pages").addEventListener("pagination:change", (event) => {
      changes.push(event.detail.page);
    });

    LegacyCss.pagination.setup("#pages", {
      data,
      renderItem(item) {
        return "<li>" + item + "</li>";
      },
    });
    await nextFrame(dom.window);

    expect(document.querySelector("#rows").textContent).toContain("Item 6");
    expect(document.querySelectorAll(".pagination-ellipsis")).toHaveLength(2);

    document.querySelector('[data-pagination-action="previous"]').click();
    await nextFrame(dom.window);
    expect(document.querySelector("#rows").textContent).toContain("Item 5");

    document.querySelector('[data-pagination-action="next"]').click();
    await nextFrame(dom.window);
    expect(document.querySelector("#rows").textContent).toContain("Item 6");

    document.querySelector('[data-pagination-page="10"]').click();
    await nextFrame(dom.window);
    expect(document.querySelector("#rows").textContent).toContain("Item 10");
    expect(changes).toContain(10);

    LegacyCss.pagination.pageSize("#pages", 2);
    await nextFrame(dom.window);
    expect(document.querySelector(".pagination-summary").textContent).toBe("Page 1 of 5 (10 items)");
  });

  it("handles array load results and initial synchronous errors", async () => {
    dom = await createLegacyDom(html`
      <nav id="pages" class="pagination"></nav>
      <nav id="broken" class="pagination"></nav>
    `);
    const { document, LegacyCss } = dom.window;
    const error = new Error("sync failure");
    const errors = [];

    LegacyCss.pagination.setup("#pages", {
      pageSize: 2,
      load() {
        return ["A", "B", "C"];
      },
    });
    await nextFrame(dom.window);

    expect(document.querySelector("#pages .pagination-summary").textContent).toBe("Page 1 of 2 (3 items)");

    document.getElementById("broken").addEventListener("pagination:error", (event) => {
      errors.push(event.detail.error);
    });
    LegacyCss.pagination.setup("#broken", {
      load() {
        throw error;
      },
    });

    expect(document.getElementById("broken").getAttribute("aria-busy")).toBe("false");
    expect(errors).toEqual([error]);
  });

  it("handles invalid targets, missing render targets, fragment/null renderers, and setup updates", async () => {
    dom = await createLegacyDom(html`
      <ul id="rows"></ul>
      <nav id="pages" class="pagination" data-page-size-options="bad,0"></nav>
      <nav id="missing-target" class="pagination" data-target="#missing"></nav>
      <button id="inside"><span id="nested">Nested</span></button>
    `);
    const { document, LegacyCss } = dom.window;

    expect(LegacyCss.pagination.setup(null)).toBeNull();
    expect(LegacyCss.pagination.goTo(null, 1)).toBeNull();
    expect(LegacyCss.pagination.pageSize(null, 1)).toBeNull();
    expect(LegacyCss.pagination.refresh(null)).toBeNull();

    LegacyCss.pagination.setup("#missing-target", { data: ["A"], pageSize: 1 });
    await nextFrame(dom.window);
    expect(document.querySelector("#missing-target .pagination-summary").textContent).toBe("Page 1 of 1 (1 items)");

    LegacyCss.pagination.setup("#pages", {
      data: ["A", "B", "C"],
      target: "#rows",
      pageSize: 2,
      renderItem(item, index) {
        if (index === 0) {
          const fragment = document.createDocumentFragment();
          const row = document.createElement("li");

          row.textContent = item;
          fragment.append(row);
          return fragment;
        }

        return null;
      },
    });
    await nextFrame(dom.window);
    expect(document.querySelector("#rows").textContent).toBe("A");

    document.querySelector("#pages [data-pagination-action=\"previous\"]").click();
    dispatch(document.querySelector("#pages [data-pagination-action=\"previous\"]"), "click");
    await nextFrame(dom.window);
    expect(document.querySelector("#pages .pagination-summary").textContent).toBe("Page 1 of 2 (3 items)");

    LegacyCss.pagination.setup("#pages", { pageSize: 1 });
    await nextFrame(dom.window);
    expect(document.querySelector("#pages .pagination-summary").textContent).toBe("Page 1 of 3 (3 items)");

    dispatch(document.getElementById("nested"), "click");
    dispatch(document.getElementById("inside"), "change");
  });

  it("ignores stale pagination responses and stale errors", async () => {
    dom = await createLegacyDom("<nav id=\"pages\" class=\"pagination\"></nav>");
    const { document, LegacyCss } = dom.window;
    const changes = [];
    const errors = [];
    let resolveFirst;
    let rejectSecond;

    document.getElementById("pages").addEventListener("pagination:change", (event) => {
      changes.push(event.detail.items);
    });
    document.getElementById("pages").addEventListener("pagination:error", (event) => {
      errors.push(event.detail.error);
    });

    LegacyCss.pagination.setup("#pages", {
      pageSize: 1,
      load() {
        return new Promise((resolve) => {
          resolveFirst = resolve;
        });
      },
    });

    LegacyCss.pagination.setup("#pages", {
      pageSize: 1,
      load() {
        return new Promise((resolve, reject) => {
          rejectSecond = reject;
        });
      },
    });

    resolveFirst({ items: ["stale"], total: 1 });
    await nextFrame(dom.window);
    expect(changes).toEqual([]);

    LegacyCss.pagination.setup("#pages", {
      pageSize: 1,
      load() {
        return { items: ["fresh"], total: 1 };
      },
    });
    rejectSecond(new Error("stale error"));
    await nextFrame(dom.window);
    await nextFrame(dom.window);

    expect(errors).toEqual([]);
    expect(changes).toEqual([["fresh"]]);
    expect(document.querySelector("#pages .pagination-summary").textContent).toBe("Page 1 of 1 (1 items)");
  });

  it("renders default primitive and null table cells", async () => {
    dom = await createLegacyDom(html`
      <table><tbody id="rows"></tbody></table>
      <nav id="pages" class="pagination"></nav>
    `);
    const { document, LegacyCss } = dom.window;

    LegacyCss.pagination.setup("#pages", {
      data: ["A", null],
      target: "#rows",
      pageSize: 2,
    });
    await nextFrame(dom.window);

    expect(document.querySelectorAll("#rows tr")).toHaveLength(2);
    expect(document.querySelector("#rows tr:first-child td").textContent).toBe("A");
    expect(document.querySelector("#rows tr:last-child td").textContent).toBe("");
  });

  it("covers pagination resolver and disabled click branches", async () => {
    dom = await createLegacyDom(html`
      <nav id="pages" class="pagination"></nav>
      <div id="plain"><button data-pagination-action="next">Next</button></div>
    `);
    const { document, LegacyCss } = dom.window;

    expect(LegacyCss.pagination.setup({ 0: document.getElementById("pages"), jquery: "test" }, { data: ["A"] })).toBe(
      document.getElementById("pages")
    );
    await nextFrame(dom.window);

    expect(LegacyCss.pagination.setup({})).toBeNull();
    expect(LegacyCss.pagination.setup(document.querySelector("#plain button"))).toBeNull();

    document.querySelector("#pages [data-pagination-action=\"previous\"]").click();
    await nextFrame(dom.window);
    expect(document.querySelector("#pages .pagination-summary").textContent).toBe("Page 1 of 1 (1 items)");

    dispatch(document.querySelector("#plain button"), "click");
  });
});

describe("jQuery bridges", () => {
  it("registers small bridge methods when jQuery is present", async () => {
    dom = await createLegacyDom(
      html`
        <dialog id="modal"></dialog>
        <div id="tabs" data-tabs>
          <div role="tablist"><button role="tab" aria-controls="panel">Tab</button></div>
          <section id="panel" role="tabpanel">Panel</section>
        </div>
      `,
      {
        beforeEval(window) {
          const jQuery = (target) => ({
            0: typeof target === "string" ? window.document.querySelector(target) : target,
            each(callback) {
              callback.call(this[0]);
              return this;
            },
            jquery: "test",
          });

          jQuery.fn = {};
          window.jQuery = jQuery;
          window.$ = jQuery;
        },
      }
    );
    const { document, jQuery } = dom.window;

    expect(typeof jQuery.fn.modal).toBe("function");
    expect(typeof jQuery.toast).toBe("function");
    expect(typeof jQuery.fn.tabs).toBe("function");
    expect(typeof jQuery.fn.popover).toBe("function");
    expect(typeof jQuery.fn.dragdrop).toBe("function");
    expect(typeof jQuery.fn.multiselect).toBe("function");
    expect(typeof jQuery.fn.pagination).toBe("function");

    jQuery.fn.modal.call(jQuery("#modal"));
    expect(document.getElementById("modal").open).toBe(true);
  });

  it("runs bridge action branches", async () => {
    dom = await createLegacyDom(
      html`
        <dialog id="modal"></dialog>
        <button id="popover-trigger" data-popover-target="#popover">Popover</button>
        <div id="popover" hidden>Popover</div>
        <select id="select" multiple><option value="a">A</option></select>
        <nav id="pages" class="pagination"></nav>
        <section id="toast" class="toast">Toast</section>
      `,
      {
        beforeEval(window) {
          const jQuery = (target) => ({
            0: typeof target === "string" ? window.document.querySelector(target) : target,
            each(callback) {
              callback.call(this[0]);
              return this;
            },
            jquery: "test",
          });

          jQuery.fn = {};
          window.jQuery = jQuery;
        },
      }
    );
    const { document, jQuery } = dom.window;

    jQuery.fn.modal.call(jQuery("#modal"), "toggle");
    expect(document.getElementById("modal").open).toBe(true);
    jQuery.fn.modal.call(jQuery("#modal"), "close");
    expect(document.getElementById("modal").open).toBe(false);

    jQuery.fn.popover.call(jQuery("#popover-trigger"));
    jQuery.fn.popover.call(jQuery("#popover-trigger"), "open");
    expect(document.getElementById("popover").hidden).toBe(false);
    jQuery.fn.popover.call(jQuery("#popover-trigger"), "toggle");
    expect(document.getElementById("popover").hidden).toBe(true);
    jQuery.fn.popover.call(jQuery("#popover-trigger"), "open");
    jQuery.fn.popover.call(jQuery("#popover-trigger"), "close");
    expect(document.getElementById("popover").hidden).toBe(true);

    jQuery.fn.multiselect.call(jQuery("#select"));
    jQuery.fn.multiselect.call(jQuery("#select"), "open");
    expect(document.getElementById("select").nextElementSibling.classList.contains("is-open")).toBe(true);
    jQuery.fn.multiselect.call(jQuery("#select"), "toggle");
    expect(document.getElementById("select").nextElementSibling.classList.contains("is-open")).toBe(false);
    jQuery.fn.multiselect.call(jQuery("#select"), "close");
    expect(document.getElementById("select").nextElementSibling.classList.contains("is-open")).toBe(false);

    jQuery.fn.pagination.call(jQuery("#pages"), { data: ["A", "B"], pageSize: 1 });
    await nextFrame(dom.window);
    jQuery.fn.pagination.call(jQuery("#pages"), "goTo", 2);
    await nextFrame(dom.window);
    expect(document.querySelector("#pages .pagination-summary").textContent).toBe("Page 2 of 2 (2 items)");
    jQuery.fn.pagination.call(jQuery("#pages"), "pageSize", 2);
    await nextFrame(dom.window);
    expect(document.querySelector("#pages .pagination-summary").textContent).toBe("Page 1 of 1 (2 items)");
    jQuery.fn.pagination.call(jQuery("#pages"), "refresh");
    await nextFrame(dom.window);

    jQuery.fn.toast.call(jQuery("#toast"), "close");
    expect(document.getElementById("toast")).toBeNull();
    expect(jQuery.toast("Saved", { duration: 0 }).textContent).toContain("Saved");
  });

  it("runs remaining bridge setup branches", async () => {
    const onDrag = vi.fn();

    dom = await createLegacyDom(
      html`
        <div id="tabs" data-tabs>
          <div role="tablist">
            <button id="tab-a" role="tab" aria-controls="panel-a">A</button>
            <button id="tab-b" role="tab" aria-controls="panel-b">B</button>
          </div>
          <section id="panel-a" role="tabpanel">A</section>
          <section id="panel-b" role="tabpanel">B</section>
        </div>
        <div id="board" data-dragdrop>
          <section data-dragdrop-column>
            <article id="card" data-dragdrop-item>Card</article>
          </section>
        </div>
        <section id="toast">Toast target</section>
      `,
      {
        beforeEval(window) {
          const jQuery = (target) => ({
            0: typeof target === "string" ? window.document.querySelector(target) : target,
            each(callback) {
              callback.call(this[0]);
              return this;
            },
            jquery: "test",
          });

          jQuery.fn = {};
          window.jQuery = jQuery;
        },
      }
    );
    const { document, jQuery } = dom.window;

    jQuery.fn.tabs.call(jQuery("#tabs"));
    jQuery.fn.tabs.call(jQuery("#tabs"), "select", 1);
    expect(document.getElementById("tab-b").getAttribute("aria-selected")).toBe("true");

    jQuery.fn.dragdrop.call(jQuery("#board"), { onDrag });
    dispatch(document.getElementById("card"), "dragstart");
    expect(onDrag).toHaveBeenCalledTimes(1);

    jQuery.fn.toast.call(jQuery("#toast"), { duration: 0 });
    expect(document.querySelector(".toast")).toBeTruthy();
  });
});

describe("automatic setup", () => {
  it("wires data components on DOMContentLoaded", async () => {
    dom = await createLegacyDom(html`
      <button id="popover-trigger" data-popover-target="#popover">Popover</button>
      <div id="popover" hidden>Popover</div>
      <div id="tabs" data-tabs>
        <div role="tablist"><button role="tab" aria-controls="panel">Tab</button></div>
        <section id="panel" role="tabpanel">Panel</section>
      </div>
      <div id="board" data-dragdrop>
        <section data-dragdrop-column>
          <article id="card" data-dragdrop-item>Card</article>
        </section>
      </div>
      <select id="select" multiple data-multiselect><option>A</option></select>
      <nav id="pages" data-pagination></nav>
    `);
    const { document } = dom.window;

    document.dispatchEvent(new dom.window.Event("DOMContentLoaded", { bubbles: true }));
    await nextFrame(dom.window);

    expect(document.getElementById("popover-trigger").getAttribute("aria-haspopup")).toBe("dialog");
    expect(document.getElementById("panel").getAttribute("tabindex")).toBe("0");
    expect(document.getElementById("card").getAttribute("draggable")).toBe("true");
    expect(document.getElementById("select").nextElementSibling.classList.contains("multiselect")).toBe(true);
    expect(document.querySelector("#pages .pagination-summary").textContent).toBe("Page 1 of 1 (0 items)");
  });
});
