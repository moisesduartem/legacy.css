import type { LegacyJQuery, LegacyRequiredApi } from "./internal";

export function installJQueryBridges(root: Window & { jQuery?: LegacyJQuery }, legacy: LegacyRequiredApi): void {
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

}
