import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];

const optionFields = [
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

function unique(values) {
  return [...new Set(values)];
}

function relPath(relativePath) {
  return path.join(root, relativePath);
}

function fail(message) {
  errors.push(message);
}

function readText(relativePath) {
  return fs.readFileSync(relPath(relativePath), "utf8");
}

function readJson(relativePath) {
  try {
    return JSON.parse(readText(relativePath));
  } catch (error) {
    fail(`${relativePath}: invalid JSON: ${error.message}`);
    return null;
  }
}

function assertExists(relativePath) {
  if (!fs.existsSync(relPath(relativePath))) {
    fail(`${relativePath}: missing file`);
  }
}

function assertSameSet(label, expected, actual) {
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);
  for (const item of expectedSet) {
    if (!actualSet.has(item)) {
      fail(`${label}: missing ${item}`);
    }
  }
  for (const item of actualSet) {
    if (!expectedSet.has(item)) {
      fail(`${label}: unexpected ${item}`);
    }
  }
}

function assertSubset(label, requiredItems, availableItems) {
  const availableSet = new Set(availableItems);
  for (const item of requiredItems) {
    if (!availableSet.has(item)) {
      fail(`${label}: missing ${item}`);
    }
  }
}

function assertParsesAsScript(relativePath) {
  try {
    new Function(readText(relativePath));
  } catch (error) {
    fail(`${relativePath}: JavaScript syntax error: ${error.message}`);
  }
}

const manifest = readJson("manifest.json");
const schema = readJson("api/rulerbar/schema.json");
const packageJson = readJson("package.json");
const locales = {
  en: readJson("_locales/en/messages.json"),
  ja: readJson("_locales/ja/messages.json"),
};

assertParsesAsScript("api/rulerbar/implementation.js");
assertParsesAsScript("options/options.js");

if (manifest) {
  if (manifest.manifest_version !== 3) {
    fail("manifest.json: manifest_version must be 3");
  }
  if (packageJson && packageJson.version !== manifest.version) {
    fail("package.json: version must match manifest.json");
  }

  assertExists("icon.png");
  if (manifest.options_ui?.page) {
    assertExists(manifest.options_ui.page);
  } else {
    fail("manifest.json: missing options_ui.page");
  }

  const api = manifest.experiment_apis?.rulerBar;
  if (!api) {
    fail("manifest.json: missing rulerBar experiment API");
  } else {
    if (api.schema) {
      assertExists(api.schema);
    } else {
      fail("manifest.json: missing rulerBar schema path");
    }
    if (api.parent?.script) {
      assertExists(api.parent.script);
    } else {
      fail("manifest.json: missing rulerBar parent script path");
    }
  }
}

if (locales.en && locales.ja) {
  assertSameSet(
    "ja locale keys",
    Object.keys(locales.en),
    Object.keys(locales.ja)
  );

  for (const [locale, messages] of Object.entries(locales)) {
    for (const [key, value] of Object.entries(messages)) {
      if (!value || typeof value.message !== "string" || !value.message) {
        fail(`_locales/${locale}/messages.json: ${key} must have a message`);
      }
    }
  }
}

const html = readText("options/options.html");
const implementation = readText("api/rulerbar/implementation.js");
const optionsScript = readText("options/options.js");

if (locales.en) {
  const localeKeys = Object.keys(locales.en);
  const htmlI18nKeys = unique(
    [...html.matchAll(/data-i18n="([^"]+)"/g)].map(match => match[1])
  );
  const optionsI18nKeys = unique(
    [...optionsScript.matchAll(/message\("([^"]+)"\)/g)].map(match => match[1])
  );
  const manifestI18nKeys = unique(
    [...JSON.stringify(manifest).matchAll(/__MSG_([^_][A-Za-z0-9_]*)__/g)].map(
      match => match[1]
    )
  );

  assertSubset("options.html i18n keys", htmlI18nKeys, localeKeys);
  assertSubset("options.js i18n keys", optionsI18nKeys, localeKeys);
  assertSubset("manifest i18n keys", manifestI18nKeys, localeKeys);
}

if (schema) {
  const setOptions = schema
    .find(namespace => namespace.namespace === "rulerBar")
    ?.functions?.find(func => func.name === "setOptions");
  const schemaProperties = setOptions?.parameters?.[0]?.properties;
  if (!schemaProperties) {
    fail("api/rulerbar/schema.json: missing setOptions option properties");
  } else {
    assertSameSet(
      "api/rulerbar/schema.json option properties",
      optionFields,
      Object.keys(schemaProperties)
    );
  }
}

for (const field of optionFields) {
  if (!html.includes(`id="${field}"`)) {
    fail(`options/options.html: missing input id ${field}`);
  }
  if (!optionsScript.includes(field)) {
    fail(`options/options.js: missing option field ${field}`);
  }
  if (!implementation.includes(field)) {
    fail(`api/rulerbar/implementation.js: missing option field ${field}`);
  }
}

if (errors.length) {
  console.error("Validation failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log("Validation passed.");
}
