// @ts-nocheck
import { describe, expect, it, vi } from "vitest";
import { createComponentDom, dom, html } from "./helpers/components";

describe("LegacyCss.popover", () => {
  it("wires ARIA and opens only one popover at a time", async () => {
    await createComponentDom(html`
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
    await createComponentDom(html`
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
    await createComponentDom(html`
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
    await createComponentDom(html`
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
    await createComponentDom(html`
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
