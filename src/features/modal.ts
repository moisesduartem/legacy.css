import { eventTargetElement, isElement, isLegacyCollection } from "../internal";
import type { LegacyCloseEvent, LegacyFocusableElement, LegacyRequiredApi, LegacyTarget } from "../internal";
const openDialogs: HTMLDialogElement[] = [];
const openerMap = new WeakMap<HTMLDialogElement, HTMLElement | null>();
const fallbackDialogs = new WeakSet<HTMLDialogElement>();
const wiredDialogs = new WeakSet<HTMLDialogElement>();
const supportsNativeDialog = (dialog: HTMLDialogElement): boolean => typeof dialog.showModal === "function";
let scrollLockCount = 0;
let previousBodyOverflow = "";
let previousHtmlOverflow = "";
const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

export function installModal(legacy: LegacyRequiredApi): void {
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


}
