// @ts-nocheck
import { describe, expect, it, vi } from "vitest";
import { createComponentDom, dom, html, nextFrame } from "./helpers/components";

describe("automatic setup", () => {
  it("wires data components on DOMContentLoaded", async () => {
    await createComponentDom(html`
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
