import type { LegacyRequiredApi, LegacyTheme } from "../internal";
const legacyThemes: LegacyTheme[] = ["light", "dark"];
const legacyThemeStorageKey = "legacy.css.theme";

export function installTheme(legacy: LegacyRequiredApi): void {
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


}
