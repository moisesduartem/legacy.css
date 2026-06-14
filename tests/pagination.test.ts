// @ts-nocheck
import { describe, expect, it, vi } from "vitest";
import { createComponentDom, dispatch, dom, html, nextFrame } from "./helpers/components";

describe("LegacyCss.pagination", () => {
  it("renders local data, navigates pages, and changes page size", async () => {
    await createComponentDom(html`
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
    await createComponentDom(html`
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
    await createComponentDom(html`
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
    await createComponentDom(html`
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
    await createComponentDom(html`
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
    await createComponentDom("<nav id=\"pages\" class=\"pagination\"></nav>");
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
    await createComponentDom(html`
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
    await createComponentDom(html`
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
