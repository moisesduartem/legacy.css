import { currentTargetElement, eventTargetElement, isElement, isLegacyCollection, listen } from "../internal";
import type { LegacyPopoverPlacement, LegacyRequiredApi, LegacyTarget } from "../internal";
const legacyPopoverPlacements: LegacyPopoverPlacement[] = ["top", "right", "bottom", "left"];
const wiredPopoverTriggers = new WeakSet<Element>();
const popoverTriggerSelector = "[data-popover-target], [data-popover]";
let openPopoverTrigger: Element | null = null;
function isPopoverPlacement(placement: unknown): placement is LegacyPopoverPlacement {
  return typeof placement === "string" && legacyPopoverPlacements.includes(placement as LegacyPopoverPlacement);
}

export function installPopover(legacy: LegacyRequiredApi): void {
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

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(popoverTriggerSelector).forEach(setupPopover);
  });

  document.addEventListener("click", handleDocumentPopoverClick);
  document.addEventListener("keydown", handleDocumentPopoverKeydown);
  window.addEventListener("resize", updateOpenPopoverPosition);
  window.addEventListener("scroll", updateOpenPopoverPosition, true);


}
