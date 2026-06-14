import { currentTargetElement, eventTargetElement, isElement, isLegacyCollection, listen } from "../internal";
import type { LegacyRequiredApi, LegacyTarget } from "../internal";
const wiredTabs = new WeakSet<Element>();

export function installTabs(legacy: LegacyRequiredApi): void {
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

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-tabs], .tabs").forEach(setupTabs);
  });


}
