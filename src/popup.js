(function initializeQuickCopyPopup() {
  "use strict";

  const STATE_KEY = "quickCopyPanelState";
  const ENABLED_KEY = "quickCopyPanelEnabled";
  const SET_ENABLED_MESSAGE = "QUICK_COPY_PANEL_SET_ENABLED";
  const OPEN_MESSAGE = "QUICK_COPY_PANEL_OPEN";
  const GET_STATUS_MESSAGE = "QUICK_COPY_PANEL_GET_STATUS";

  const getRef = (name) => document.querySelector(`[data-ref="${name}"]`);
  const refs = {
    statusDot: getRef("status-dot"),
    enabledLabel: getRef("enabled-label"),
    enabledToggle: getRef("enabled-toggle"),
    version: getRef("version"),
    templateCount: getRef("template-count"),
    groupCount: getRef("group-count"),
    snippetCount: getRef("snippet-count"),
    openButton: getRef("open-button"),
    pageMessage: getRef("page-message")
  };

  let enabled = true;
  let activeTabId = null;
  let pageReachable = false;
  let busy = false;

  function readStorage() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([STATE_KEY, ENABLED_KEY], (result) => {
        const error = chrome.runtime.lastError;
        if (error) reject(new Error(error.message));
        else resolve(result);
      });
    });
  }

  function writeStorage(values) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(values, () => {
        const error = chrome.runtime.lastError;
        if (error) reject(new Error(error.message));
        else resolve();
      });
    });
  }

  function findActiveTab() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) {
          resolve(null);
          return;
        }
        resolve(Array.isArray(tabs) && tabs[0] ? tabs[0] : null);
      });
    });
  }

  function sendToCurrentPage(message) {
    return new Promise((resolve) => {
      if (!Number.isInteger(activeTabId)) {
        resolve(null);
        return;
      }

      chrome.tabs.sendMessage(activeTabId, message, (response) => {
        const error = chrome.runtime.lastError;
        resolve(error ? null : response || null);
      });
    });
  }

  function setPageMessage(message, tone) {
    refs.pageMessage.textContent = message;
    refs.pageMessage.dataset.tone = tone || "neutral";
  }

  function renderEnabledState() {
    refs.enabledToggle.checked = enabled;
    refs.enabledToggle.disabled = busy;
    refs.enabledLabel.textContent = enabled ? "已开启" : "已关闭";
    refs.statusDot.dataset.off = String(!enabled);
    refs.openButton.disabled = busy;
    refs.openButton.querySelector("span").textContent = enabled
      ? "在当前网页打开并展开"
      : "开启并在当前网页展开";
  }

  function renderCounts(state) {
    const templates = state && Array.isArray(state.templates) ? state.templates.length : 1;
    const groups = state && Array.isArray(state.groups) ? state.groups.length : 0;
    const snippets = state && Array.isArray(state.snippets) ? state.snippets.length : 0;
    refs.templateCount.textContent = String(templates);
    refs.groupCount.textContent = String(groups);
    refs.snippetCount.textContent = String(snippets);
  }

  async function changeEnabled(nextEnabled) {
    if (busy) return;
    const previousEnabled = enabled;
    enabled = nextEnabled;
    busy = true;
    renderEnabledState();

    try {
      await writeStorage({ [ENABLED_KEY]: enabled });
      const response = await sendToCurrentPage({
        type: SET_ENABLED_MESSAGE,
        enabled
      });
      pageReachable = Boolean(response && response.ok);

      if (pageReachable) {
        setPageMessage(
          enabled ? "当前网页已显示悬浮面板。" : "当前网页已完全隐藏悬浮面板。",
          "success"
        );
      } else {
        setPageMessage(
          "设置已保存；浏览器内部页面无法显示面板。",
          "warning"
        );
      }
    } catch {
      enabled = previousEnabled;
      refs.enabledToggle.checked = enabled;
      setPageMessage("开关状态保存失败，请稍后重试。", "warning");
    } finally {
      busy = false;
      renderEnabledState();
    }
  }

  refs.enabledToggle.addEventListener("change", () => {
    void changeEnabled(refs.enabledToggle.checked);
  });

  refs.openButton.addEventListener("click", async () => {
    if (busy) return;
    busy = true;
    enabled = true;
    renderEnabledState();

    try {
      await writeStorage({ [ENABLED_KEY]: true });
      const response = await sendToCurrentPage({ type: OPEN_MESSAGE });
      pageReachable = Boolean(response && response.ok);
      setPageMessage(
        pageReachable
          ? "面板已在当前网页展开，可以开始使用。"
          : "已开启；请切换到普通网页并刷新后使用。",
        pageReachable ? "success" : "warning"
      );
    } catch {
      setPageMessage("暂时无法打开面板，请稍后重试。", "warning");
    } finally {
      busy = false;
      renderEnabledState();
    }
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") return;
    if (changes[ENABLED_KEY]) {
      enabled = changes[ENABLED_KEY].newValue !== false;
      renderEnabledState();
    }
    if (changes[STATE_KEY]) renderCounts(changes[STATE_KEY].newValue);
  });

  async function start() {
    refs.version.textContent = `v${chrome.runtime.getManifest().version}`;

    try {
      const [stored, activeTab] = await Promise.all([readStorage(), findActiveTab()]);
      enabled = stored[ENABLED_KEY] !== false;
      activeTabId = activeTab && Number.isInteger(activeTab.id) ? activeTab.id : null;
      renderCounts(stored[STATE_KEY]);
      renderEnabledState();

      const response = await sendToCurrentPage({ type: GET_STATUS_MESSAGE });
      pageReachable = Boolean(response && response.ok);
      setPageMessage(
        pageReachable
          ? enabled
            ? "当前网页可使用，点击按钮可立即展开。"
            : "面板当前已关闭，可通过上方开关开启。"
          : "此页面受浏览器保护，无法注入悬浮面板。",
        pageReachable ? "neutral" : "warning"
      );
    } catch {
      renderEnabledState();
      renderCounts(null);
      setPageMessage("读取本机设置失败，请重新打开弹窗。", "warning");
    }
  }

  void start();
})();
