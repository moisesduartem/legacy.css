// @ts-nocheck
import { describe, expect, it, vi } from "vitest";
import { createComponentDom, dom, html } from "./helpers/components";

describe("LegacyCss.tabs", () => {
  it("selects the initial tab and supports clicks, indexes, and selectors", async () => {
    await createComponentDom(html`
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
    await createComponentDom(html`
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
    await createComponentDom(html`
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
    await createComponentDom(html`
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
