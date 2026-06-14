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
});

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
});
