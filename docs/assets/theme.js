const themeStorageKey = "legacy.css.theme";
const themes = ["light", "dark"];

function getStoredTheme() {
  try {
    return window.localStorage.getItem(themeStorageKey);
  } catch {
    return null;
  }
}

function storeTheme(theme) {
  try {
    window.localStorage.setItem(themeStorageKey, theme);
  } catch {
    return;
  }
}

function normalizeTheme(theme) {
  return themes.includes(theme) ? theme : "light";
}

function applyTheme(theme) {
  const normalizedTheme = normalizeTheme(theme);

  document.documentElement.dataset.legacyTheme = normalizedTheme;
  storeTheme(normalizedTheme);

  if (window.LegacyCss && window.LegacyCss.theme) {
    window.LegacyCss.theme.set(normalizedTheme);
  }
}

function setupThemeSelect(select) {
  select.value = normalizeTheme(getStoredTheme());
  select.addEventListener("change", (event) => {
    applyTheme(event.target.value);
  });

  applyTheme(select.value);
}

function setupThemeSelects() {
  document.querySelectorAll("[data-theme-select]").forEach(setupThemeSelect);
}

applyTheme(getStoredTheme());

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupThemeSelects);
} else {
  setupThemeSelects();
}
