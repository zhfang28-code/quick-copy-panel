"use strict";

const TOGGLE_MESSAGE = "QUICK_COPY_PANEL_TOGGLE";
const ENABLED_KEY = "quickCopyPanelEnabled";

function requestToggle(tabId) {
  if (!Number.isInteger(tabId)) {
    return;
  }

  chrome.tabs.sendMessage(tabId, { type: TOGGLE_MESSAGE }, () => {
    // Restricted browser pages do not allow content scripts. Reading lastError
    // keeps that expected case from producing an unhandled console warning.
    void chrome.runtime.lastError;
  });
}

function updateActionState(enabled) {
  chrome.action.setBadgeBackgroundColor({ color: "#6857e8" });
  chrome.action.setBadgeText({ text: enabled ? "" : "关" });
  chrome.action.setTitle({
    title: enabled ? "随手复制：已开启" : "随手复制：已关闭"
  });
}

function readEnabledState() {
  chrome.storage.local.get([ENABLED_KEY], (result) => {
    if (chrome.runtime.lastError) return;
    updateActionState(result[ENABLED_KEY] !== false);
  });
}

chrome.runtime.onInstalled.addListener(readEnabledState);
chrome.runtime.onStartup.addListener(readEnabledState);

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes[ENABLED_KEY]) {
    updateActionState(changes[ENABLED_KEY].newValue !== false);
  }
});

chrome.commands.onCommand.addListener((command) => {
  if (command !== "toggle-panel") {
    return;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    void chrome.runtime.lastError;
    requestToggle(Array.isArray(tabs) && tabs[0] ? tabs[0].id : undefined);
  });
});

readEnabledState();
