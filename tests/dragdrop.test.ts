// @ts-nocheck
import { describe, expect, it, vi } from "vitest";
import { createComponentDom, dispatch, dom, html } from "./helpers/components";

describe("LegacyCss.dragdrop", () => {
  it("makes items draggable and calls callbacks with the move payload", async () => {
    const onDrag = vi.fn();
    const onDrop = vi.fn();
    const onChangeColumn = vi.fn();

    await createComponentDom(html`
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

    await createComponentDom(html`
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
    await createComponentDom(html`
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
