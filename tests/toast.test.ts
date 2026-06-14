// @ts-nocheck
import { describe, expect, it, vi } from "vitest";
import { createComponentDom, dom, html } from "./helpers/components";

describe("LegacyCss.toast", () => {
  it("renders toasts, dispatches events, and clears them", async () => {
    await createComponentDom("<div id=\"target\"></div>");
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
    await createComponentDom();
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
    await createComponentDom(html`
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
    await createComponentDom(html`
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
    await createComponentDom(html`
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
