"use strict";

const DEFAULT_OPTIONS = {
  tabWidth: 8,
  maxCount: 300,
  nonAsciiWidth: 2,
  shouldRoop: true,
  scale: 100,
  columnLevel3: 20,
  columnLevel1: 2,
  physicalPositioning: true,
  cursorOpacity: 100,
};

const fields = [
  "tabWidth",
  "maxCount",
  "nonAsciiWidth",
  "shouldRoop",
  "scale",
  "columnLevel3",
  "columnLevel1",
  "physicalPositioning",
  "cursorOpacity",
];

function message(name) {
  return browser.i18n.getMessage(name) || name;
}

function localize() {
  document.documentElement.lang = browser.i18n.getUILanguage();
  for (const element of document.querySelectorAll("[data-i18n]")) {
    element.textContent = message(element.dataset.i18n);
  }
}

function setStatus(message) {
  const status = document.getElementById("status");
  status.textContent = message;
  if (message) {
    window.setTimeout(() => {
      status.textContent = "";
    }, 1800);
  }
}

function setError(error) {
  console.error(error);
  const status = document.getElementById("status");
  status.textContent = message("saveFailedStatus");
  status.dataset.error = "true";
}

function clearError() {
  const status = document.getElementById("status");
  delete status.dataset.error;
}

function normalizeOptions(options = {}) {
  const normalized = {};
  for (const [field, defaultValue] of Object.entries(DEFAULT_OPTIONS)) {
    const value = options[field];
    if (typeof defaultValue == "boolean") {
      normalized[field] = typeof value == "boolean" ? value : defaultValue;
    } else {
      const number = Number(value);
      const minimum = field == "cursorOpacity" ? 10 : 1;
      const maximum = field == "cursorOpacity" ? 100 : Number.POSITIVE_INFINITY;
      normalized[field] = Number.isFinite(number) && number >= minimum
        ? Math.min(maximum, Math.round(number))
        : defaultValue;
    }
  }
  return normalized;
}

function applyOptions(options) {
  const normalized = normalizeOptions(options);
  for (const field of fields) {
    const input = document.getElementById(field);
    if (input.type == "checkbox") {
      input.checked = normalized[field];
    } else {
      input.value = normalized[field];
    }
  }
}

function collectOptions() {
  const options = {};
  for (const field of fields) {
    const input = document.getElementById(field);
    options[field] = input.type == "checkbox" ? input.checked : Number(input.value);
  }
  return normalizeOptions(options);
}

async function restore() {
  try {
    clearError();
    const options = normalizeOptions(await browser.rulerBar.getOptions());
    applyOptions(options);
  } catch (error) {
    applyOptions(DEFAULT_OPTIONS);
    setError(error);
  }
}

async function save(event) {
  event.preventDefault();
  try {
    clearError();
    const options = collectOptions();
    await browser.rulerBar.setOptions(options);
    applyOptions(await browser.rulerBar.getOptions());
    setStatus(message("savedStatus"));
  } catch (error) {
    setError(error);
  }
}

async function resetDefaults() {
  try {
    clearError();
    await browser.rulerBar.setOptions(DEFAULT_OPTIONS);
    applyOptions(await browser.rulerBar.getOptions());
    setStatus(message("defaultsStatus"));
  } catch (error) {
    setError(error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  localize();
  restore();
});
document.getElementById("options-form").addEventListener("submit", save);
document.getElementById("reset-defaults").addEventListener("click", resetDefaults);
