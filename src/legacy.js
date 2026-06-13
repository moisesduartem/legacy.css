(function () {
  const root = window;
  const legacy = root.LegacyCss || (root.LegacyCss = {});
  const openDialogs = [];
  const openerMap = new WeakMap();
  const fallbackDialogs = new WeakSet();
  const wiredDialogs = new WeakSet();
  const wiredTabs = new WeakSet();
  const wiredDragdropBoards = new WeakSet();
  const wiredMultiselects = new WeakSet();
  const wiredPaginations = new WeakSet();
  const multiselectMap = new WeakMap();
  const dragdropOptions = new WeakMap();
  const paginationOptions = new WeakMap();
  const paginationState = new WeakMap();
  const supportsNativeDialog = (dialog) => typeof dialog.showModal === "function";
  const dragdropBoardSelector = "[data-dragdrop], .dragdrop";
  const dragdropColumnSelector = "[data-dragdrop-column], .dragdrop-column";
  const dragdropItemSelector = "[data-dragdrop-item], .dragdrop-item";
  const multiselectSelector = 'select[multiple][data-multiselect], select[multiple].multiselect-source';
  const paginationSelector = "[data-pagination], .pagination";

  let scrollLockCount = 0;
  let previousBodyOverflow = "";
  let previousHtmlOverflow = "";
  let dragdropState = null;
  let multiselectId = 0;

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

  function resolveMultiselect(target) {
    if (!target) {
      return null;
    }

    if (target.jquery) {
      return resolveMultiselect(target[0]);
    }

    if (typeof target === "string") {
      return resolveMultiselect(document.querySelector(target));
    }

    if (target.nodeType !== 1) {
      return null;
    }

    if (target.matches("select[multiple]")) {
      return target;
    }

    const rootElement = target.matches(".multiselect")
      ? target
      : target.closest(".multiselect");

    return rootElement ? rootElement.previousElementSibling : null;
  }

  function getMultiselectPlaceholder(select) {
    return select.getAttribute("data-placeholder") || "Select options";
  }

  function getMultiselectName(select) {
    const ariaLabel = select.getAttribute("aria-label");

    if (ariaLabel) {
      return ariaLabel;
    }

    if (!select.id) {
      return "";
    }

    try {
      const label = document.querySelector('label[for="' + CSS.escape(select.id) + '"]');

      return label ? label.textContent.trim() : "";
    } catch (error) {
      return "";
    }
  }

  function getMultiselectSelectedOptions(select) {
    return Array.from(select.options).filter((option) => option.selected);
  }

  function getMultiselectButtonText(select) {
    const selectedOptions = getMultiselectSelectedOptions(select);

    if (selectedOptions.length === 0) {
      return getMultiselectPlaceholder(select);
    }

    if (selectedOptions.length <= 2) {
      return selectedOptions.map((option) => option.text).join(", ");
    }

    return selectedOptions.length + " selected";
  }

  function getMultiselectOptions(rootElement) {
    return Array.from(rootElement.querySelectorAll(".multiselect-option"));
  }

  function updateMultiselect(select) {
    const state = multiselectMap.get(select);

    if (!state) {
      return select;
    }

    state.label.textContent = getMultiselectButtonText(select);
    state.options.forEach((button, index) => {
      const option = select.options[index];

      button.setAttribute("aria-selected", option.selected ? "true" : "false");
      button.setAttribute("aria-disabled", option.disabled ? "true" : "false");
      button.disabled = option.disabled || select.disabled;
    });

    state.toggle.disabled = select.disabled;

    return select;
  }

  function closeMultiselect(select) {
    const state = multiselectMap.get(select);

    if (!state) {
      return select;
    }

    state.root.classList.remove("is-open");
    state.toggle.setAttribute("aria-expanded", "false");

    return select;
  }

  function openMultiselect(select) {
    const state = multiselectMap.get(select);

    if (!state || select.disabled) {
      return select;
    }

    document.querySelectorAll(".multiselect.is-open").forEach((rootElement) => {
      const currentSelect = rootElement.previousElementSibling;

      if (currentSelect !== select) {
        closeMultiselect(currentSelect);
      }
    });

    state.root.classList.add("is-open");
    state.toggle.setAttribute("aria-expanded", "true");

    return select;
  }

  function toggleMultiselect(select) {
    const state = multiselectMap.get(select);

    if (!state) {
      return select;
    }

    return state.root.classList.contains("is-open")
      ? closeMultiselect(select)
      : openMultiselect(select);
  }

  function toggleMultiselectOption(select, index) {
    const option = select.options[index];

    if (!option || option.disabled || select.disabled) {
      return;
    }

    option.selected = !option.selected;
    updateMultiselect(select);
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function focusMultiselectOption(rootElement, index) {
    const options = getMultiselectOptions(rootElement).filter((option) => !option.disabled);
    const option = options[index];

    if (option) {
      option.focus();
    }
  }

  function handleMultiselectClick(event) {
    const select = resolveMultiselect(event.currentTarget);
    const option = event.target.closest(".multiselect-option");

    if (!select) {
      return;
    }

    if (option) {
      toggleMultiselectOption(select, Number(option.getAttribute("data-index")));
      return;
    }

    if (event.target.closest(".multiselect-toggle")) {
      toggleMultiselect(select);
    }
  }

  function handleMultiselectKeydown(event) {
    const select = resolveMultiselect(event.currentTarget);
    const state = select ? multiselectMap.get(select) : null;

    if (!state) {
      return;
    }

    if (event.key === "Escape") {
      closeMultiselect(select);
      state.toggle.focus();
      return;
    }

    if (event.target === state.toggle) {
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openMultiselect(select);
        focusMultiselectOption(state.root, 0);
      }

      return;
    }

    const options = getMultiselectOptions(state.root).filter((option) => !option.disabled);
    const currentIndex = options.indexOf(event.target);

    if (currentIndex < 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusMultiselectOption(state.root, (currentIndex + 1) % options.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusMultiselectOption(state.root, (currentIndex - 1 + options.length) % options.length);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusMultiselectOption(state.root, 0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusMultiselectOption(state.root, options.length - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleMultiselectOption(select, Number(event.target.getAttribute("data-index")));
    }
  }

  function handleDocumentMultiselectClick(event) {
    document.querySelectorAll(".multiselect.is-open").forEach((rootElement) => {
      if (!rootElement.contains(event.target)) {
        closeMultiselect(rootElement.previousElementSibling);
      }
    });
  }

  function createMultiselectOption(option, index, rootId) {
    const button = document.createElement("button");

    button.className = "multiselect-option";
    button.type = "button";
    button.id = rootId + "-option-" + index;
    button.setAttribute("role", "option");
    button.setAttribute("data-index", String(index));
    button.textContent = option.text;

    return button;
  }

  function setupMultiselect(target) {
    const select = resolveMultiselect(target);

    if (!select || !select.matches("select[multiple]")) {
      return null;
    }

    if (wiredMultiselects.has(select)) {
      updateMultiselect(select);
      return select;
    }

    const rootElement = document.createElement("div");
    const toggle = document.createElement("button");
    const label = document.createElement("span");
    const menu = document.createElement("div");
    const rootId = select.id || select.name || "multiselect-" + ++multiselectId;
    const menuId = rootId + "-menu";
    const options = Array.from(select.options).map((option, index) =>
      createMultiselectOption(option, index, rootId)
    );

    rootElement.className = "multiselect";
    toggle.className = "multiselect-toggle";
    toggle.id = rootId + "-toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-haspopup", "listbox");
    toggle.setAttribute("aria-controls", menuId);
    label.className = "multiselect-label";
    menu.className = "multiselect-menu";
    menu.id = menuId;
    menu.setAttribute("role", "listbox");
    menu.setAttribute("aria-multiselectable", "true");

    const name = getMultiselectName(select);

    if (name) {
      toggle.setAttribute("aria-label", name);
    }

    toggle.append(label);

    if (options.length === 0) {
      const empty = document.createElement("div");

      empty.className = "multiselect-empty";
      empty.textContent = "No options";
      menu.append(empty);
    } else {
      options.forEach((option) => menu.append(option));
    }

    rootElement.append(toggle, menu);
    select.classList.add("multiselect-source");
    select.after(rootElement);

    multiselectMap.set(select, { label, menu, options, root: rootElement, toggle });
    wiredMultiselects.add(select);
    rootElement.addEventListener("click", handleMultiselectClick);
    rootElement.addEventListener("keydown", handleMultiselectKeydown);
    select.addEventListener("change", () => updateMultiselect(select));

    if (select.form) {
      select.form.addEventListener("reset", () => {
        setTimeout(() => updateMultiselect(select), 0);
      });
    }

    updateMultiselect(select);

    return select;
  }

  legacy.multiselect = {
    setup(target) {
      return setupMultiselect(target);
    },
    open(target) {
      return openMultiselect(resolveMultiselect(target));
    },
    close(target) {
      return closeMultiselect(resolveMultiselect(target));
    },
    toggle(target) {
      return toggleMultiselect(resolveMultiselect(target));
    },
  };

  function resolvePagination(target) {
    if (!target) {
      return null;
    }

    if (target.jquery) {
      return resolvePagination(target[0]);
    }

    if (typeof target === "string") {
      return document.querySelector(target);
    }

    if (target.nodeType === 1) {
      if (target.matches(paginationSelector)) {
        return target;
      }

      return target.closest(paginationSelector);
    }

    return null;
  }

  function getPaginationNumber(value, fallback) {
    const number = Number(value);

    return Number.isFinite(number) && number > 0 ? number : fallback;
  }

  function getPaginationPageSizes(rootElement, options) {
    const configured =
      options.pageSizes ||
      rootElement.getAttribute("data-page-sizes") ||
      rootElement.getAttribute("data-page-size-options");
    const values = Array.isArray(configured)
      ? configured
      : String(configured || "10,25,50").split(",");
    const sizes = values
      .map((value) => getPaginationNumber(value, 0))
      .filter((value, index, list) => value > 0 && list.indexOf(value) === index);

    return sizes.length > 0 ? sizes : [10, 25, 50];
  }

  function getPaginationTarget(rootElement, options) {
    if (options.target) {
      return typeof options.target === "string"
        ? document.querySelector(options.target)
        : options.target;
    }

    const selector = rootElement.getAttribute("data-target");

    return selector ? document.querySelector(selector) : null;
  }

  function createPaginationResult(rootElement, options, state) {
    if (typeof options.load === "function") {
      return options.load.call(rootElement, {
        page: state.page,
        pageSize: state.pageSize,
        offset: (state.page - 1) * state.pageSize,
      });
    }

    const data = Array.isArray(options.data) ? options.data : [];
    const start = (state.page - 1) * state.pageSize;

    return {
      items: data.slice(start, start + state.pageSize),
      total: data.length,
    };
  }

  function normalizePaginationResult(result, state) {
    const payload = Array.isArray(result) ? { items: result, total: result.length } : result || {};
    const items = Array.isArray(payload.items) ? payload.items : [];
    const total = getPaginationNumber(payload.total, items.length);
    const pageCount = Math.max(1, Math.ceil(total / state.pageSize));

    return {
      items,
      page: getPaginationNumber(payload.page, state.page),
      pageCount,
      pageSize: getPaginationNumber(payload.pageSize, state.pageSize),
      total,
    };
  }

  function renderPaginationItem(item, index, options, state) {
    if (typeof options.renderItem === "function") {
      return options.renderItem(item, index, state);
    }

    const row = document.createElement("tr");
    const values = item && typeof item === "object" ? Object.values(item) : [item];

    values.forEach((value) => {
      const cell = document.createElement("td");

      cell.textContent = value == null ? "" : String(value);
      row.append(cell);
    });

    return row;
  }

  function renderPaginationItems(rootElement, result) {
    const options = paginationOptions.get(rootElement) || {};
    const target = options.target;

    if (!target) {
      return;
    }

    target.replaceChildren();
    result.items.forEach((item, index) => {
      const rendered = renderPaginationItem(item, index, options, result);

      if (typeof rendered === "string") {
        target.insertAdjacentHTML("beforeend", rendered);
      } else if (rendered) {
        target.append(rendered);
      }
    });
  }

  function getPaginationPages(currentPage, pageCount, maxPages) {
    const pages = [];

    if (pageCount <= maxPages) {
      for (let page = 1; page <= pageCount; page += 1) {
        pages.push(page);
      }

      return pages;
    }

    pages.push(1);

    const sideCount = Math.max(1, Math.floor((maxPages - 3) / 2));
    const start = Math.max(2, currentPage - sideCount);
    const end = Math.min(pageCount - 1, currentPage + sideCount);

    if (start > 2) {
      pages.push("ellipsis-start");
    }

    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }

    if (end < pageCount - 1) {
      pages.push("ellipsis-end");
    }

    pages.push(pageCount);

    return pages;
  }

  function createPaginationButton(label, action, disabled) {
    const button = document.createElement("button");

    button.type = "button";
    button.setAttribute("data-pagination-action", action);
    button.textContent = label;
    button.disabled = disabled;

    return button;
  }

  function renderPaginationControls(rootElement, result) {
    const options = paginationOptions.get(rootElement) || {};
    const pageCount = result.pageCount;
    const page = Math.min(result.page, pageCount);
    const maxPages = getPaginationNumber(options.maxPages, 7);
    const summary = document.createElement("span");
    const pages = document.createElement("span");
    const size = document.createElement("span");
    const label = document.createElement("label");
    const select = document.createElement("select");

    summary.className = "pagination-summary";
    summary.textContent = "Page " + page + " of " + pageCount + " (" + result.total + " items)";
    pages.className = "pagination-pages";
    pages.setAttribute("role", "group");
    pages.setAttribute("aria-label", "Pages");
    pages.append(createPaginationButton("Previous", "previous", page <= 1));

    getPaginationPages(page, pageCount, maxPages).forEach((pageNumber) => {
      if (typeof pageNumber !== "number") {
        const ellipsis = document.createElement("span");

        ellipsis.className = "pagination-ellipsis";
        ellipsis.setAttribute("aria-hidden", "true");
        ellipsis.textContent = "...";
        pages.append(ellipsis);
        return;
      }

      const button = createPaginationButton(String(pageNumber), "page", false);

      button.className = "pagination-page";
      button.setAttribute("data-pagination-page", String(pageNumber));
      button.setAttribute("aria-label", "Page " + pageNumber);

      if (pageNumber === page) {
        button.setAttribute("aria-current", "page");
      }

      pages.append(button);
    });

    pages.append(createPaginationButton("Next", "next", page >= pageCount));
    size.className = "pagination-size";
    label.textContent = "Page size";

    options.pageSizes.forEach((pageSize) => {
      const option = document.createElement("option");

      option.value = String(pageSize);
      option.textContent = String(pageSize);
      option.selected = pageSize === result.pageSize;
      select.append(option);
    });

    select.setAttribute("data-pagination-size", "");
    label.append(select);
    size.append(label);
    rootElement.replaceChildren(summary, pages, size);
  }

  function setPaginationLoading(rootElement, loading) {
    rootElement.setAttribute("aria-busy", loading ? "true" : "false");
    rootElement.querySelectorAll("button, select").forEach((control) => {
      control.disabled = loading;
    });
  }

  function handlePaginationError(rootElement, state, request, error) {
    if (request !== state.request) {
      return;
    }

    if (state.result) {
      renderPaginationControls(rootElement, state.result);
    } else {
      setPaginationLoading(rootElement, false);
    }

    rootElement.dispatchEvent(
      new CustomEvent("pagination:error", {
        bubbles: true,
        detail: { error },
      })
    );
  }

  function updatePagination(rootElement) {
    const options = rootElement ? paginationOptions.get(rootElement) : null;
    const state = rootElement ? paginationState.get(rootElement) : null;

    if (!options || !state) {
      return rootElement;
    }

    state.request += 1;
    const request = state.request;

    setPaginationLoading(rootElement, true);

    try {
      Promise.resolve(createPaginationResult(rootElement, options, state))
        .then((rawResult) => {
          if (request !== state.request) {
            return;
          }

          const result = normalizePaginationResult(rawResult, state);

          state.page = Math.min(result.page, result.pageCount);
          state.pageSize = result.pageSize;
          state.result = result;
          renderPaginationItems(rootElement, result);
          renderPaginationControls(rootElement, result);
          rootElement.dispatchEvent(
            new CustomEvent("pagination:change", {
              bubbles: true,
              detail: result,
            })
          );
        })
        .catch((error) => {
          handlePaginationError(rootElement, state, request, error);
        });
    } catch (error) {
      handlePaginationError(rootElement, state, request, error);
    }

    return rootElement;
  }

  function setPaginationPage(rootElement, page) {
    const state = rootElement ? paginationState.get(rootElement) : null;

    if (!state) {
      return null;
    }

    state.page = getPaginationNumber(page, state.page);

    return updatePagination(rootElement);
  }

  function setPaginationPageSize(rootElement, pageSize) {
    const state = rootElement ? paginationState.get(rootElement) : null;

    if (!state) {
      return null;
    }

    state.page = 1;
    state.pageSize = getPaginationNumber(pageSize, state.pageSize);

    return updatePagination(rootElement);
  }

  function handlePaginationClick(event) {
    const rootElement = resolvePagination(event.currentTarget);
    const button = event.target.closest("[data-pagination-action]");
    const state = rootElement ? paginationState.get(rootElement) : null;

    if (!button || !state || button.disabled) {
      return;
    }

    const action = button.getAttribute("data-pagination-action");

    if (action === "previous") {
      setPaginationPage(rootElement, state.page - 1);
    } else if (action === "next") {
      setPaginationPage(rootElement, state.page + 1);
    } else if (action === "page") {
      setPaginationPage(rootElement, button.getAttribute("data-pagination-page"));
    }
  }

  function handlePaginationChange(event) {
    if (event.target.matches("[data-pagination-size]")) {
      setPaginationPageSize(event.currentTarget, event.target.value);
    }
  }

  function setupPagination(target, options) {
    const rootElement = resolvePagination(target);

    if (!rootElement) {
      return null;
    }

    const nextOptions = Object.assign({}, paginationOptions.get(rootElement), options || {});

    nextOptions.target = getPaginationTarget(rootElement, nextOptions);
    nextOptions.pageSizes = getPaginationPageSizes(rootElement, nextOptions);
    nextOptions.pageSize = getPaginationNumber(
      nextOptions.pageSize || rootElement.getAttribute("data-page-size"),
      nextOptions.pageSizes[0]
    );
    nextOptions.maxPages = getPaginationNumber(
      nextOptions.maxPages || rootElement.getAttribute("data-max-pages"),
      7
    );

    paginationOptions.set(rootElement, nextOptions);

    if (paginationState.has(rootElement)) {
      const state = paginationState.get(rootElement);

      if (options && options.pageSize) {
        state.page = 1;
        state.pageSize = nextOptions.pageSize;
      }
    } else {
      paginationState.set(rootElement, {
        page: getPaginationNumber(rootElement.getAttribute("data-page"), 1),
        pageSize: nextOptions.pageSize,
        request: 0,
      });
    }

    if (!wiredPaginations.has(rootElement)) {
      wiredPaginations.add(rootElement);
      rootElement.addEventListener("click", handlePaginationClick);
      rootElement.addEventListener("change", handlePaginationChange);
    }

    updatePagination(rootElement);

    return rootElement;
  }

  legacy.pagination = {
    setup(target, options) {
      return setupPagination(target, options);
    },
    goTo(target, page) {
      return setPaginationPage(resolvePagination(target), page);
    },
    pageSize(target, pageSize) {
      return setPaginationPageSize(resolvePagination(target), pageSize);
    },
    refresh(target) {
      return updatePagination(resolvePagination(target));
    },
  };

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-tabs], .tabs").forEach(setupTabs);
    document.querySelectorAll(dragdropBoardSelector).forEach((board) => {
      setupDragdrop(board);
    });
    document.querySelectorAll(multiselectSelector).forEach(setupMultiselect);
    document.querySelectorAll("[data-pagination]").forEach((rootElement) => {
      setupPagination(rootElement);
    });
  });

  document.addEventListener("click", handleDocumentMultiselectClick);

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

  if (root.jQuery && root.jQuery.fn && !root.jQuery.fn.multiselect) {
    root.jQuery.fn.multiselect = function (action) {
      return this.each(function () {
        if (action === "open") {
          legacy.multiselect.open(this);
          return;
        }

        if (action === "close") {
          legacy.multiselect.close(this);
          return;
        }

        if (action === "toggle") {
          legacy.multiselect.toggle(this);
          return;
        }

        legacy.multiselect.setup(this);
      });
    };
  }

  if (root.jQuery && root.jQuery.fn && !root.jQuery.fn.pagination) {
    root.jQuery.fn.pagination = function (action, value) {
      return this.each(function () {
        if (action === "goTo") {
          legacy.pagination.goTo(this, value);
          return;
        }

        if (action === "pageSize") {
          legacy.pagination.pageSize(this, value);
          return;
        }

        if (action === "refresh") {
          legacy.pagination.refresh(this);
          return;
        }

        legacy.pagination.setup(this, action);
      });
    };
  }
})();
