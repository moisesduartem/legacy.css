(function () {
  const root = window;
  const legacy = root.LegacyCss || (root.LegacyCss = {});
  const openDialogs = [];
  const openerMap = new WeakMap();
  const fallbackDialogs = new WeakSet();
  const wiredDialogs = new WeakSet();
  const wiredTabs = new WeakSet();
  const wiredDragdropBoards = new WeakSet();
  const dragdropOptions = new WeakMap();
  const supportsNativeDialog = (dialog) => typeof dialog.showModal === "function";
  const dragdropBoardSelector = "[data-dragdrop], .dragdrop";
  const dragdropColumnSelector = "[data-dragdrop-column], .dragdrop-column";
  const dragdropItemSelector = "[data-dragdrop-item], .dragdrop-item";

  let scrollLockCount = 0;
  let previousBodyOverflow = "";
  let previousHtmlOverflow = "";
  let dragdropState = null;

  const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(", ");

  function resolveDialog(target) {
    if (!target) {
      return null;
    }

    if (target.jquery) {
      return resolveDialog(target[0]);
    }

    if (typeof target === "string") {
      return document.querySelector(target);
    }

    if (typeof HTMLDialogElement !== "undefined" && target instanceof HTMLDialogElement) {
      return target;
    }

    if (target.nodeType === 1 && target.nodeName === "DIALOG") {
      return target;
    }

    return null;
  }

  function getFocusableElement(dialog) {
    return dialog.querySelector("[autofocus], [data-modal-autofocus], " + focusableSelector);
  }

  function focusDialog(dialog) {
    const focusTarget = getFocusableElement(dialog);

    if (focusTarget) {
      try {
        focusTarget.focus({ preventScroll: true });
      } catch (error) {
        focusTarget.focus();
      }
      return;
    }

    if (!dialog.hasAttribute("tabindex")) {
      dialog.setAttribute("tabindex", "-1");
    }

    try {
      dialog.focus({ preventScroll: true });
    } catch (error) {
      dialog.focus();
    }
  }

  function lockScroll() {
    if (scrollLockCount > 0) {
      scrollLockCount += 1;
      return;
    }

    previousBodyOverflow = document.body.style.overflow;
    previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    scrollLockCount = 1;
  }

  function unlockScroll() {
    if (scrollLockCount === 0) {
      return;
    }

    scrollLockCount -= 1;

    if (scrollLockCount > 0) {
      return;
    }

    document.body.style.overflow = previousBodyOverflow;
    document.documentElement.style.overflow = previousHtmlOverflow;
  }

  function removeFromOpenDialogs(dialog) {
    const index = openDialogs.indexOf(dialog);

    if (index >= 0) {
      openDialogs.splice(index, 1);
    }
  }

  function restoreFocus(dialog) {
    const opener = openerMap.get(dialog);

    if (opener && typeof opener.focus === "function" && document.contains(opener)) {
      try {
        opener.focus({ preventScroll: true });
      } catch (error) {
        opener.focus();
      }
    }

    openerMap.delete(dialog);
  }

  function handleClose(event) {
    const dialog = event.currentTarget;

    removeFromOpenDialogs(dialog);
    dialog.removeAttribute("aria-modal");
    restoreFocus(dialog);

    if (fallbackDialogs.has(dialog)) {
      fallbackDialogs.delete(dialog);
      unlockScroll();

      if (scrollLockCount === 0) {
        document.removeEventListener("keydown", handleKeydown);
      }
    }
  }

  function closeDialogElement(dialog, returnValue = "") {
    if (!dialog) {
      return null;
    }

    if (!dialog.open) {
      return dialog;
    }

    if (typeof dialog.close === "function") {
      dialog.close(returnValue);
    } else {
      dialog.removeAttribute("open");
      handleClose({ currentTarget: dialog });
    }

    return dialog;
  }

  function handleBackdropClick(event) {
    const dialog = event.currentTarget;
    const target = event.target;

    if (target === dialog) {
      closeDialogElement(dialog);
      return;
    }

    if (target.closest && target.closest("[data-modal-close]")) {
      closeDialogElement(dialog);
    }
  }

  function handleKeydown(event) {
    if (event.key !== "Escape") {
      return;
    }

    const dialog = openDialogs[openDialogs.length - 1];

    if (!dialog || !fallbackDialogs.has(dialog)) {
      return;
    }

    event.preventDefault();
    closeDialogElement(dialog);
  }

  function wireDialog(dialog) {
    if (wiredDialogs.has(dialog)) {
      return;
    }

    wiredDialogs.add(dialog);
    dialog.addEventListener("close", handleClose);
    dialog.addEventListener("click", handleBackdropClick);
  }

  function openDialogElement(dialog) {
    if (!dialog) {
      return null;
    }

    wireDialog(dialog);

    if (dialog.open) {
      return dialog;
    }

    openerMap.set(dialog, document.activeElement instanceof HTMLElement ? document.activeElement : null);
    dialog.setAttribute("aria-modal", "true");

    try {
      if (dialog.isConnected && supportsNativeDialog(dialog)) {
        dialog.showModal();
      } else {
        throw new Error("dialog.showModal is unavailable");
      }
    } catch (error) {
      dialog.setAttribute("open", "");
      fallbackDialogs.add(dialog);
      lockScroll();
    }

    if (!openDialogs.includes(dialog)) {
      openDialogs.push(dialog);
    }

    focusDialog(dialog);

    if (fallbackDialogs.has(dialog)) {
      document.addEventListener("keydown", handleKeydown);
    }

    return dialog;
  }

  function toggleDialogElement(dialog) {
    if (!dialog) {
      return null;
    }

    return dialog.open ? closeDialogElement(dialog) : openDialogElement(dialog);
  }

  legacy.modal = {
    open(target) {
      return openDialogElement(resolveDialog(target));
    },
    close(target, returnValue) {
      return closeDialogElement(resolveDialog(target), returnValue);
    },
    toggle(target) {
      return toggleDialogElement(resolveDialog(target));
    },
  };

  function resolveTabs(target) {
    if (!target) {
      return null;
    }

    if (target.jquery) {
      return resolveTabs(target[0]);
    }

    if (typeof target === "string") {
      return document.querySelector(target);
    }

    if (target.nodeType === 1) {
      if (target.matches("[data-tabs], .tabs")) {
        return target;
      }

      return target.closest("[data-tabs], .tabs");
    }

    return null;
  }

  function getTabs(rootElement) {
    const tabList = Array.from(rootElement.children).find((element) =>
      element.matches('[role="tablist"], .tabs-list')
    );

    if (!tabList) {
      return [];
    }

    return Array.from(tabList.children).filter((element) =>
      element.matches('[role="tab"]')
    );
  }

  function getTabPanels(rootElement) {
    return Array.from(rootElement.children).filter((element) =>
      element.matches('[role="tabpanel"]')
    );
  }

  function getTabPanel(rootElement, tab) {
    const panelId = tab.getAttribute("aria-controls");

    if (!panelId) {
      return null;
    }

    try {
      return rootElement.querySelector("#" + CSS.escape(panelId));
    } catch (error) {
      return document.getElementById(panelId);
    }
  }

  function selectTab(tab, setFocus) {
    const rootElement = resolveTabs(tab);

    if (!rootElement || !tab) {
      return null;
    }

    getTabs(rootElement).forEach((currentTab) => {
      const selected = currentTab === tab;
      const panel = getTabPanel(rootElement, currentTab);

      currentTab.setAttribute("aria-selected", selected ? "true" : "false");
      currentTab.setAttribute("tabindex", selected ? "0" : "-1");

      if (panel) {
        panel.hidden = !selected;
      }
    });

    if (setFocus) {
      tab.focus();
    }

    return tab;
  }

  function selectTabByIndex(rootElement, index, setFocus) {
    const tabs = getTabs(rootElement);
    const tab = tabs[index];

    if (!tab) {
      return null;
    }

    return selectTab(tab, setFocus);
  }

  function handleTabClick(event) {
    const tab = event.target.closest('[role="tab"]');

    if (tab) {
      selectTab(tab, false);
    }
  }

  function handleTabKeydown(event) {
    const rootElement = resolveTabs(event.currentTarget);
    const tabs = getTabs(rootElement);
    const currentIndex = tabs.indexOf(event.target);

    if (currentIndex < 0) {
      return;
    }

    let nextIndex = currentIndex;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = tabs.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    selectTabByIndex(rootElement, nextIndex, true);
  }

  function setupTabs(target) {
    const rootElement = resolveTabs(target);

    if (!rootElement || wiredTabs.has(rootElement)) {
      return rootElement;
    }

    wiredTabs.add(rootElement);
    rootElement.addEventListener("click", handleTabClick);
    rootElement.addEventListener("keydown", handleTabKeydown);

    const tabs = getTabs(rootElement);
    const selectedTab =
      tabs.find((tab) => tab.getAttribute("aria-selected") === "true") ||
      tabs[0];

    getTabPanels(rootElement).forEach((panel) => {
      if (!panel.hasAttribute("tabindex")) {
        panel.setAttribute("tabindex", "0");
      }
    });

    if (selectedTab) {
      selectTab(selectedTab, false);
    }

    return rootElement;
  }

  legacy.tabs = {
    setup(target) {
      return setupTabs(target);
    },
    select(target, index) {
      const rootElement = resolveTabs(target);

      if (!rootElement) {
        return null;
      }

      if (typeof index === "number") {
        return selectTabByIndex(rootElement, index, false);
      }

      return selectTab(rootElement.querySelector(index), false);
    },
  };

  function resolveDragdropBoard(target) {
    if (!target) {
      return null;
    }

    if (target.jquery) {
      return resolveDragdropBoard(target[0]);
    }

    if (typeof target === "string") {
      return document.querySelector(target);
    }

    if (target.nodeType === 1) {
      if (target.matches(dragdropBoardSelector)) {
        return target;
      }

      return target.closest(dragdropBoardSelector);
    }

    return null;
  }

  function getDragdropItems(column) {
    return Array.from(column.querySelectorAll(dragdropItemSelector)).filter(
      (item) => item.closest(dragdropColumnSelector) === column
    );
  }

  function getDragdropColumnId(column) {
    return column.getAttribute("data-column") || column.id || null;
  }

  function getDragdropIndex(item, column) {
    return getDragdropItems(column).indexOf(item);
  }

  function getDragdropInsertBefore(column, clientY) {
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
        { offset: Number.NEGATIVE_INFINITY, item: null }
      ).item;
  }

  function createDragdropPayload(originalEvent, toColumn) {
    if (!dragdropState) {
      return null;
    }

    const destinationColumn = toColumn || dragdropState.item.closest(dragdropColumnSelector);

    return {
      board: dragdropState.board,
      item: dragdropState.item,
      fromColumn: dragdropState.fromColumn,
      toColumn: destinationColumn,
      fromColumnId: getDragdropColumnId(dragdropState.fromColumn),
      toColumnId: destinationColumn ? getDragdropColumnId(destinationColumn) : null,
      fromIndex: dragdropState.fromIndex,
      toIndex: destinationColumn ? getDragdropIndex(dragdropState.item, destinationColumn) : -1,
      originalEvent,
    };
  }

  function callDragdropCallback(board, name, payload) {
    const options = dragdropOptions.get(board) || {};
    const callback = options[name];

    if (typeof callback === "function") {
      callback.call(board, payload);
    }
  }

  function clearDragdropState() {
    if (dragdropState) {
      dragdropState.item.classList.remove("is-dragging");
      dragdropState.board
        .querySelectorAll(".is-drag-over")
        .forEach((column) => column.classList.remove("is-drag-over"));
    }

    dragdropState = null;
  }

  function handleDragdropStart(event) {
    const item = event.target.closest(dragdropItemSelector);
    const board = resolveDragdropBoard(event.currentTarget);

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

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", item.getAttribute("data-id") || item.id || "");
    }

    callDragdropCallback(board, "onDrag", createDragdropPayload(event, fromColumn));
  }

  function handleDragdropOver(event) {
    if (!dragdropState) {
      return;
    }

    const column = event.target.closest(dragdropColumnSelector);

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
        if (currentColumn !== column) {
          currentColumn.classList.remove("is-drag-over");
        }
      });

    column.classList.add("is-drag-over");

    const insertBefore = getDragdropInsertBefore(column, event.clientY);
    column.insertBefore(dragdropState.item, insertBefore);
  }

  function handleDragdropDrop(event) {
    if (!dragdropState) {
      return;
    }

    const column = event.target.closest(dragdropColumnSelector);

    if (!column || !dragdropState.board.contains(column)) {
      return;
    }

    event.preventDefault();

    const payload = createDragdropPayload(event, column);
    const changedColumn = payload.fromColumn !== payload.toColumn;
    const changedIndex = payload.fromIndex !== payload.toIndex;

    if (changedColumn || changedIndex) {
      callDragdropCallback(payload.board, "onDrop", payload);

      if (changedColumn) {
        callDragdropCallback(payload.board, "onChangeColumn", payload);
      }
    }

    clearDragdropState();
  }

  function handleDragdropEnd() {
    clearDragdropState();
  }

  function setupDragdrop(target, options) {
    const board = resolveDragdropBoard(target);

    if (!board) {
      return null;
    }

    if (options !== undefined) {
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
    board.addEventListener("dragstart", handleDragdropStart);
    board.addEventListener("dragover", handleDragdropOver);
    board.addEventListener("drop", handleDragdropDrop);
    board.addEventListener("dragend", handleDragdropEnd);

    return board;
  }

  legacy.dragdrop = {
    setup(target, options) {
      return setupDragdrop(target, options);
    },
  };

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-tabs], .tabs").forEach(setupTabs);
    document.querySelectorAll(dragdropBoardSelector).forEach((board) => {
      setupDragdrop(board);
    });
  });

  if (root.jQuery && root.jQuery.fn && !root.jQuery.fn.modal) {
    root.jQuery.fn.modal = function (action) {
      const method = action || "open";

      return this.each(function () {
        if (method === "close") {
          legacy.modal.close(this);
          return;
        }

        if (method === "toggle") {
          legacy.modal.toggle(this);
          return;
        }

        legacy.modal.open(this);
      });
    };
  }

  if (root.jQuery && root.jQuery.fn && !root.jQuery.fn.tabs) {
    root.jQuery.fn.tabs = function (action, index) {
      return this.each(function () {
        if (action === "select") {
          legacy.tabs.select(this, index);
          return;
        }

        legacy.tabs.setup(this);
      });
    };
  }

  if (root.jQuery && root.jQuery.fn && !root.jQuery.fn.dragdrop) {
    root.jQuery.fn.dragdrop = function (options) {
      return this.each(function () {
        legacy.dragdrop.setup(this, options);
      });
    };
  }
})();
