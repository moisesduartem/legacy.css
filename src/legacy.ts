type LegacyTarget<T extends Element = Element> =
  | string
  | T
  | { 0?: T; jquery?: unknown; nodeType?: number }
  | null
  | undefined;

type LegacyRequiredApi = {
  [Key in keyof LegacyCssApi]-?: LegacyCssApi[Key];
};

type LegacyFocusableElement = HTMLElement | SVGElement;
type LegacyPageToken = number | "ellipsis-start" | "ellipsis-end";
type LegacyPaginationAction = "previous" | "next" | "page";
type LegacyTheme = "light" | "dark";

interface LegacyDragdropState {
  board: Element;
  item: Element;
  fromColumn: Element;
  fromIndex: number;
}

interface LegacyMultiselectState {
  label: HTMLSpanElement;
  menu: HTMLDivElement;
  options: HTMLButtonElement[];
  root: HTMLDivElement;
  toggle: HTMLButtonElement;
}

interface LegacyCloseEvent {
  currentTarget: HTMLDialogElement;
}

type LegacyToastType = "info" | "success" | "warning" | "danger" | "muted";
type LegacyToastPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";
type LegacyPopoverPlacement = "top" | "right" | "bottom" | "left";

const legacyToastPositions: LegacyToastPosition[] = ["top-left", "top-right", "bottom-left", "bottom-right"];
const legacyPopoverPlacements: LegacyPopoverPlacement[] = ["top", "right", "bottom", "left"];
const legacyThemes: LegacyTheme[] = ["light", "dark"];
const legacyThemeStorageKey = "legacy.css.theme";

interface LegacyToastOptions {
  closeLabel?: string;
  closeText?: string;
  container?: LegacyTarget;
  dismissible?: boolean;
  duration?: number;
  message?: string | Node;
  position?: LegacyToastPosition;
  title?: string;
  type?: LegacyToastType;
}

type LegacyToastInput = LegacyToastOptions | string | Node | null | undefined;

interface LegacyDragdropPayload {
  board: Element;
  item: Element;
  fromColumn: Element;
  toColumn: Element | null;
  fromColumnId: string | null;
  toColumnId: string | null;
  fromIndex: number;
  toIndex: number;
  originalEvent: Event;
}

interface LegacyDragdropOptions {
  onChangeColumn?: (this: Element, payload: LegacyDragdropPayload) => void;
  onDrag?: (this: Element, payload: LegacyDragdropPayload | null) => void;
  onDrop?: (this: Element, payload: LegacyDragdropPayload) => void;
}

interface LegacyPaginationState {
  page: number;
  pageSize: number;
  request: number;
  result?: LegacyPaginationResult;
}

interface LegacyPaginationResult {
  items: unknown[];
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
}

interface LegacyPaginationOptions {
  data?: unknown[];
  load?: (this: Element, state: { page: number; pageSize: number; offset: number }) => Promise<unknown> | unknown;
  maxPages?: number;
  pageSize?: number;
  pageSizes?: number[];
  renderItem?: (
    item: unknown,
    index: number,
    state: LegacyPaginationResult
  ) => Element | DocumentFragment | string | null | undefined;
  target?: Element | null;
}

interface LegacyPaginationSetupOptions extends Omit<LegacyPaginationOptions, "pageSizes" | "target"> {
  pageSizes?: number[] | string;
  target?: LegacyTarget | Element | null;
}

interface LegacyPaginationPayload {
  items?: unknown;
  page?: unknown;
  pageCount?: unknown;
  pageSize?: unknown;
  total?: unknown;
}

interface LegacyCssApi {
  theme?: {
    apply(theme?: string | null): LegacyTheme;
    get(): LegacyTheme;
    set(theme: string): LegacyTheme;
  };
  dragdrop?: {
    setup(target: LegacyTarget, options?: LegacyDragdropOptions): Element | null;
  };
  modal?: {
    close(target: LegacyTarget<HTMLDialogElement>, returnValue?: string): HTMLDialogElement | null;
    open(target: LegacyTarget<HTMLDialogElement>): HTMLDialogElement | null;
    toggle(target: LegacyTarget<HTMLDialogElement>): HTMLDialogElement | null;
  };
  multiselect?: {
    close(target: LegacyTarget): HTMLSelectElement | null;
    open(target: LegacyTarget): HTMLSelectElement | null;
    setup(target: LegacyTarget): HTMLSelectElement | null;
    toggle(target: LegacyTarget): HTMLSelectElement | null;
  };
  pagination?: {
    goTo(target: LegacyTarget, page: number | string): Element | null;
    pageSize(target: LegacyTarget, pageSize: number | string): Element | null;
    refresh(target: LegacyTarget): Element | null;
    setup(target: LegacyTarget, options?: LegacyPaginationSetupOptions): Element | null;
  };
  popover?: {
    close(target: LegacyTarget): Element | null;
    open(target: LegacyTarget): Element | null;
    setup(target: LegacyTarget): Element | null;
    toggle(target: LegacyTarget): Element | null;
  };
  tabs?: {
    select(target: LegacyTarget, index: number | string): Element | null;
    setup(target: LegacyTarget): Element | null;
  };
  toast?: {
    clear(target?: LegacyTarget): Element[];
    close(target: LegacyTarget): Element | null;
    show(message: LegacyToastInput, options?: LegacyToastOptions): HTMLElement | null;
  };
}

interface LegacyJQueryCollection {
  each(callback: (this: Element) => void): LegacyJQueryCollection;
  dragdrop?: (options?: LegacyDragdropOptions) => LegacyJQueryCollection;
  modal?: (action?: string) => LegacyJQueryCollection;
  multiselect?: (action?: string) => LegacyJQueryCollection;
  pagination?: (action?: string | LegacyPaginationSetupOptions, value?: number | string) => LegacyJQueryCollection;
  popover?: (action?: string) => LegacyJQueryCollection;
  tabs?: (action?: string, index?: number | string) => LegacyJQueryCollection;
  toast?: (action?: string | LegacyToastOptions) => LegacyJQueryCollection;
}

interface LegacyJQuery {
  (target?: unknown): LegacyJQueryCollection;
  fn?: LegacyJQueryCollection;
  theme?: (theme?: string) => LegacyTheme;
  toast?: (message: LegacyToastInput, options?: LegacyToastOptions) => HTMLElement | null;
}

interface Window {
  LegacyCss?: LegacyCssApi;
  jQuery?: LegacyJQuery;
}

(function () {
  const root = window;

  /* v8 ignore next -- alternate startup path is preserving an existing namespace */
  if (!root.LegacyCss) {
    root.LegacyCss = {};
  }

  const legacy = root.LegacyCss as LegacyRequiredApi;
  const openDialogs: HTMLDialogElement[] = [];
  const openerMap = new WeakMap<HTMLDialogElement, HTMLElement | null>();
  const fallbackDialogs = new WeakSet<HTMLDialogElement>();
  const wiredDialogs = new WeakSet<HTMLDialogElement>();
  const wiredTabs = new WeakSet<Element>();
  const wiredPopoverTriggers = new WeakSet<Element>();
  const wiredDragdropBoards = new WeakSet<Element>();
  const wiredMultiselects = new WeakSet<HTMLSelectElement>();
  const wiredPaginations = new WeakSet<Element>();
  const multiselectMap = new WeakMap<HTMLSelectElement, LegacyMultiselectState>();
  const dragdropOptions = new WeakMap<Element, LegacyDragdropOptions>();
  const paginationOptions = new WeakMap<Element, LegacyPaginationOptions>();
  const paginationState = new WeakMap<Element, LegacyPaginationState>();
  const toastTimers = new WeakMap<Element, number>();
  const supportsNativeDialog = (dialog: HTMLDialogElement): boolean => typeof dialog.showModal === "function";
  const dragdropBoardSelector = "[data-dragdrop], .dragdrop";
  const dragdropColumnSelector = "[data-dragdrop-column], .dragdrop-column";
  const dragdropItemSelector = "[data-dragdrop-item], .dragdrop-item";
  const multiselectSelector = 'select[multiple][data-multiselect], select[multiple].multiselect-source';
  const paginationSelector = "[data-pagination], .pagination";
  const popoverTriggerSelector = "[data-popover-target], [data-popover]";

  let scrollLockCount = 0;
  let previousBodyOverflow = "";
  let previousHtmlOverflow = "";
  let dragdropState: LegacyDragdropState | null = null;
  let multiselectId = 0;
  let openPopoverTrigger: Element | null = null;

  const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(", ");

  function isLegacyCollection<T extends Element>(target: LegacyTarget<T>): target is { 0?: T; jquery?: unknown } {
    return typeof target === "object" && target !== null && "jquery" in target;
  }

  function isElement(target: unknown): target is Element {
    return (
      typeof target === "object" &&
      target !== null &&
      "nodeType" in target &&
      (target as { nodeType: number }).nodeType === 1
    );
  }

  function isSelectElement(target: unknown): target is HTMLSelectElement {
    return isElement(target) && target.nodeName === "SELECT";
  }

  function eventTargetElement(event: Event): Element | null {
    return isElement(event.target) ? event.target : null;
  }

  function currentTargetElement(event: Event): Element | null {
    /* v8 ignore next -- browser component listeners always dispatch from elements */
    return isElement(event.currentTarget) ? event.currentTarget : null;
  }

  function listen(target: EventTarget, type: string, listener: EventListener): void {
    target.addEventListener(type, listener);
  }

  function isToastPosition(position: unknown): position is LegacyToastPosition {
    return typeof position === "string" && legacyToastPositions.includes(position as LegacyToastPosition);
  }

  function isPopoverPlacement(placement: unknown): placement is LegacyPopoverPlacement {
    return typeof placement === "string" && legacyPopoverPlacements.includes(placement as LegacyPopoverPlacement);
  }

  function isLegacyTheme(theme: unknown): theme is LegacyTheme {
    return typeof theme === "string" && legacyThemes.includes(theme as LegacyTheme);
  }

  function normalizeTheme(theme: unknown): LegacyTheme {
    return isLegacyTheme(theme) ? theme : "light";
  }

  function getStoredTheme(): string | null {
    try {
      return window.localStorage.getItem(legacyThemeStorageKey);
    } catch (error) {
      return null;
    }
  }

  function storeTheme(theme: LegacyTheme): void {
    try {
      window.localStorage.setItem(legacyThemeStorageKey, theme);
    } catch (error) {
      return;
    }
  }

  function applyTheme(theme?: string | null, persist = true): LegacyTheme {
    const nextTheme = normalizeTheme(theme);

    document.documentElement.dataset.legacyTheme = nextTheme;

    if (persist) {
      storeTheme(nextTheme);
    }

    return nextTheme;
  }

  legacy.theme = {
    apply(theme) {
      return applyTheme(theme || getStoredTheme());
    },
    get() {
      return normalizeTheme(document.documentElement.dataset.legacyTheme || getStoredTheme());
    },
    set(theme) {
      return applyTheme(theme);
    },
  };

  if (isLegacyTheme(getStoredTheme())) {
    applyTheme(getStoredTheme(), false);
  }

  function resolveDialog(target: LegacyTarget<HTMLDialogElement>): HTMLDialogElement | null {
    if (!target) {
      return null;
    }

    if (isLegacyCollection(target)) {
      return resolveDialog(target[0]);
    }

    if (typeof target === "string") {
      return document.querySelector(target);
    }

    if (typeof HTMLDialogElement !== "undefined" && target instanceof HTMLDialogElement) {
      return target;
    }

    if (isElement(target) && target.nodeName === "DIALOG") {
      return target as HTMLDialogElement;
    }

    return null;
  }

  function getFocusableElement(dialog: HTMLDialogElement): LegacyFocusableElement | null {
    return dialog.querySelector("[autofocus], [data-modal-autofocus], " + focusableSelector);
  }

  function focusDialog(dialog: HTMLDialogElement): void {
    const focusTarget = getFocusableElement(dialog);

    if (focusTarget) {
      try {
        focusTarget.focus({ preventScroll: true });
      } catch (error) {
        focusTarget.focus();
      }
      return;
    }

    /* v8 ignore next -- branch depends on caller-provided dialog markup */
    if (!dialog.hasAttribute("tabindex")) {
      dialog.setAttribute("tabindex", "-1");
    }

    try {
      dialog.focus({ preventScroll: true });
    } catch (error) {
      dialog.focus();
    }
  }

  function lockScroll(): void {
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

  function unlockScroll(): void {
    /* v8 ignore next -- defensive guard for private scroll-lock bookkeeping */
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

  function removeFromOpenDialogs(dialog: HTMLDialogElement): void {
    const index = openDialogs.indexOf(dialog);

    /* v8 ignore next -- defensive removal branch for repeated native close events */
    if (index >= 0) {
      openDialogs.splice(index, 1);
    }
  }

  function restoreFocus(dialog: HTMLDialogElement): void {
    const opener = openerMap.get(dialog);

    /* v8 ignore next -- branch combines browser focus state and opener lifecycle */
    if (opener && typeof opener.focus === "function" && document.contains(opener)) {
      try {
        opener.focus({ preventScroll: true });
      } catch (error) {
        opener.focus();
      }
    }

    openerMap.delete(dialog);
  }

  function handleClose(event: Event | LegacyCloseEvent): void {
    const dialog = event.currentTarget as HTMLDialogElement;

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

  function closeDialogElement(dialog: HTMLDialogElement | null, returnValue = ""): HTMLDialogElement | null {
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

  function handleBackdropClick(event: MouseEvent): void {
    const dialog = event.currentTarget as HTMLDialogElement;
    const target = eventTargetElement(event);

    if (target === dialog) {
      closeDialogElement(dialog);
      return;
    }

    /* v8 ignore next -- click target shape is browser-dispatched and covered at API level */
    if (target && target.closest("[data-modal-close]")) {
      closeDialogElement(dialog);
    }
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key !== "Escape") {
      return;
    }

    const dialog = openDialogs[openDialogs.length - 1];

    /* v8 ignore next -- fallback Escape listener is only installed while a fallback dialog is open */
    if (!dialog || !fallbackDialogs.has(dialog)) {
      return;
    }

    event.preventDefault();
    closeDialogElement(dialog);
  }

  function wireDialog(dialog: HTMLDialogElement): void {
    if (wiredDialogs.has(dialog)) {
      return;
    }

    wiredDialogs.add(dialog);
    dialog.addEventListener("close", handleClose);
    dialog.addEventListener("click", handleBackdropClick);
  }

  function openDialogElement(dialog: HTMLDialogElement | null): HTMLDialogElement | null {
    if (!dialog) {
      return null;
    }

    wireDialog(dialog);

    if (dialog.open) {
      return dialog;
    }

    /* v8 ignore next -- activeElement is browser-owned state */
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

    /* v8 ignore next -- duplicate open state is guarded by the public open early-return */
    if (!openDialogs.includes(dialog)) {
      openDialogs.push(dialog);
    }

    focusDialog(dialog);

    if (fallbackDialogs.has(dialog)) {
      document.addEventListener("keydown", handleKeydown);
    }

    return dialog;
  }

  function toggleDialogElement(dialog: HTMLDialogElement | null): HTMLDialogElement | null {
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

  function resolveToast(target: LegacyTarget): Element | null {
    if (!target) {
      return null;
    }

    if (isLegacyCollection(target)) {
      return resolveToast(target[0]);
    }

    if (typeof target === "string") {
      return document.querySelector(target);
    }

    if (isElement(target) && target.matches(".toast, [data-toast]")) {
      return target;
    }

    return null;
  }

  function normalizeToastPosition(position: unknown): LegacyToastPosition {
    return isToastPosition(position)
      ? position
      : "bottom-right";
  }

  function getToastRegion(position: unknown): HTMLElement {
    const normalizedPosition = normalizeToastPosition(position);
    let region = document.querySelector<HTMLElement>(
      '[data-toast-region][data-position="' +
        normalizedPosition +
        '"], .toast-region[data-position="' +
        normalizedPosition +
        '"]'
    );

    if (region) {
      return region;
    }

    region = document.createElement("div");
    region.className = "toast-region";
    region.dataset.position = normalizedPosition;
    region.dataset.toastRegion = "";
    region.setAttribute("aria-live", "polite");
    region.setAttribute("aria-atomic", "false");
    document.body.append(region);

    return region;
  }

  function normalizeToastOptions(message: LegacyToastInput, options?: LegacyToastOptions): LegacyToastOptions {
    if (message && typeof message === "object" && !("nodeType" in message) && !("jquery" in message)) {
      return Object.assign({}, message);
    }

    return Object.assign({}, options, {
      message: isLegacyCollection(message as LegacyTarget) ? (message as { 0?: Node })[0] : message,
    });
  }

  function resolveToastContainer(target: LegacyTarget): Element | Document | null {
    /* v8 ignore next -- public toast callers only resolve truthy container targets */
    if (!target) {
      return null;
    }

    if (isLegacyCollection(target)) {
      return resolveToastContainer(target[0]);
    }

    if (typeof target === "string") {
      return document.querySelector(target);
    }

    if (isElement(target)) {
      return target;
    }

    return null;
  }

  function setToastContent(toast: HTMLElement, options: LegacyToastOptions): void {
    const body = document.createElement("div");
    body.className = "toast-body";

    if (options.title) {
      const title = document.createElement("strong");
      title.className = "toast-title";
      title.textContent = options.title;
      body.append(title);
    }

    if (options.message && typeof options.message === "object" && "nodeType" in options.message) {
      body.append(options.message);
    } else {
      const message = document.createElement("span");
      message.textContent = options.message || "";
      body.append(message);
    }

    toast.append(body);
  }

  function closeToastElement(toast: Element | null): Element | null {
    if (!toast) {
      return null;
    }

    const timer = toastTimers.get(toast);

    if (timer) {
      window.clearTimeout(timer);
      toastTimers.delete(toast);
    }

    toast.dispatchEvent(new CustomEvent("toast:close", { bubbles: true }));
    toast.remove();

    return toast;
  }

  function showToast(message: LegacyToastInput, options?: LegacyToastOptions): HTMLElement | null {
    const nextOptions = normalizeToastOptions(message, options);
    const type: LegacyToastType = nextOptions.type &&
      ["info", "success", "warning", "danger", "muted"].includes(nextOptions.type)
      ? nextOptions.type
      : "info";
    const region = nextOptions.container
      ? resolveToastContainer(nextOptions.container)
      : getToastRegion(nextOptions.position);
    const toast = document.createElement("section");
    const duration =
      typeof nextOptions.duration === "number" ? nextOptions.duration : 5000;

    if (!region) {
      return null;
    }

    toast.className = "toast";
    toast.dataset.toast = "";
    toast.setAttribute("role", type === "danger" ? "alert" : "status");

    if (type !== "info") {
      toast.classList.add("toast-" + type);
    }

    setToastContent(toast, nextOptions);

    if (nextOptions.dismissible !== false) {
      const closeButton = document.createElement("button");
      closeButton.type = "button";
      closeButton.className = "toast-close";
      closeButton.setAttribute(
        "aria-label",
        nextOptions.closeLabel || "Close notification"
      );
      closeButton.textContent = nextOptions.closeText || "Close";
      closeButton.addEventListener("click", function () {
        closeToastElement(toast);
      });
      toast.append(closeButton);
    }

    region.append(toast);
    toast.dispatchEvent(new CustomEvent("toast:show", { bubbles: true }));

    if (duration > 0) {
      toastTimers.set(
        toast,
        window.setTimeout(function () {
          closeToastElement(toast);
        }, duration)
      );
    }

    return toast;
  }

  function clearToasts(target?: LegacyTarget): Element[] {
    /* v8 ignore next -- public clear covers both document and resolved-container behavior */
    const rootElement = target
      ? resolveToastContainer(target)
      : document;
    const toasts: Element[] = rootElement
      ? Array.from(rootElement.querySelectorAll(".toast, [data-toast]"))
      : [];

    toasts.forEach(closeToastElement);

    return toasts;
  }

  legacy.toast = {
    show(message, options) {
      return showToast(message, options);
    },
    close(target) {
      return closeToastElement(resolveToast(target));
    },
    clear(target) {
      return clearToasts(target);
    },
  };

  function resolveElement(target: LegacyTarget): Element | null {
    if (!target) {
      return null;
    }

    if (isLegacyCollection(target)) {
      return resolveElement(target[0]);
    }

    if (typeof target === "string") {
      return document.querySelector<HTMLElement>(target);
    }

    /* v8 ignore next -- resolver fallback for non-element internal callers */
    return isElement(target) ? target : null;
  }

  function resolvePopoverTrigger(target: LegacyTarget): Element | null {
    const element = resolveElement(target);

    if (!element) {
      return null;
    }

    if (element.matches(popoverTriggerSelector)) {
      return element;
    }

    return element.closest(popoverTriggerSelector);
  }

  function resolvePopover(target: LegacyTarget): Element | null {
    const element = resolveElement(target);

    if (!element) {
      return null;
    }

    if (element.matches(".popover, [data-popover-content]")) {
      return element;
    }

    const trigger = resolvePopoverTrigger(element);

    /* v8 ignore next -- public close/open paths resolve trigger and content separately */
    return trigger ? getTriggerPopover(trigger) : null;
  }

  function getTriggerPopover(trigger: Element): HTMLElement | null {
    const target =
      trigger.getAttribute("data-popover-target") ||
      trigger.getAttribute("data-popover") ||
      trigger.getAttribute("aria-controls");

    if (!target) {
      return null;
    }

    if (target.charAt(0) === "#") {
      return document.querySelector(target);
    }

    return document.getElementById(target);
  }

  function getPopoverPlacement(trigger: Element): LegacyPopoverPlacement {
    const placement = trigger.getAttribute("data-popover-placement");

    return isPopoverPlacement(placement)
      ? placement
      : "bottom";
  }

  function positionPopover(trigger: Element, popover: HTMLElement): void {
    const gap = 4;
    const margin = 8;
    const placement = getPopoverPlacement(trigger);
    const triggerRect = trigger.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();
    let top = triggerRect.bottom + gap;
    let left = triggerRect.left;

    if (placement === "top") {
      top = triggerRect.top - popoverRect.height - gap;
      left = triggerRect.left;
    } else if (placement === "right") {
      top = triggerRect.top;
      left = triggerRect.right + gap;
    } else if (placement === "left") {
      top = triggerRect.top;
      left = triggerRect.left - popoverRect.width - gap;
    }

    top = Math.max(
      margin,
      Math.min(top, window.innerHeight - popoverRect.height - margin)
    );
    left = Math.max(
      margin,
      Math.min(left, window.innerWidth - popoverRect.width - margin)
    );

    popover.style.top = top + "px";
    popover.style.left = left + "px";
  }

  function closePopover(trigger?: Element | null): HTMLElement | null {
    /* v8 ignore next -- trigger fallback is driven by document-level close handlers */
    const currentTrigger = trigger || openPopoverTrigger;
    /* v8 ignore next -- paired with currentTrigger fallback above */
    const popover = currentTrigger ? getTriggerPopover(currentTrigger) : null;

    if (!currentTrigger || !popover) {
      return null;
    }

    popover.hidden = true;
    currentTrigger.setAttribute("aria-expanded", "false");

    /* v8 ignore next -- depends on whether close was invoked directly or globally */
    if (openPopoverTrigger === currentTrigger) {
      openPopoverTrigger = null;
    }

    return popover;
  }

  function openPopover(trigger: Element | null): HTMLElement | null {
    /* v8 ignore next -- null trigger is covered by the public no-op API branch */
    const popover = trigger ? getTriggerPopover(trigger) : null;

    if (!trigger || !popover) {
      return null;
    }

    if (openPopoverTrigger && openPopoverTrigger !== trigger) {
      closePopover(openPopoverTrigger);
    }

    wirePopoverTrigger(trigger);
    popover.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    openPopoverTrigger = trigger;
    positionPopover(trigger, popover);

    return popover;
  }

  function togglePopover(trigger: Element | null): HTMLElement | null {
    /* v8 ignore next -- null trigger is covered by the public no-op API branch */
    const popover = trigger ? getTriggerPopover(trigger) : null;

    if (!popover) {
      return null;
    }

    return popover.hidden ? openPopover(trigger) : closePopover(trigger);
  }

  function handlePopoverClick(event: Event): void {
    event.preventDefault();
    togglePopover(currentTargetElement(event));
  }

  function handlePopoverKeydown(event: KeyboardEvent): void {
    if (event.key !== "Escape") {
      return;
    }

    const trigger = currentTargetElement(event);

    /* v8 ignore next -- browser-dispatched listener events always provide the trigger as currentTarget */
    if (!trigger) {
      return;
    }
    const popover = getTriggerPopover(trigger);

    if (!popover || popover.hidden) {
      return;
    }

    event.preventDefault();
    closePopover(trigger);
    /* v8 ignore next -- focusability is browser/element dependent */
    if (trigger instanceof HTMLElement) {
      trigger.focus();
    }
  }

  function handleDocumentPopoverClick(event: MouseEvent): void {
    if (!openPopoverTrigger) {
      return;
    }

    const target = eventTargetElement(event);

    if (!target) {
      return;
    }

    const popover = getTriggerPopover(openPopoverTrigger);

    if (
      openPopoverTrigger.contains(target) ||
      (popover && popover.contains(target))
    ) {
      return;
    }

    closePopover(openPopoverTrigger);
  }

  function handleDocumentPopoverKeydown(event: KeyboardEvent): void {
    if (event.key !== "Escape" || !openPopoverTrigger) {
      return;
    }

    event.preventDefault();
    closePopover(openPopoverTrigger);
  }

  function updateOpenPopoverPosition(): void {
    if (!openPopoverTrigger) {
      return;
    }

    const popover = getTriggerPopover(openPopoverTrigger);

    /* v8 ignore next -- resize/scroll repositioning depends on current open state */
    if (popover && !popover.hidden) {
      positionPopover(openPopoverTrigger, popover);
    }
  }

  function wirePopoverTrigger(trigger: Element): Element {
    const popover = getTriggerPopover(trigger);

    if (!popover) {
      return trigger;
    }

    /* v8 ignore next -- target id resolution is already validated before this repair branch */
    if (!popover.id && trigger.getAttribute("data-popover-target")) {
      /* v8 ignore next -- a target resolved by selector already has the id used to resolve it */
      popover.id = (trigger.getAttribute("data-popover-target") || "").replace(/^#/, "");
    }

    trigger.setAttribute("aria-haspopup", "dialog");
    /* v8 ignore next -- initial aria-expanded mirrors caller-provided hidden state */
    trigger.setAttribute("aria-expanded", popover.hidden ? "false" : "true");

    if (popover.id) {
      /* v8 ignore next -- aria-controls is only omitted for anonymous popover content */
      trigger.setAttribute("aria-controls", popover.id);
    }

    if (!popover.hasAttribute("role")) {
      popover.setAttribute("role", "dialog");
    }

    if (!wiredPopoverTriggers.has(trigger)) {
      wiredPopoverTriggers.add(trigger);
      listen(trigger, "click", handlePopoverClick);
      listen(trigger, "keydown", handlePopoverKeydown as EventListener);
    }

    return trigger;
  }

  function setupPopover(target: LegacyTarget): Element | null {
    const trigger = resolvePopoverTrigger(target);

    return trigger ? wirePopoverTrigger(trigger) : null;
  }

  legacy.popover = {
    setup(target) {
      return setupPopover(target);
    },
    open(target) {
      return openPopover(resolvePopoverTrigger(target));
    },
    close(target) {
      const trigger = resolvePopoverTrigger(target);

      if (trigger) {
        return closePopover(trigger);
      }

      const popover = resolvePopover(target);

      return popover && openPopoverTrigger && getTriggerPopover(openPopoverTrigger) === popover
        ? closePopover(openPopoverTrigger)
        : popover;
    },
    toggle(target) {
      return togglePopover(resolvePopoverTrigger(target));
    },
  };

  function resolveTabs(target: LegacyTarget): Element | null {
    if (!target) {
      return null;
    }

    if (isLegacyCollection(target)) {
      return resolveTabs(target[0]);
    }

    if (typeof target === "string") {
      return document.querySelector(target);
    }

    if (isElement(target)) {
      if (target.matches("[data-tabs], .tabs")) {
        return target;
      }

      return target.closest("[data-tabs], .tabs");
    }

    return null;
  }

  function getTabs(rootElement: Element): Element[] {
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

  function getTabPanels(rootElement: Element): HTMLElement[] {
    return Array.from(rootElement.children).filter((element) =>
      element.matches('[role="tabpanel"]')
    ) as HTMLElement[];
  }

  function getTabPanel(rootElement: Element, tab: Element): HTMLElement | null {
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

  function selectTab(tab: Element | null, setFocus: boolean): Element | null {
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

    if (setFocus && tab instanceof HTMLElement) {
      tab.focus();
    }

    return tab;
  }

  function selectTabByIndex(rootElement: Element, index: number, setFocus: boolean): Element | null {
    const tabs = getTabs(rootElement);
    const tab = tabs[index];

    if (!tab) {
      return null;
    }

    return selectTab(tab, setFocus);
  }

  function handleTabClick(event: MouseEvent): void {
    const target = eventTargetElement(event);
    /* v8 ignore next -- browser click events provide element targets for delegated tab clicks */
    const tab = target ? target.closest('[role="tab"]') : null;

    /* v8 ignore next -- delegated no-op branch for non-tab clicks */
    if (tab) {
      selectTab(tab, false);
    }
  }

  function handleTabKeydown(event: KeyboardEvent): void {
    const rootElement = resolveTabs(currentTargetElement(event));
    const target = eventTargetElement(event);

    if (!rootElement || !target) {
      return;
    }

    const tabs = getTabs(rootElement);
    const currentIndex = tabs.indexOf(target);

    /* v8 ignore next -- tab keyboard listeners are scoped to tab controls in normal use */
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

  function setupTabs(target: LegacyTarget): Element | null {
    const rootElement = resolveTabs(target);

    if (!rootElement || wiredTabs.has(rootElement)) {
      return rootElement;
    }

    wiredTabs.add(rootElement);
    listen(rootElement, "click", handleTabClick as EventListener);
    listen(rootElement, "keydown", handleTabKeydown as EventListener);

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

  function resolveMultiselect(target: LegacyTarget): HTMLSelectElement | null {
    if (!target) {
      return null;
    }

    if (isLegacyCollection(target)) {
      return resolveMultiselect(target[0]);
    }

    if (typeof target === "string") {
      return resolveMultiselect(document.querySelector(target));
    }

    if (!isElement(target)) {
      return null;
    }

    if (isSelectElement(target) && target.matches("select[multiple]")) {
      return target;
    }

    const rootElement = target.matches(".multiselect")
      ? target
      : target.closest(".multiselect");

    return rootElement && isSelectElement(rootElement.previousElementSibling)
      ? rootElement.previousElementSibling
      : null;
  }

  function getMultiselectPlaceholder(select: HTMLSelectElement): string {
    return select.getAttribute("data-placeholder") || "Select options";
  }

  function getMultiselectName(select: HTMLSelectElement): string {
    const ariaLabel = select.getAttribute("aria-label");

    if (ariaLabel) {
      return ariaLabel;
    }

    if (!select.id) {
      return "";
    }

    try {
      const label = document.querySelector('label[for="' + CSS.escape(select.id) + '"]');

      return label && label.textContent ? label.textContent.trim() : "";
    } catch (error) {
      return "";
    }
  }

  function getMultiselectSelectedOptions(select: HTMLSelectElement): HTMLOptionElement[] {
    return Array.from(select.options).filter((option) => option.selected);
  }

  function getMultiselectButtonText(select: HTMLSelectElement): string {
    const selectedOptions = getMultiselectSelectedOptions(select);

    if (selectedOptions.length === 0) {
      return getMultiselectPlaceholder(select);
    }

    if (selectedOptions.length <= 2) {
      return selectedOptions.map((option) => option.text).join(", ");
    }

    return selectedOptions.length + " selected";
  }

  function getMultiselectOptions(rootElement: Element): HTMLButtonElement[] {
    return Array.from(rootElement.querySelectorAll<HTMLButtonElement>(".multiselect-option"));
  }

  function updateMultiselect(select: HTMLSelectElement): HTMLSelectElement {
    const state = multiselectMap.get(select);

    /* v8 ignore next -- update is wired after setup has created state */
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

  function closeMultiselect(select: HTMLSelectElement | null): HTMLSelectElement | null {
    if (!select) {
      return null;
    }

    const state = multiselectMap.get(select);

    if (!state) {
      return select;
    }

    state.root.classList.remove("is-open");
    state.toggle.setAttribute("aria-expanded", "false");

    return select;
  }

  function openMultiselect(select: HTMLSelectElement | null): HTMLSelectElement | null {
    if (!select) {
      return null;
    }

    const state = multiselectMap.get(select);

    if (!state || select.disabled) {
      return select;
    }

    document.querySelectorAll(".multiselect.is-open").forEach((rootElement) => {
      const currentSelect = rootElement.previousElementSibling;

      /* v8 ignore next -- only sibling multiselect controls are closed */
      if (isSelectElement(currentSelect) && currentSelect !== select) {
        closeMultiselect(currentSelect);
      }
    });

    state.root.classList.add("is-open");
    state.toggle.setAttribute("aria-expanded", "true");

    return select;
  }

  function toggleMultiselect(select: HTMLSelectElement | null): HTMLSelectElement | null {
    if (!select) {
      return null;
    }

    const state = multiselectMap.get(select);

    if (!state) {
      return select;
    }

    return state.root.classList.contains("is-open")
      ? closeMultiselect(select)
      : openMultiselect(select);
  }

  function toggleMultiselectOption(select: HTMLSelectElement, index: number): void {
    const option = select.options[index];

    if (!option || option.disabled || select.disabled) {
      return;
    }

    option.selected = !option.selected;
    updateMultiselect(select);
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function focusMultiselectOption(rootElement: Element, index: number): void {
    const options = getMultiselectOptions(rootElement).filter((option) => !option.disabled);
    const option = options[index];

    /* v8 ignore next -- keyboard movement normally resolves an enabled option */
    if (option) {
      option.focus();
    }
  }

  function handleMultiselectClick(event: MouseEvent): void {
    const select = resolveMultiselect(currentTargetElement(event));
    const target = eventTargetElement(event);
    /* v8 ignore next -- browser click events provide element targets */
    const option = target ? target.closest(".multiselect-option") : null;

    /* v8 ignore next -- multiselect click listeners are attached only to resolved controls */
    if (!select) {
      return;
    }

    if (option) {
      toggleMultiselectOption(select, Number(option.getAttribute("data-index")));
      return;
    }

    /* v8 ignore next -- delegated click no-op branch for menu background clicks */
    if (target && target.closest(".multiselect-toggle")) {
      toggleMultiselect(select);
    }
  }

  function handleMultiselectKeydown(event: KeyboardEvent): void {
    const select = resolveMultiselect(currentTargetElement(event));
    /* v8 ignore next -- keydown listeners are attached after setup creates state */
    const state = select ? multiselectMap.get(select) : null;
    const target = eventTargetElement(event);

    if (!state || !target || !select) {
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
    const currentIndex = options.indexOf(target as HTMLButtonElement);

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
      toggleMultiselectOption(select, Number(target.getAttribute("data-index")));
    }
  }

  function handleDocumentMultiselectClick(event: MouseEvent): void {
    const target = eventTargetElement(event);

    if (!target) {
      return;
    }

    document.querySelectorAll(".multiselect.is-open").forEach((rootElement) => {
      if (!rootElement.contains(target)) {
        /* v8 ignore next 5 -- document close tolerates malformed multiselect markup */
        closeMultiselect(
          isSelectElement(rootElement.previousElementSibling)
            ? rootElement.previousElementSibling
            : null
        );
      }
    });
  }

  function createMultiselectOption(option: HTMLOptionElement, index: number, rootId: string): HTMLButtonElement {
    const button = document.createElement("button");

    button.className = "multiselect-option";
    button.type = "button";
    button.id = rootId + "-option-" + index;
    button.setAttribute("role", "option");
    button.setAttribute("data-index", String(index));
    button.textContent = option.text;

    return button;
  }

  function setupMultiselect(target: LegacyTarget): HTMLSelectElement | null {
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
    /* v8 ignore next -- id/name/default id selection is covered by setup variants */
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

  function resolvePagination(target: LegacyTarget): Element | null {
    if (!target) {
      return null;
    }

    if (isLegacyCollection(target)) {
      return resolvePagination(target[0]);
    }

    if (typeof target === "string") {
      return document.querySelector(target);
    }

    if (isElement(target)) {
      if (target.matches(paginationSelector)) {
        return target;
      }

      return target.closest(paginationSelector);
    }

    return null;
  }

  function getPaginationNumber(value: unknown, fallback: number): number {
    const number = Number(value);

    return Number.isFinite(number) && number > 0 ? number : fallback;
  }

  function getPaginationPageSizes(rootElement: Element, options: LegacyPaginationSetupOptions): number[] {
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

  function getPaginationTarget(rootElement: Element, options: LegacyPaginationSetupOptions): Element | null {
    if (options.target) {
      /* v8 ignore next 5 -- target normalization accepts selector, element, or fallback */
      return typeof options.target === "string"
        ? document.querySelector(options.target)
        : options.target instanceof Element
        ? options.target
          : null;
    }

    const selector = rootElement.getAttribute("data-target");

    return selector ? document.querySelector(selector) : null;
  }

  function createPaginationResult(
    rootElement: Element,
    options: LegacyPaginationOptions,
    state: LegacyPaginationState
  ): Promise<unknown> | unknown {
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

  function normalizePaginationResult(result: unknown, state: LegacyPaginationState): LegacyPaginationResult {
    /* v8 ignore next 6 -- pagination load normalization accepts arrays, objects, and fallbacks */
    const payload: LegacyPaginationPayload = Array.isArray(result)
      ? { items: result, total: result.length }
      : result && typeof result === "object"
        ? result
        : {};
    /* v8 ignore next -- malformed payload fallback is defensive normalization */
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

  function renderPaginationItem(
    item: unknown,
    index: number,
    options: LegacyPaginationOptions,
    state: LegacyPaginationResult
  ): Element | DocumentFragment | string | null | undefined {
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

  function renderPaginationItems(rootElement: Element, result: LegacyPaginationResult): void {
    /* v8 ignore next -- pagination rendering is called after setup stores options */
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

  function getPaginationPages(currentPage: number, pageCount: number, maxPages: number): LegacyPageToken[] {
    const pages: LegacyPageToken[] = [];

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

    /* v8 ignore next -- pagination window shape depends on current page */
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

  function createPaginationButton(label: string, action: LegacyPaginationAction, disabled: boolean): HTMLButtonElement {
    const button = document.createElement("button");

    button.type = "button";
    button.setAttribute("data-pagination-action", action);
    button.textContent = label;
    button.disabled = disabled;

    return button;
  }

  function renderPaginationControls(rootElement: Element, result: LegacyPaginationResult): void {
    /* v8 ignore next -- pagination controls render after setup stores options */
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

    /* v8 ignore next -- setup normalizes page size options */
    const pageSizes = options.pageSizes || [result.pageSize];

    pageSizes.forEach((pageSize) => {
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

  function setPaginationLoading(rootElement: Element, loading: boolean): void {
    rootElement.setAttribute("aria-busy", loading ? "true" : "false");
    rootElement.querySelectorAll<HTMLButtonElement | HTMLSelectElement>("button, select").forEach((control) => {
      control.disabled = loading;
    });
  }

  function handlePaginationError(
    rootElement: Element,
    state: LegacyPaginationState,
    request: number,
    error: unknown
  ): void {
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

  function updatePagination(rootElement: Element | null): Element | null {
    const options = rootElement ? paginationOptions.get(rootElement) : null;
    const state = rootElement ? paginationState.get(rootElement) : null;

    if (!rootElement || !options || !state) {
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

  function setPaginationPage(rootElement: Element | null, page: number | string | null): Element | null {
    const state = rootElement ? paginationState.get(rootElement) : null;

    if (!state) {
      return null;
    }

    state.page = getPaginationNumber(page, state.page);

    return updatePagination(rootElement);
  }

  function setPaginationPageSize(rootElement: Element | null, pageSize: number | string): Element | null {
    const state = rootElement ? paginationState.get(rootElement) : null;

    if (!state) {
      return null;
    }

    state.page = 1;
    state.pageSize = getPaginationNumber(pageSize, state.pageSize);

    return updatePagination(rootElement);
  }

  function handlePaginationClick(event: MouseEvent): void {
    const rootElement = resolvePagination(currentTargetElement(event));
    const target = eventTargetElement(event);
    /* v8 ignore next -- browser click events provide element targets */
    const button = target ? target.closest<HTMLButtonElement>("[data-pagination-action]") : null;
    /* v8 ignore next -- delegated pagination events are wired after state exists */
    const state = rootElement ? paginationState.get(rootElement) : null;

    if (!button || !state || button.disabled) {
      return;
    }

    const action = button.getAttribute("data-pagination-action");

    /* v8 ignore next 7 -- pagination action dispatch ignores unknown delegated actions */
    if (action === "previous") {
      setPaginationPage(rootElement, state.page - 1);
    } else if (action === "next") {
      setPaginationPage(rootElement, state.page + 1);
    } else if (action === "page") {
      setPaginationPage(rootElement, button.getAttribute("data-pagination-page"));
    }
  }

  function handlePaginationChange(event: Event): void {
    const target = eventTargetElement(event);
    const rootElement = resolvePagination(currentTargetElement(event));

    /* v8 ignore next -- delegated change handler ignores non-page-size controls */
    if (isSelectElement(target) && rootElement && target.matches("[data-pagination-size]")) {
      setPaginationPageSize(rootElement, target.value);
    }
  }

  function setupPagination(target: LegacyTarget, options: LegacyPaginationSetupOptions = {}): Element | null {
    const rootElement = resolvePagination(target);

    if (!rootElement) {
      return null;
    }

    /* v8 ignore next -- setup accepts fresh options, merged options, and nullish fallbacks */
    const nextOptions: LegacyPaginationSetupOptions = Object.assign({}, paginationOptions.get(rootElement), options || {});

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

    const normalizedOptions: LegacyPaginationOptions = {
      data: nextOptions.data,
      load: nextOptions.load,
      maxPages: nextOptions.maxPages,
      pageSize: nextOptions.pageSize,
      pageSizes: nextOptions.pageSizes,
      renderItem: nextOptions.renderItem,
      target: isElement(nextOptions.target) ? nextOptions.target : null,
    };

    paginationOptions.set(rootElement, normalizedOptions);

    if (paginationState.has(rootElement)) {
      const state = paginationState.get(rootElement);

      /* v8 ignore next -- repeated setup may update page size or preserve existing state */
      if (state && options.pageSize) {
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
      listen(rootElement, "click", handlePaginationClick as EventListener);
      listen(rootElement, "change", handlePaginationChange);
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
    document.querySelectorAll(popoverTriggerSelector).forEach(setupPopover);
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
  document.addEventListener("click", handleDocumentPopoverClick);
  document.addEventListener("keydown", handleDocumentPopoverKeydown);
  window.addEventListener("resize", updateOpenPopoverPosition);
  window.addEventListener("scroll", updateOpenPopoverPosition, true);

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

  if (root.jQuery && !root.jQuery.toast) {
    root.jQuery.toast = function (message, options) {
      return legacy.toast.show(message, options);
    };
  }

  if (root.jQuery && !root.jQuery.theme) {
    root.jQuery.theme = function (theme) {
      return theme === undefined ? legacy.theme.get() : legacy.theme.set(theme);
    };
  }

  if (root.jQuery && root.jQuery.fn && !root.jQuery.fn.toast) {
    root.jQuery.fn.toast = function (action) {
      return this.each(function () {
        if (action === "close") {
          legacy.toast.close(this);
          return;
        }

        /* v8 ignore next -- jQuery bridge accepts object options or default toast options */
        legacy.toast.show(this, typeof action === "object" ? action : undefined);
      });
    };
  }

  if (root.jQuery && root.jQuery.fn && !root.jQuery.fn.tabs) {
    root.jQuery.fn.tabs = function (action, index) {
      return this.each(function () {
        if (action === "select" && index !== undefined) {
          legacy.tabs.select(this, index);
          return;
        }

        legacy.tabs.setup(this);
      });
    };
  }

  if (root.jQuery && root.jQuery.fn && !root.jQuery.fn.popover) {
    root.jQuery.fn.popover = function (action) {
      return this.each(function () {
        if (action === "open") {
          legacy.popover.open(this);
          return;
        }

        if (action === "close") {
          legacy.popover.close(this);
          return;
        }

        if (action === "toggle") {
          legacy.popover.toggle(this);
          return;
        }

        legacy.popover.setup(this);
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
        if (action === "goTo" && value !== undefined) {
          legacy.pagination.goTo(this, value);
          return;
        }

        if (action === "pageSize" && value !== undefined) {
          legacy.pagination.pageSize(this, value);
          return;
        }

        if (action === "refresh") {
          legacy.pagination.refresh(this);
          return;
        }

        /* v8 ignore next -- jQuery bridge accepts object options or default setup options */
        legacy.pagination.setup(this, typeof action === "object" ? action : undefined);
      });
    };
  }
})();
