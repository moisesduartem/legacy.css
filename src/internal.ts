export type LegacyTarget<T extends Element = Element> =
  | string
  | T
  | { 0?: T; jquery?: unknown; nodeType?: number }
  | null
  | undefined;

export type LegacyRequiredApi = {
  [Key in keyof LegacyCssApi]-?: LegacyCssApi[Key];
};

export type LegacyFocusableElement = HTMLElement | SVGElement;
export type LegacyPageToken = number | "ellipsis-start" | "ellipsis-end";
export type LegacyPaginationAction = "previous" | "next" | "page";
export type LegacyTheme = "light" | "dark";

export interface LegacyDragdropState {
  board: Element;
  item: Element;
  fromColumn: Element;
  fromIndex: number;
}

export interface LegacyMultiselectState {
  label: HTMLSpanElement;
  menu: HTMLDivElement;
  options: HTMLButtonElement[];
  root: HTMLDivElement;
  toggle: HTMLButtonElement;
}

export interface LegacyCloseEvent {
  currentTarget: HTMLDialogElement;
}

export type LegacyToastType = "info" | "success" | "warning" | "danger" | "muted";
export type LegacyToastPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";
export type LegacyPopoverPlacement = "top" | "right" | "bottom" | "left";

export interface LegacyToastOptions {
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

export type LegacyToastInput = LegacyToastOptions | string | Node | null | undefined;

export interface LegacyDragdropPayload {
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

export interface LegacyDragdropOptions {
  onChangeColumn?: (this: Element, payload: LegacyDragdropPayload) => void;
  onDrag?: (this: Element, payload: LegacyDragdropPayload | null) => void;
  onDrop?: (this: Element, payload: LegacyDragdropPayload) => void;
}

export interface LegacyPaginationState {
  page: number;
  pageSize: number;
  request: number;
  result?: LegacyPaginationResult;
}

export interface LegacyPaginationResult {
  items: unknown[];
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
}

export interface LegacyPaginationOptions {
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

export interface LegacyPaginationSetupOptions extends Omit<LegacyPaginationOptions, "pageSizes" | "target"> {
  pageSizes?: number[] | string;
  target?: LegacyTarget | Element | null;
}

export interface LegacyPaginationPayload {
  items?: unknown;
  page?: unknown;
  pageCount?: unknown;
  pageSize?: unknown;
  total?: unknown;
}

export interface LegacyCssApi {
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

export interface LegacyJQueryCollection {
  each(callback: (this: Element) => void): LegacyJQueryCollection;
  dragdrop?: (options?: LegacyDragdropOptions) => LegacyJQueryCollection;
  modal?: (action?: string) => LegacyJQueryCollection;
  multiselect?: (action?: string) => LegacyJQueryCollection;
  pagination?: (action?: string | LegacyPaginationSetupOptions, value?: number | string) => LegacyJQueryCollection;
  popover?: (action?: string) => LegacyJQueryCollection;
  tabs?: (action?: string, index?: number | string) => LegacyJQueryCollection;
  toast?: (action?: string | LegacyToastOptions) => LegacyJQueryCollection;
}

export interface LegacyJQuery {
  (target?: unknown): LegacyJQueryCollection;
  fn?: LegacyJQueryCollection;
  theme?: (theme?: string) => LegacyTheme;
  toast?: (message: LegacyToastInput, options?: LegacyToastOptions) => HTMLElement | null;
}

declare global {
  interface Window {
    LegacyCss?: LegacyCssApi;
    jQuery?: LegacyJQuery;
  }
}

export function isLegacyCollection<T extends Element>(target: LegacyTarget<T>): target is { 0?: T; jquery?: unknown } {
  return typeof target === "object" && target !== null && "jquery" in target;
}

export function isElement(target: unknown): target is Element {
  return (
    typeof target === "object" &&
    target !== null &&
    "nodeType" in target &&
    (target as { nodeType: number }).nodeType === 1
  );
}

export function isSelectElement(target: unknown): target is HTMLSelectElement {
  return isElement(target) && target.nodeName === "SELECT";
}

export function eventTargetElement(event: Event): Element | null {
  return isElement(event.target) ? event.target : null;
}

export function currentTargetElement(event: Event): Element | null {
  /* v8 ignore next -- browser component listeners always dispatch from elements */
  return isElement(event.currentTarget) ? event.currentTarget : null;
}

export function listen(target: EventTarget, type: string, listener: EventListener): void {
  target.addEventListener(type, listener);
}
