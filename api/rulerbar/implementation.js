const XHTML_NS = "http://www.w3.org/1999/xhtml";

const OPTION_PREFS = {
  tabWidth: ["extensions.rulerbar.tabWidth", "int", 8],
  maxCount: ["extensions.rulerbar.maxCount", "int", 300],
  nonAsciiWidth: ["extensions.rulerbar.nonAsciiWidth", "int", 2],
  shouldRoop: ["extensions.rulerbar.shouldRoop", "bool", true],
  scale: ["extensions.rulerbar.scale", "int", 100],
  columnLevel3: ["extensions.rulerbar.column.level3", "int", 20],
  columnLevel1: ["extensions.rulerbar.column.level1", "int", 2],
  physicalPositioning: [
    "extensions.rulerbar.physicalPositioning",
    "bool",
    true,
  ],
  cursorOpacity: ["extensions.rulerbar.cursorOpacity", "int", 100],
};

const OBSERVED_PREFS = [
  "extensions.rulerbar.",
  "mailnews.wraplength",
  "font.size.",
  "browser.display.foreground_color",
  "browser.display.background_color",
  "browser.display.use_system_colors",
];

function ensureDefaultPrefs() {
  const branch = Services.prefs.getDefaultBranch("");
  for (const [name, type, value] of Object.values(OPTION_PREFS)) {
    if (branch.getPrefType(name) != branch.PREF_INVALID) {
      continue;
    }
    if (type == "bool") {
      branch.setBoolPref(name, value);
    } else {
      branch.setIntPref(name, value);
    }
  }
}

function getPref(name, type, fallback) {
  try {
    if (type == "bool") {
      return Services.prefs.getBoolPref(name, fallback);
    }
    return Services.prefs.getIntPref(name, fallback);
  } catch (error) {
    return fallback;
  }
}

function setPref(name, type, value) {
  if (type == "bool") {
    Services.prefs.setBoolPref(name, Boolean(value));
    return;
  }
  Services.prefs.setIntPref(name, Math.max(1, Number.parseInt(value, 10) || 1));
}

function getOptions() {
  ensureDefaultPrefs();
  const options = {};
  for (const [key, [name, type, fallback]] of Object.entries(OPTION_PREFS)) {
    options[key] = getPref(name, type, fallback);
  }
  return options;
}

function setOptions(options) {
  ensureDefaultPrefs();
  for (const [key, value] of Object.entries(options)) {
    if (!(key in OPTION_PREFS)) {
      continue;
    }
    const [name, type] = OPTION_PREFS[key];
    setPref(name, type, value);
  }
  try {
    Services.prefs.savePrefFile(null);
  } catch (error) {
    console.warn("Ruler Bar could not flush preferences immediately", error);
  }
}

function parseLength(value) {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : 0;
}

function makeElement(document, tag, attrs = {}) {
  const element = document.createElementNS(XHTML_NS, tag);
  for (const [name, value] of Object.entries(attrs)) {
    element.setAttribute(name, value);
  }
  return element;
}

class RulerBarInstance {
  constructor(window) {
    this.window = window;
    this.document = window.document;
    this.listeners = [];
    this.editorListeners = [];
    this.timers = new Set();
    this.dragging = false;
    this.currentCell = null;
    this.options = getOptions();
    this.wrapLength = this.getWrapLength();
    this.unitWidth = 8;
    this.contentOffset = 0;

    this.prefObserver = {
      observe: (_subject, topic) => {
        if (topic == "nsPref:changed") {
          this.onPrefsChanged();
        }
      },
    };
  }

  init() {
    this.editor = this.document.getElementById("messageEditor");
    if (!this.editor) {
      this.editor = this.document.getElementById("content-frame");
    }

    if (!this.editor || !this.editor.parentNode) {
      this.retryInit();
      return;
    }

    this.editorWindow = this.editor.contentWindow;
    this.editorDocument = this.editor.contentDocument;
    this.body = this.editorDocument && this.editorDocument.body;
    if (!this.editorWindow || !this.body) {
      this.retryInit();
      return;
    }

    this.createUI();
    this.addPrefObservers();
    this.applyWrapWidth();
    this.rebuild();
    this.attachWindowListeners();
    this.attachEditorListeners();
    this.update();
  }

  retryInit() {
    if (this.destroyed || this.retryCount > 50) {
      return;
    }
    this.retryCount = (this.retryCount || 0) + 1;
    this.setTimer(() => this.init(), 100);
  }

  createUI() {
    if (this.document.getElementById("ruler-bar-container")) {
      return;
    }

    this.style = makeElement(this.document, "style", { id: "ruler-bar-style" });
    this.style.textContent = `
#ruler-bar-container {
  box-sizing: border-box;
  color-scheme: light dark;
  height: 18px;
  min-height: 18px;
  max-height: 18px;
  overflow: hidden;
  color: CanvasText;
  background: Canvas;
  border-block-end: 1px solid color-mix(in srgb, CanvasText 28%, transparent);
  cursor: default;
  flex: 0 0 auto;
  position: relative;
  user-select: none;
}
#ruler-bar-inner {
  height: 100%;
  left: 0;
  position: absolute;
  top: 0;
  transform: translateX(0);
  transform-origin: left top;
  white-space: nowrap;
}
#ruler-scalebar {
  height: 100%;
  left: 0;
  position: absolute;
  top: 0;
}
.ruler-cell {
  border-inline-start: 1px solid currentColor;
  box-sizing: border-box;
  height: 50%;
  opacity: 0.28;
  overflow: visible;
  position: absolute;
  top: 50%;
}
.ruler-cell.level1 {
  height: 40%;
  opacity: 0.36;
  top: 60%;
}
.ruler-cell.level2 {
  height: 55%;
  opacity: 0.5;
  top: 45%;
}
.ruler-cell.level3 {
  height: 80%;
  opacity: 0.7;
  top: 20%;
}
.ruler-cell[data-wrap="true"] {
  border-inline-start-width: 2px;
  height: 86%;
  opacity: 0.9;
  top: 14%;
}
.ruler-cell[data-current="true"],
#ruler-cursor {
  height: 86%;
  opacity: 1;
  top: 14%;
  z-index: 20;
}
.ruler-cell[data-current="true"] {
  border-inline-start-color: Highlight;
  border-inline-start-width: 3px;
}
.ruler-label {
  font: menu;
  font-size: 10px;
  line-height: 1;
  margin-inline-start: 2px;
  position: absolute;
  top: 0;
}
#ruler-cursor,
#ruler-wrap {
  box-sizing: border-box;
  left: 0;
  pointer-events: none;
  position: absolute;
}
#ruler-cursor[hidden] {
  display: none;
}
#ruler-cursor {
  background: Highlight;
  border: 1px solid color-mix(in srgb, Canvas 55%, transparent);
  border-radius: 2px;
  filter: drop-shadow(0 0 1px CanvasText);
  min-width: 2px;
}
#ruler-wrap {
  border-inline-start: 2px solid currentColor;
  cursor: ew-resize;
  height: 86%;
  opacity: 0;
  pointer-events: auto;
  top: 14%;
  width: 5px;
}
#ruler-wrap:hover,
#ruler-wrap[dragging="true"] {
  opacity: 1;
}
#ruler-wrap-popup {
  color-scheme: light dark;
  background: Canvas;
  border: 1px solid color-mix(in srgb, CanvasText 28%, transparent);
  color: CanvasText;
  font: menu;
  padding: 2px 5px;
  pointer-events: none;
  position: fixed;
  z-index: 2147483647;
}
#ruler-wrap-popup[hidden] {
  display: none;
}`;
    this.document.documentElement.appendChild(this.style);

    this.container = makeElement(this.document, "div", {
      id: "ruler-bar-container",
    });
    this.inner = makeElement(this.document, "div", { id: "ruler-bar-inner" });
    this.scaleBar = makeElement(this.document, "div", { id: "ruler-scalebar" });
    this.cursor = makeElement(this.document, "div", { id: "ruler-cursor" });
    this.wrapMarker = makeElement(this.document, "div", { id: "ruler-wrap" });
    this.popup = makeElement(this.document, "div", {
      id: "ruler-wrap-popup",
      hidden: "hidden",
    });

    this.inner.appendChild(this.scaleBar);
    this.inner.appendChild(this.cursor);
    this.inner.appendChild(this.wrapMarker);
    this.container.appendChild(this.inner);
    this.document.documentElement.appendChild(this.popup);
    this.editor.parentNode.insertBefore(this.container, this.editor);

    this.listen(this.container, "dblclick", event => this.onDoubleClick(event));
    this.listen(this.wrapMarker, "mousedown", event => this.startDrag(event));
    this.listen(this.window, "mousemove", event => this.onDrag(event));
    this.listen(this.window, "mouseup", event => this.endDrag(event));
  }

  attachWindowListeners() {
    if (this.windowListenersAttached) {
      return;
    }
    this.windowListenersAttached = true;
    this.listen(this.editor, "load", () => this.onEditorReload(), true);
    this.listen(this.document, "selectionchange", () => this.scheduleUpdate(), true);
    this.listen(this.document, "keyup", () => this.scheduleUpdate(), true);
    this.listen(this.document, "mouseup", () => this.scheduleUpdate(), true);
  }

  listenEditor(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    this.editorListeners.push([target, type, handler, options]);
  }

  detachEditorListeners() {
    for (const [target, type, handler, options] of this.editorListeners.splice(0)) {
      try {
        target.removeEventListener(type, handler, options);
      } catch (error) {
        // The editor document may already have been replaced.
      }
    }

    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
  }

  attachEditorListeners() {
    this.detachEditorListeners();
    this.listenEditor(this.editorWindow, "scroll", () => this.scheduleUpdate(), true);
    this.listenEditor(this.editorDocument, "selectionchange", () => this.scheduleUpdate());
    this.listenEditor(this.editorDocument, "keyup", () => this.scheduleUpdate(), true);
    this.listenEditor(this.editorDocument, "mouseup", () => this.scheduleUpdate(), true);
    this.listenEditor(this.editorDocument, "input", () => this.scheduleUpdate(), true);

    this.mutationObserver = new this.editorWindow.MutationObserver(() =>
      this.scheduleUpdate()
    );
    this.mutationObserver.observe(this.body, {
      attributes: true,
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  addPrefObservers() {
    for (const pref of OBSERVED_PREFS) {
      Services.prefs.addObserver(pref, this.prefObserver);
    }
  }

  removePrefObservers() {
    for (const pref of OBSERVED_PREFS) {
      try {
        Services.prefs.removeObserver(pref, this.prefObserver);
      } catch (error) {
        // The observer may already have been removed during shutdown.
      }
    }
  }

  listen(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    this.listeners.push([target, type, handler, options]);
  }

  setTimer(callback, delay) {
    const id = this.window.setTimeout(() => {
      this.timers.delete(id);
      callback();
    }, delay);
    this.timers.add(id);
  }

  scheduleUpdate() {
    if (this.updateFrame) {
      return;
    }
    this.updateFrame = this.window.requestAnimationFrame(() => {
      this.updateFrame = null;
      this.update();
    });
  }

  getWrapLength() {
    try {
      return Math.max(0, Services.prefs.getIntPref("mailnews.wraplength", 72));
    } catch (error) {
      return 72;
    }
  }

  onPrefsChanged() {
    this.options = getOptions();
    const nextWrapLength = this.getWrapLength();
    const shouldRebuild =
      nextWrapLength != this.wrapLength ||
      this.options.maxCount != this.lastMaxCount ||
      this.options.columnLevel1 != this.lastColumnLevel1 ||
      this.options.columnLevel3 != this.lastColumnLevel3 ||
      this.options.scale != this.lastScale;
    this.wrapLength = nextWrapLength;
    this.applyWrapWidth();
    if (shouldRebuild) {
      this.rebuild();
    }
    this.update();
  }

  onEditorReload() {
    this.editorWindow = this.editor.contentWindow;
    this.editorDocument = this.editor.contentDocument;
    this.body = this.editorDocument && this.editorDocument.body;
    if (!this.body) {
      this.retryInit();
      return;
    }
    this.applyWrapWidth();
    this.rebuild();
    this.attachEditorListeners();
    this.update();
  }

  applyWrapWidth() {
    if (!this.body) {
      return;
    }
    this.body.style.width = this.wrapLength > 0 ? `${this.wrapLength}ch` : "";
  }

  getColumnWidth(computed) {
    let width = 0;
    if (this.wrapLength > 0) {
      width = parseLength(computed.width) / this.wrapLength;
    }

    if (!width || !Number.isFinite(width)) {
      const measurer = makeElement(this.document, "span");
      measurer.textContent = "0000000000000000000000000000000000000000";
      measurer.style.cssText = `
        all: initial;
        position: fixed;
        inset-inline-start: -10000px;
        inset-block-start: -10000px;
        visibility: hidden;
        white-space: pre;
        font-family: ${computed.fontFamily};
        font-size: ${computed.fontSize};
        font-stretch: ${computed.fontStretch};
        font-style: ${computed.fontStyle};
        font-variant: ${computed.fontVariant};
        font-weight: ${computed.fontWeight};
        letter-spacing: ${computed.letterSpacing};
      `;
      this.document.documentElement.appendChild(measurer);
      width = measurer.getBoundingClientRect().width / measurer.textContent.length;
      measurer.remove();
    }

    const scale = Math.max(1, this.options.scale) / 100;
    return Math.max(2, width * scale);
  }

  rebuild() {
    if (!this.scaleBar || !this.body) {
      return;
    }

    const computed = this.editorWindow.getComputedStyle(this.body);
    this.unitWidth = this.getColumnWidth(computed);

    const maxCount = Math.max(this.wrapLength * 3, this.options.maxCount);
    const major = Math.max(1, this.options.columnLevel3);
    const minor = Math.max(1, this.options.columnLevel1);
    this.lastMaxCount = this.options.maxCount;
    this.lastColumnLevel1 = this.options.columnLevel1;
    this.lastColumnLevel3 = this.options.columnLevel3;
    this.lastScale = this.options.scale;

    this.scaleBar.textContent = "";
    this.cells = [];
    this.currentCell = null;

    const fragment = this.document.createDocumentFragment();
    for (let i = 0; i <= maxCount; i++) {
      let level = 0;
      if (i % major == 0) {
        level = 3;
      } else if (i % 10 == 0) {
        level = 2;
      } else if (i % minor == 0) {
        level = 1;
      }

      const cell = makeElement(this.document, "div", {
        class: `ruler-cell level${level}`,
        title: String(i),
      });
      cell.style.left = `${i * this.unitWidth}px`;
      cell.dataset.count = String(i);

      if (this.wrapLength > 0 && i == this.wrapLength) {
        cell.dataset.wrap = "true";
      }

      if (level == 3) {
        const label = makeElement(this.document, "span", {
          class: "ruler-label",
        });
        label.textContent = String(i);
        cell.appendChild(label);
      }

      this.cells.push(cell);
      fragment.appendChild(cell);
    }

    this.scaleBar.style.width = `${(maxCount + 1) * this.unitWidth}px`;
    this.scaleBar.appendChild(fragment);
  }

  update() {
    if (!this.body || !this.container || !this.editorWindow) {
      return;
    }
    this.updateOffset();
    this.updateWrapMarker();
    this.updateCursor();
  }

  updateOffset() {
    const computed = this.editorWindow.getComputedStyle(this.body);
    const bodyRect = this.body.getBoundingClientRect();
    const scrollX = this.editorWindow.scrollX || 0;
    const border = parseLength(computed.borderInlineStartWidth);
    const padding = parseLength(computed.paddingInlineStart);
    this.contentOffset = bodyRect.left + scrollX + border + padding;
    this.inner.style.transform = `translateX(${this.contentOffset - scrollX}px)`;
  }

  updateWrapMarker(column = this.wrapLength) {
    const left = Math.max(0, column) * this.unitWidth;
    this.wrapMarker.style.left = `${left}px`;
    this.wrapMarker.title = column > 0 ? String(column) : "";
  }

  updateCursor() {
    if (this.currentCell) {
      delete this.currentCell.dataset.current;
      this.currentCell = null;
    }

    const column = this.getLogicalCaretColumn();
    const normalized = this.normalizeColumn(column);
    const cell = this.cells && this.cells[normalized];
    this.cursor.style.opacity = `${Math.min(100, Math.max(10, this.options.cursorOpacity)) / 100}`;
    this.cursor.style.width = `${Math.max(2, this.unitWidth)}px`;

    if (this.options.physicalPositioning) {
      const left = this.getPhysicalCaretPosition();
      this.cursor.removeAttribute("hidden");
      this.cursor.style.left = `${Math.max(0, left)}px`;
      if (cell) {
        cell.dataset.current = "true";
        this.currentCell = cell;
      }
      return;
    }

    this.cursor.removeAttribute("hidden");
    this.cursor.style.left = `${Math.max(0, normalized * this.unitWidth)}px`;
    if (cell) {
      cell.dataset.current = "true";
      this.currentCell = cell;
    }
  }

  normalizeColumn(column) {
    if (!this.options.shouldRoop || this.wrapLength <= 0) {
      return Math.max(0, column);
    }
    return column > this.wrapLength
      ? column % this.wrapLength || this.wrapLength
      : column;
  }

  getSelection() {
    try {
      const editor = this.window.GetCurrentEditor && this.window.GetCurrentEditor();
      if (editor && editor.selection) {
        return editor.selection;
      }
    } catch (error) {
      // Fall back to the frame selection below.
    }
    return this.editorWindow.getSelection();
  }

  getLogicalCaretColumn() {
    const selection = this.getSelection();
    if (!selection || !selection.rangeCount) {
      return 0;
    }

    const focusNode = selection.focusNode;
    const ownerDocument = focusNode && focusNode.ownerDocument;
    if (!ownerDocument || ownerDocument != this.editorDocument) {
      return 0;
    }

    const range = ownerDocument.createRange();
    range.selectNodeContents(this.body);
    try {
      range.setEnd(focusNode, selection.focusOffset);
    } catch (error) {
      return 0;
    }
    const line = range.toString().split(/\r\n|\r|\n/).pop() || "";
    range.detach();
    return this.getLogicalLength(line);
  }

  getLogicalLength(text) {
    let count = 0;
    for (const char of text) {
      const code = char.charCodeAt(0);
      if (code == 9) {
        count += this.options.tabWidth;
      } else if (code <= 127) {
        count += 1;
      } else {
        count += this.options.nonAsciiWidth;
      }
    }
    return count;
  }

  getPhysicalCaretPosition() {
    const selection = this.getSelection();
    if (!selection || !selection.rangeCount) {
      return 0;
    }

    const range = selection.getRangeAt(0).cloneRange();
    range.collapse(false);
    const rects = range.getClientRects();
    if (rects.length) {
      range.detach();
      return rects[0].left + this.editorWindow.scrollX - this.contentOffset;
    }

    range.detach();
    return this.getLogicalCaretColumn() * this.unitWidth;
  }

  getColumnFromMouse(event) {
    const rect = this.container.getBoundingClientRect();
    const scrollX = this.editorWindow.scrollX || 0;
    const x = event.clientX - rect.left - (this.contentOffset - scrollX);
    return Math.max(0, Math.round(x / this.unitWidth));
  }

  onDoubleClick(event) {
    Services.prefs.setIntPref("mailnews.wraplength", this.getColumnFromMouse(event));
  }

  startDrag(event) {
    event.preventDefault();
    this.dragging = true;
    this.wrapMarker.setAttribute("dragging", "true");
    this.onDrag(event);
  }

  onDrag(event) {
    if (!this.dragging) {
      return;
    }
    const column = this.getColumnFromMouse(event);
    this.updateWrapMarker(column);
    this.popup.hidden = false;
    this.popup.textContent = String(column);
    this.popup.style.left = `${event.screenX + 12}px`;
    this.popup.style.top = `${event.screenY + 12}px`;
  }

  endDrag(event) {
    if (!this.dragging) {
      return;
    }
    const column = this.getColumnFromMouse(event);
    this.dragging = false;
    this.wrapMarker.removeAttribute("dragging");
    this.popup.hidden = true;
    Services.prefs.setIntPref("mailnews.wraplength", column);
  }

  destroy() {
    this.destroyed = true;

    for (const id of this.timers) {
      this.window.clearTimeout(id);
    }
    this.timers.clear();

    if (this.updateFrame) {
      this.window.cancelAnimationFrame(this.updateFrame);
      this.updateFrame = null;
    }

    for (const [target, type, handler, options] of this.listeners.splice(0)) {
      try {
        target.removeEventListener(type, handler, options);
      } catch (error) {
        // The target may have gone away with the compose window.
      }
    }

    this.detachEditorListeners();

    this.removePrefObservers();

    for (const node of [this.container, this.popup, this.style]) {
      if (node && node.parentNode) {
        node.parentNode.removeChild(node);
      }
    }
  }
}

class RulerBarManager {
  constructor() {
    this.instances = new Map();
    this.windowListener = {
      onOpenWindow: xulWindow => {
        const window = xulWindow.docShell.domWindow;
        window.addEventListener(
          "load",
          () => {
            this.injectWindow(window);
          },
          { once: true }
        );
      },
      onCloseWindow: xulWindow => {
        const window = xulWindow.docShell.domWindow;
        this.removeWindow(window);
      },
    };
  }

  start() {
    ensureDefaultPrefs();
    if (this.started) {
      return;
    }
    this.started = true;
    Services.wm.addListener(this.windowListener);

    const windows = Services.wm.getEnumerator(null);
    while (windows.hasMoreElements()) {
      this.injectWindow(windows.getNext());
    }
  }

  stop() {
    if (!this.started) {
      return;
    }
    this.started = false;
    Services.wm.removeListener(this.windowListener);
    for (const window of [...this.instances.keys()]) {
      this.removeWindow(window);
    }
  }

  isComposeWindow(window) {
    if (!window || !window.document) {
      return false;
    }
    const root = window.document.documentElement;
    const windowType = root && root.getAttribute("windowtype");
    const href = window.location && window.location.href;
    return (
      windowType == "msgcompose" ||
      (href && href.includes("/messengercompose."))
    );
  }

  injectWindow(window) {
    if (!this.started || !this.isComposeWindow(window) || this.instances.has(window)) {
      return;
    }

    const instance = new RulerBarInstance(window);
    this.instances.set(window, instance);
    try {
      instance.init();
    } catch (error) {
      console.error("Ruler Bar failed to initialize", error);
      this.removeWindow(window);
    }
  }

  removeWindow(window) {
    const instance = this.instances.get(window);
    if (!instance) {
      return;
    }
    this.instances.delete(window);
    instance.destroy();
  }
}

var rulerBarManager = new RulerBarManager();

var rulerBar = class extends ExtensionCommon.ExtensionAPI {
  onStartup() {
    rulerBarManager.start();
  }

  getAPI() {
    return {
      rulerBar: {
        getOptions() {
          return getOptions();
        },
        setOptions(options) {
          setOptions(options);
        },
      },
    };
  }

  onShutdown(isAppShutdown) {
    rulerBarManager.stop();
    if (!isAppShutdown) {
      Services.obs.notifyObservers(null, "startupcache-invalidate");
    }
  }
};
