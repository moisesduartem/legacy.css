// @ts-nocheck
import { describe, expect, it, vi } from "vitest";
import { createComponentDom, dispatch, dom, html, nextFrame } from "./helpers/components";

describe("jQuery bridges", () => {
  it("registers small bridge methods when jQuery is present", async () => {
    await createComponentDom(
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
    await createComponentDom(
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

    await createComponentDom(
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
