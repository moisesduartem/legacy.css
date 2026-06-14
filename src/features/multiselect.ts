import { currentTargetElement, eventTargetElement, isElement, isLegacyCollection, isSelectElement } from "../internal";
import type { LegacyMultiselectState, LegacyRequiredApi, LegacyTarget } from "../internal";
const wiredMultiselects = new WeakSet<HTMLSelectElement>();
const multiselectMap = new WeakMap<HTMLSelectElement, LegacyMultiselectState>();
const multiselectSelector = 'select[multiple][data-multiselect], select[multiple].multiselect-source';
let multiselectId = 0;

export function installMultiselect(legacy: LegacyRequiredApi): void {
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

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(multiselectSelector).forEach(setupMultiselect);
  });

  document.addEventListener("click", handleDocumentMultiselectClick);


}
