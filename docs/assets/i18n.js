const { defaultLocale, locales, storageKey } = window.LegacyCssI18n;

function normalizeLocale(locale) {
  if (!locale) return defaultLocale;

  const exactMatch = Object.keys(locales).find(
    (availableLocale) => availableLocale.toLowerCase() === locale.toLowerCase()
  );

  if (exactMatch) return exactMatch;

  const language = locale.split("-")[0].toLowerCase();
  return (
    Object.keys(locales).find((availableLocale) =>
      availableLocale.toLowerCase().startsWith(`${language}-`)
    ) || defaultLocale
  );
}

function getInitialLocale() {
  const searchParams = new URLSearchParams(window.location.search);
  return normalizeLocale(
    searchParams.get("lang") ||
      getStoredLocale() ||
      window.navigator.language
  );
}

function getStoredLocale() {
  try {
    return window.localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

function storeLocale(locale) {
  try {
    window.localStorage.setItem(storageKey, locale);
  } catch {
    return;
  }
}

function translateAttribute(element, datasetKey, attribute, messages) {
  const key = element.dataset[datasetKey];

  if (key && messages[key]) {
    element.setAttribute(attribute, messages[key]);
  }
}

function applyLocale(locale) {
  const messages = locales[locale].messages;

  document.documentElement.lang = locale;
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;

    if (messages[key]) {
      element.textContent = messages[key];
    }
  });

  document
    .querySelectorAll("[data-i18n-title]")
    .forEach((element) => translateAttribute(element, "i18nTitle", "title", messages));
  document
    .querySelectorAll("[data-i18n-placeholder]")
    .forEach((element) => translateAttribute(element, "i18nPlaceholder", "placeholder", messages));
  document
    .querySelectorAll("[data-i18n-aria-label]")
    .forEach((element) => translateAttribute(element, "i18nAriaLabel", "aria-label", messages));

  const titleKey = document.body.dataset.i18nDocumentTitle;
  if (titleKey && messages[titleKey]) {
    document.title = messages[titleKey];
  }

  storeLocale(locale);
}

function setupLanguageSelect(select) {
  Object.entries(locales).forEach(([locale, { label }]) => {
    const option = document.createElement("option");
    option.value = locale;
    option.textContent = label;
    select.append(option);
  });

  select.value = getInitialLocale();
  select.addEventListener("change", (event) => {
    applyLocale(event.target.value);
  });

  applyLocale(select.value);
}

document.querySelectorAll("[data-language-select]").forEach(setupLanguageSelect);
