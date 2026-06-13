(function () {
  const root = window;
  const legacy = root.LegacyCss || (root.LegacyCss = {});
  const openDialogs = [];
  const openerMap = new WeakMap();
  const fallbackDialogs = new WeakSet();
  const wiredDialogs = new WeakSet();
  const supportsNativeDialog = (dialog) => typeof dialog.showModal === "function";

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
})();
