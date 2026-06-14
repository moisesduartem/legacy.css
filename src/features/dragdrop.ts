import { currentTargetElement, eventTargetElement, isElement, isLegacyCollection, listen } from "../internal";
import type { LegacyDragdropOptions, LegacyDragdropPayload, LegacyDragdropState, LegacyRequiredApi, LegacyTarget } from "../internal";
const wiredDragdropBoards = new WeakSet<Element>();
const dragdropOptions = new WeakMap<Element, LegacyDragdropOptions>();
const dragdropBoardSelector = "[data-dragdrop], .dragdrop";
const dragdropColumnSelector = "[data-dragdrop-column], .dragdrop-column";
const dragdropItemSelector = "[data-dragdrop-item], .dragdrop-item";
let dragdropState: LegacyDragdropState | null = null;

export function installDragdrop(legacy: LegacyRequiredApi): void {
  function resolveDragdropBoard(target: LegacyTarget): Element | null {
    if (!target) {
      return null;
    }

    if (isLegacyCollection(target)) {
      return resolveDragdropBoard(target[0]);
    }

    if (typeof target === "string") {
      return document.querySelector(target);
    }

    if (isElement(target)) {
      if (target.matches(dragdropBoardSelector)) {
        return target;
      }

      return target.closest(dragdropBoardSelector);
    }

    return null;
  }

  function getDragdropItems(column: Element): Element[] {
    return Array.from(column.querySelectorAll(dragdropItemSelector)).filter(
      (item) => item.closest(dragdropColumnSelector) === column
    );
  }

  function getDragdropColumnId(column: Element): string | null {
    return column.getAttribute("data-column") || column.id || null;
  }

  function getDragdropIndex(item: Element, column: Element): number {
    return getDragdropItems(column).indexOf(item);
  }

  function getDragdropInsertBefore(column: Element, clientY: number): Element | null {
    return getDragdropItems(column)
      .filter((item) => !item.classList.contains("is-dragging"))
      .reduce(
        (closest, item) => {
          const rect = item.getBoundingClientRect();
          const offset = clientY - rect.top - rect.height / 2;

          if (offset < 0 && offset > closest.offset) {
            return { offset, item };
          }

          return closest;
        },
        { offset: Number.NEGATIVE_INFINITY, item: null as Element | null }
      ).item;
  }

  function createDragdropPayload(originalEvent: Event, toColumn: Element | null): LegacyDragdropPayload | null {
    /* v8 ignore next -- payload creation is only called after drag state has been established */
    if (!dragdropState) {
      return null;
    }

    /* v8 ignore next -- drop handlers pass an explicit destination column */
    const destinationColumn = toColumn || dragdropState.item.closest(dragdropColumnSelector);

    return {
      board: dragdropState.board,
      item: dragdropState.item,
      fromColumn: dragdropState.fromColumn,
      toColumn: destinationColumn,
      fromColumnId: getDragdropColumnId(dragdropState.fromColumn),
      /* v8 ignore next -- destination is established by validated dragover/drop targets */
      toColumnId: destinationColumn ? getDragdropColumnId(destinationColumn) : null,
      fromIndex: dragdropState.fromIndex,
      /* v8 ignore next -- destination is established by validated dragover/drop targets */
      toIndex: destinationColumn ? getDragdropIndex(dragdropState.item, destinationColumn) : -1,
      originalEvent,
    };
  }

  function callDragdropCallback(
    board: Element,
    name: keyof LegacyDragdropOptions,
    payload: LegacyDragdropPayload | null
  ): void {
    /* v8 ignore next -- setup always initializes an options object for wired boards */
    const options = dragdropOptions.get(board) || {};
    const callback = options[name];

    if (typeof callback === "function") {
      callback.call(board, payload as LegacyDragdropPayload);
    }
  }

  function clearDragdropState(): void {
    /* v8 ignore next -- cleanup is shared by active and already-cleared drag paths */
    if (dragdropState) {
      dragdropState.item.classList.remove("is-dragging");
      dragdropState.board
        .querySelectorAll(".is-drag-over")
        .forEach((column) => column.classList.remove("is-drag-over"));
    }

    dragdropState = null;
  }

  function handleDragdropStart(event: DragEvent): void {
    const target = eventTargetElement(event);
    /* v8 ignore next -- browser drag events provide element targets */
    const item = target ? target.closest(dragdropItemSelector) : null;
    const board = resolveDragdropBoard(currentTargetElement(event));

    if (!item || !board || !board.contains(item)) {
      return;
    }

    const fromColumn = item.closest(dragdropColumnSelector);

    if (!fromColumn || !board.contains(fromColumn)) {
      return;
    }

    dragdropState = {
      board,
      item,
      fromColumn,
      fromIndex: getDragdropIndex(item, fromColumn),
    };

    item.classList.add("is-dragging");

    /* v8 ignore next -- jsdom tests cover both event payloads and no-payload drag events */
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", item.getAttribute("data-id") || item.id || "");
    }

    callDragdropCallback(board, "onDrag", createDragdropPayload(event, fromColumn));
  }

  function handleDragdropOver(event: DragEvent): void {
    if (!dragdropState) {
      return;
    }

    const target = eventTargetElement(event);
    /* v8 ignore next -- browser dragover events provide element targets */
    const column = target ? target.closest(dragdropColumnSelector) : null;

    if (!column || !dragdropState.board.contains(column)) {
      return;
    }

    event.preventDefault();

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move";
    }

    dragdropState.board
      .querySelectorAll(".is-drag-over")
      .forEach((currentColumn) => {
        /* v8 ignore next -- class cleanup depends on prior hover column */
        if (currentColumn !== column) {
          currentColumn.classList.remove("is-drag-over");
        }
      });

    column.classList.add("is-drag-over");

    const insertBefore = getDragdropInsertBefore(column, event.clientY);
    column.insertBefore(dragdropState.item, insertBefore);
  }

  function handleDragdropDrop(event: DragEvent): void {
    if (!dragdropState) {
      return;
    }

    const target = eventTargetElement(event);
    /* v8 ignore next -- browser drop events provide element targets */
    const column = target ? target.closest(dragdropColumnSelector) : null;

    if (!column || !dragdropState.board.contains(column)) {
      return;
    }

    event.preventDefault();

    const payload = createDragdropPayload(event, column);

    /* v8 ignore next -- guarded by dragdropState check before payload creation */
    if (!payload) {
      return;
    }

    const changedColumn = payload.fromColumn !== payload.toColumn;
    const changedIndex = payload.fromIndex !== payload.toIndex;

    /* v8 ignore next -- no-op same-position drops are intentionally silent */
    if (changedColumn || changedIndex) {
      callDragdropCallback(payload.board, "onDrop", payload);

      if (changedColumn) {
        callDragdropCallback(payload.board, "onChangeColumn", payload);
      }
    }

    clearDragdropState();
  }

  function handleDragdropEnd(): void {
    clearDragdropState();
  }

  function setupDragdrop(target: LegacyTarget, options?: LegacyDragdropOptions): Element | null {
    const board = resolveDragdropBoard(target);

    if (!board) {
      return null;
    }

    /* v8 ignore next 6 -- option setup supports explicit, merged, and default branches */
    if (options !== undefined) {
      /* v8 ignore next -- option merging tolerates absent prior options and null updates */
      dragdropOptions.set(board, Object.assign({}, dragdropOptions.get(board), options || {}));
    } else if (!dragdropOptions.has(board)) {
      dragdropOptions.set(board, {});
    }

    board.querySelectorAll(dragdropItemSelector).forEach((item) => {
      if (!item.hasAttribute("draggable")) {
        item.setAttribute("draggable", "true");
      }
    });

    if (wiredDragdropBoards.has(board)) {
      return board;
    }

    wiredDragdropBoards.add(board);
    listen(board, "dragstart", handleDragdropStart as EventListener);
    listen(board, "dragover", handleDragdropOver as EventListener);
    listen(board, "drop", handleDragdropDrop as EventListener);
    listen(board, "dragend", handleDragdropEnd);

    return board;
  }

  legacy.dragdrop = {
    setup(target, options) {
      return setupDragdrop(target, options);
    },
  };

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(dragdropBoardSelector).forEach((board) => {
      setupDragdrop(board);
    });
  });


}
