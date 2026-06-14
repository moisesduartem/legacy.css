// @ts-nocheck
import { describe, expect, it, vi } from "vitest";
import { createComponentDom, dom } from "./helpers/components";

describe("LegacyCss.theme", () => {
  it("sets, reads, normalizes, and stores the global theme", async () => {
    await createComponentDom();
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
    await createComponentDom("", {
      beforeEval(window) {
        window.localStorage.setItem("legacy.css.theme", "dark");
      },
    });

    expect(dom.window.document.documentElement.dataset.legacyTheme).toBe("dark");
    expect(dom.window.LegacyCss.theme.get()).toBe("dark");
  });

  it("registers a jQuery theme bridge", async () => {
    await createComponentDom("", {
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
