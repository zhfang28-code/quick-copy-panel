"use strict";

const TOGGLE_MESSAGE = "QUICK_COPY_PANEL_TOGGLE";

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

chrome.action.onClicked.addListener((tab) => {
  requestToggle(tab.id);
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
