import { isElement, isLegacyCollection } from "../internal";
import type { LegacyRequiredApi, LegacyTarget, LegacyToastInput, LegacyToastOptions, LegacyToastPosition, LegacyToastType } from "../internal";
const legacyToastPositions: LegacyToastPosition[] = ["top-left", "top-right", "bottom-left", "bottom-right"];
const toastTimers = new WeakMap<Element, number>();
function isToastPosition(position: unknown): position is LegacyToastPosition {
  return typeof position === "string" && legacyToastPositions.includes(position as LegacyToastPosition);
}

export function installToast(legacy: LegacyRequiredApi): void {
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


}
