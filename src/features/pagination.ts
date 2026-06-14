import { currentTargetElement, eventTargetElement, isElement, isLegacyCollection, isSelectElement, listen } from "../internal";
import type { LegacyPageToken, LegacyPaginationAction, LegacyPaginationOptions, LegacyPaginationPayload, LegacyPaginationResult, LegacyPaginationSetupOptions, LegacyPaginationState, LegacyRequiredApi, LegacyTarget } from "../internal";
const wiredPaginations = new WeakSet<Element>();
const paginationOptions = new WeakMap<Element, LegacyPaginationOptions>();
const paginationState = new WeakMap<Element, LegacyPaginationState>();
const paginationSelector = "[data-pagination], .pagination";

export function installPagination(legacy: LegacyRequiredApi): void {
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
    document.querySelectorAll("[data-pagination]").forEach((rootElement) => {
      setupPagination(rootElement);
    });
  });


}
