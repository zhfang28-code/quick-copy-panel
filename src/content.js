(function mountQuickCopyPanel() {
  "use strict";

  const Model = globalThis.QuickCopyModel;
  const HOST_ID = "quick-copy-panel-extension-host";
  const STORAGE_KEY = "quickCopyPanelState";
  const TOGGLE_MESSAGE = "QUICK_COPY_PANEL_TOGGLE";

  if (!Model || document.getElementById(HOST_ID)) {
    return;
  }

  const host = document.createElement("div");
  host.id = HOST_ID;
  host.setAttribute("data-extension", "quick-copy-panel");
  host.style.setProperty("position", "fixed", "important");
  host.style.setProperty("top", "0", "important");
  host.style.setProperty("right", "0", "important");
  host.style.setProperty("width", "0", "important");
  host.style.setProperty("height", "0", "important");
  host.style.setProperty("z-index", "2147483647", "important");

  const shadow = host.attachShadow({ mode: "open" });
  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = chrome.runtime.getURL("src/panel.css");
  shadow.appendChild(stylesheet);

  const app = document.createElement("div");
  app.innerHTML = `
    <div class="qcp-shell" data-collapsed="false">
      <button class="qcp-collapsed-trigger" type="button" data-action="toggle" aria-label="展开随手复制面板">
        <span class="qcp-collapsed-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M8 5.75A2.75 2.75 0 0 1 10.75 3h7.5A2.75 2.75 0 0 1 21 5.75v7.5A2.75 2.75 0 0 1 18.25 16H17v1.25A3.75 3.75 0 0 1 13.25 21h-7.5A3.75 3.75 0 0 1 2 17.25v-7.5A3.75 3.75 0 0 1 5.75 6H7v-.25Zm1 2.5v5A1.75 1.75 0 0 0 10.75 15h2.5A1.75 1.75 0 0 0 15 13.25v-5a.25.25 0 0 0-.25-.25h-5.5a.25.25 0 0 0-.25.25Z"/></svg>
        </span>
        <span class="qcp-collapsed-label">随手复制</span>
        <span class="qcp-collapsed-count" data-ref="collapsed-count">0</span>
      </button>

      <section class="qcp-panel" data-ref="panel" aria-label="随手复制面板">
        <header class="qcp-header">
          <div class="qcp-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M8 5.75A2.75 2.75 0 0 1 10.75 3h7.5A2.75 2.75 0 0 1 21 5.75v7.5A2.75 2.75 0 0 1 18.25 16H17v1.25A3.75 3.75 0 0 1 13.25 21h-7.5A3.75 3.75 0 0 1 2 17.25v-7.5A3.75 3.75 0 0 1 5.75 6H7v-.25Zm1 2.5v5A1.75 1.75 0 0 0 10.75 15h2.5A1.75 1.75 0 0 0 15 13.25v-5a.25.25 0 0 0-.25-.25h-5.5a.25.25 0 0 0-.25.25Z"/></svg>
          </div>
          <div class="qcp-brand-copy">
            <h1>随手复制</h1>
            <p>常用文字，一点即用</p>
          </div>
          <button class="qcp-icon-button qcp-collapse-button" type="button" data-action="toggle" aria-label="收起面板" title="收起面板">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>
          </button>
        </header>

        <div class="qcp-main">
          <div class="qcp-toolbar">
            <label class="qcp-search">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m20 20-4.2-4.2m1.2-5.3a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"/></svg>
              <span class="qcp-visually-hidden">搜索名称或内容</span>
              <input data-ref="search" type="search" placeholder="搜索名称或内容" autocomplete="off" />
              <button class="qcp-search-clear" data-ref="search-clear" type="button" data-action="clear-search" aria-label="清空搜索" title="清空搜索" hidden>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"/></svg>
              </button>
            </label>
            <button class="qcp-add-button" type="button" data-action="add">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
              <span>新增</span>
            </button>
          </div>

          <form class="qcp-editor" data-ref="editor" hidden>
            <div class="qcp-editor-heading">
              <div>
                <span class="qcp-eyebrow">文字卡片</span>
                <h2 data-ref="editor-title">新增内容</h2>
              </div>
              <button class="qcp-icon-button" type="button" data-action="cancel-editor" aria-label="关闭编辑器" title="关闭">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"/></svg>
              </button>
            </div>

            <label class="qcp-field">
              <span class="qcp-field-label">名称 / 主题</span>
              <input data-ref="title-input" name="title" type="text" maxlength="80" placeholder="例如：客服回复、收货地址" required />
              <span class="qcp-character-count" data-ref="title-count">0 / 80</span>
            </label>

            <label class="qcp-field">
              <span class="qcp-field-label">文本内容</span>
              <textarea data-ref="content-input" name="content" maxlength="10000" rows="5" placeholder="输入单击卡片时要复制的完整文字…" required></textarea>
              <span class="qcp-character-count" data-ref="content-count">0 / 10000</span>
            </label>

            <div class="qcp-editor-actions">
              <span class="qcp-save-hint"><kbd>Ctrl</kbd> + <kbd>Enter</kbd> 保存</span>
              <div>
                <button class="qcp-secondary-button" type="button" data-action="cancel-editor">取消</button>
                <button class="qcp-primary-button" type="submit" data-ref="save-button">保存内容</button>
              </div>
            </div>
          </form>

          <div class="qcp-list-heading">
            <span data-ref="result-count">0 条内容</span>
            <span>单击卡片即可复制</span>
          </div>

          <div class="qcp-list" data-ref="list" role="list" aria-label="已保存的文字内容"></div>

          <div class="qcp-empty" data-ref="empty" hidden>
            <div class="qcp-empty-illustration" aria-hidden="true">
              <svg viewBox="0 0 64 64"><rect x="14" y="18" width="30" height="34" rx="7"/><rect x="23" y="10" width="27" height="32" rx="7"/><path d="M29 20h15M29 27h10"/></svg>
            </div>
            <h2 data-ref="empty-title">还没有保存内容</h2>
            <p data-ref="empty-description">新增一条常用文字，以后单击就能复制。</p>
            <button class="qcp-empty-button" type="button" data-action="empty-action" data-ref="empty-action">新增第一条</button>
          </div>
        </div>

        <footer class="qcp-footer">
          <span><i aria-hidden="true"></i> 数据仅保存在本机</span>
          <span class="qcp-shortcut">Alt + Shift + C</span>
        </footer>

        <div class="qcp-toast" data-ref="toast" role="status" aria-live="polite" aria-atomic="true">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6.5 12.5 3.5 3.5 7.5-8"/></svg>
          <span data-ref="toast-message">已复制</span>
        </div>
      </section>
    </div>
  `;

  while (app.firstChild) {
    shadow.appendChild(app.firstChild);
  }

  (document.body || document.documentElement).appendChild(host);

  const getRef = (name) => shadow.querySelector(`[data-ref="${name}"]`);
  const refs = {
    shell: shadow.querySelector(".qcp-shell"),
    panel: getRef("panel"),
    collapsedCount: getRef("collapsed-count"),
    search: getRef("search"),
    searchClear: getRef("search-clear"),
    editor: getRef("editor"),
    editorTitle: getRef("editor-title"),
    titleInput: getRef("title-input"),
    titleCount: getRef("title-count"),
    contentInput: getRef("content-input"),
    contentCount: getRef("content-count"),
    saveButton: getRef("save-button"),
    resultCount: getRef("result-count"),
    list: getRef("list"),
    empty: getRef("empty"),
    emptyTitle: getRef("empty-title"),
    emptyDescription: getRef("empty-description"),
    emptyAction: getRef("empty-action"),
    toast: getRef("toast"),
    toastMessage: getRef("toast-message")
  };

  let state = Model.createDefaultState();
  let searchQuery = "";
  let editingId = null;
  let pendingDeleteId = null;
  let toastTimer = null;

  function readStoredState() {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        const error = chrome.runtime.lastError;
        resolve(error ? Model.createDefaultState() : Model.normalizeState(result[STORAGE_KEY]));
      });
    });
  }

  function persistState() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [STORAGE_KEY]: state }, () => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(error.message));
        } else {
          resolve();
        }
      });
    }).catch(() => {
      showToast("保存失败，请稍后重试", "error");
    });
  }

  function render() {
    refs.shell.dataset.collapsed = String(state.collapsed);
    refs.panel.setAttribute("aria-hidden", String(state.collapsed));
    refs.collapsedCount.textContent = String(state.snippets.length);
    refs.resultCount.textContent = `${state.snippets.length} 条内容`;
    refs.searchClear.hidden = searchQuery.length === 0;
    renderList();
  }

  function renderList() {
    const visibleSnippets = Model.filterSnippets(state.snippets, searchQuery);
    refs.list.replaceChildren();
    refs.resultCount.textContent = searchQuery
      ? `${visibleSnippets.length} / ${state.snippets.length} 条`
      : `${state.snippets.length} 条内容`;

    const fragment = document.createDocumentFragment();
    for (const snippet of visibleSnippets) {
      fragment.appendChild(createSnippetCard(snippet));
    }
    refs.list.appendChild(fragment);

    const isEmpty = visibleSnippets.length === 0;
    refs.empty.hidden = !isEmpty;
    refs.list.hidden = isEmpty;

    if (searchQuery && isEmpty) {
      refs.emptyTitle.textContent = "没有找到匹配内容";
      refs.emptyDescription.textContent = "换个关键词试试，名称和正文都可以搜索。";
      refs.emptyAction.textContent = "清空搜索";
    } else {
      refs.emptyTitle.textContent = "还没有保存内容";
      refs.emptyDescription.textContent = "新增一条常用文字，以后单击就能复制。";
      refs.emptyAction.textContent = "新增第一条";
    }
  }

  function createSnippetCard(snippet) {
    const card = document.createElement("article");
    card.className = "qcp-card";
    card.setAttribute("role", "listitem");
    card.dataset.id = snippet.id;

    const copyButton = document.createElement("button");
    copyButton.className = "qcp-card-copy";
    copyButton.type = "button";
    copyButton.dataset.action = "copy";
    copyButton.dataset.id = snippet.id;
    copyButton.setAttribute("aria-label", `复制“${snippet.title}”的文本内容`);

    const titleRow = document.createElement("span");
    titleRow.className = "qcp-card-title-row";

    const title = document.createElement("strong");
    title.className = "qcp-card-title";
    title.textContent = snippet.title;

    const hint = document.createElement("span");
    hint.className = "qcp-card-copy-hint";
    hint.textContent = "单击复制";
    titleRow.append(title, hint);

    const preview = document.createElement("span");
    preview.className = "qcp-card-preview";
    preview.textContent = snippet.content;

    const metadata = document.createElement("span");
    metadata.className = "qcp-card-meta";
    metadata.textContent = `更新于 ${formatTime(snippet.updatedAt)}`;

    copyButton.append(titleRow, preview, metadata);
    card.appendChild(copyButton);

    if (pendingDeleteId === snippet.id) {
      const confirmation = document.createElement("div");
      confirmation.className = "qcp-delete-confirmation";

      const question = document.createElement("span");
      question.textContent = "确定删除这条内容？";
      confirmation.append(
        question,
        createActionButton("取消", "cancel-delete", snippet.id, "qcp-text-button"),
        createActionButton("删除", "confirm-delete", snippet.id, "qcp-danger-button")
      );
      card.appendChild(confirmation);
    } else {
      const actions = document.createElement("div");
      actions.className = "qcp-card-actions";
      actions.append(
        createActionButton("编辑", "edit", snippet.id, "qcp-text-button"),
        createActionButton("删除", "request-delete", snippet.id, "qcp-text-button qcp-delete-button")
      );
      card.appendChild(actions);
    }

    return card;
  }

  function createActionButton(label, action, id, className) {
    const button = document.createElement("button");
    button.className = className;
    button.type = "button";
    button.dataset.action = action;
    button.dataset.id = id;
    button.textContent = label;
    return button;
  }

  function formatTime(timestamp) {
    const elapsed = Math.max(0, Date.now() - timestamp);
    if (elapsed < 60 * 1000) {
      return "刚刚";
    }
    if (elapsed < 60 * 60 * 1000) {
      return `${Math.floor(elapsed / (60 * 1000))} 分钟前`;
    }
    if (elapsed < 24 * 60 * 60 * 1000) {
      return `${Math.floor(elapsed / (60 * 60 * 1000))} 小时前`;
    }

    return new Intl.DateTimeFormat("zh-CN", {
      month: "short",
      day: "numeric"
    }).format(new Date(timestamp));
  }

  function openEditor(id) {
    if (!id && state.snippets.length >= Model.MAX_SNIPPETS) {
      showToast(`最多保存 ${Model.MAX_SNIPPETS} 条内容`, "error");
      return;
    }

    const snippet = id ? state.snippets.find((item) => item.id === id) : null;
    if (id && !snippet) {
      showToast("这条内容已不存在", "error");
      return;
    }

    editingId = snippet ? snippet.id : null;
    pendingDeleteId = null;
    refs.editor.reset();
    refs.titleInput.value = snippet ? snippet.title : "";
    refs.contentInput.value = snippet ? snippet.content : "";
    refs.editorTitle.textContent = snippet ? "编辑内容" : "新增内容";
    refs.saveButton.textContent = snippet ? "保存修改" : "保存内容";
    refs.editor.hidden = false;
    clearValidation();
    updateCharacterCounts();
    renderList();

    requestAnimationFrame(() => {
      refs.titleInput.focus();
      refs.editor.scrollIntoView({ block: "nearest" });
    });
  }

  function closeEditor(restoreFocus) {
    editingId = null;
    refs.editor.hidden = true;
    refs.editor.reset();
    clearValidation();
    updateCharacterCounts();

    if (restoreFocus) {
      const addButton = shadow.querySelector('[data-action="add"]');
      addButton && addButton.focus();
    }
  }

  function clearValidation() {
    refs.titleInput.setCustomValidity("");
    refs.contentInput.setCustomValidity("");
  }

  function updateCharacterCounts() {
    refs.titleCount.textContent = `${refs.titleInput.value.length} / ${Model.MAX_TITLE_LENGTH}`;
    refs.contentCount.textContent = `${refs.contentInput.value.length} / ${Model.MAX_CONTENT_LENGTH}`;
  }

  function validateEditor() {
    clearValidation();

    if (!refs.titleInput.value.trim()) {
      refs.titleInput.setCustomValidity("请输入名称或主题");
      refs.titleInput.reportValidity();
      return false;
    }

    if (!refs.contentInput.value.trim()) {
      refs.contentInput.setCustomValidity("请输入要复制的文本内容");
      refs.contentInput.reportValidity();
      return false;
    }

    return true;
  }

  async function saveEditor() {
    if (!validateEditor()) {
      return;
    }

    const values = {
      title: refs.titleInput.value,
      content: refs.contentInput.value
    };

    try {
      if (editingId) {
        const index = state.snippets.findIndex((item) => item.id === editingId);
        if (index === -1) {
          throw new Error("找不到要编辑的内容");
        }

        const snippets = state.snippets.slice();
        snippets[index] = Model.updateSnippet(snippets[index], values);
        state = { ...state, snippets };
      } else {
        const snippet = Model.createSnippet(values);
        state = { ...state, snippets: [snippet, ...state.snippets] };
      }

      const wasEditing = Boolean(editingId);
      closeEditor(false);
      render();
      await persistState();
      showToast(wasEditing ? "修改已保存" : "内容已保存");
    } catch (error) {
      showToast(error.message || "保存失败", "error");
    }
  }

  function togglePanel() {
    state = { ...state, collapsed: !state.collapsed };
    render();
    void persistState();

    requestAnimationFrame(() => {
      const focusTarget = state.collapsed
        ? shadow.querySelector(".qcp-collapsed-trigger")
        : refs.search;
      focusTarget && focusTarget.focus();
    });
  }

  function clearSearch() {
    searchQuery = "";
    refs.search.value = "";
    render();
    refs.search.focus();
  }

  async function copySnippet(id, trigger) {
    const snippet = state.snippets.find((item) => item.id === id);
    if (!snippet) {
      showToast("这条内容已不存在", "error");
      return;
    }

    try {
      await writeToClipboard(snippet.content);
      trigger.classList.add("is-copied");
      window.setTimeout(() => trigger.classList.remove("is-copied"), 700);
      showToast(`已复制：${snippet.title}`);
    } catch {
      showToast("复制失败，请手动选择文本", "error");
    }
  }

  async function writeToClipboard(text) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch {
        // The fallback works on pages where Clipboard API permission is denied.
      }
    }

    const previousFocus = shadow.activeElement;
    const copyArea = document.createElement("textarea");
    copyArea.value = text;
    copyArea.readOnly = true;
    copyArea.setAttribute("aria-hidden", "true");
    copyArea.style.position = "fixed";
    copyArea.style.left = "-99999px";
    copyArea.style.top = "0";
    shadow.appendChild(copyArea);
    copyArea.focus();
    copyArea.select();
    copyArea.setSelectionRange(0, copyArea.value.length);
    const copied = document.execCommand("copy");
    copyArea.remove();
    if (previousFocus instanceof HTMLElement) {
      previousFocus.focus();
    }

    if (!copied) {
      throw new Error("Copy command failed");
    }
  }

  function showToast(message, tone) {
    window.clearTimeout(toastTimer);
    refs.toastMessage.textContent = message;
    refs.toast.dataset.tone = tone || "success";
    refs.toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => {
      refs.toast.classList.remove("is-visible");
    }, 2200);
  }

  shadow.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target.closest("[data-action]") : null;
    if (!target) {
      return;
    }

    const action = target.dataset.action;
    const id = target.dataset.id;

    if (action === "toggle") {
      togglePanel();
    } else if (action === "add") {
      openEditor(null);
    } else if (action === "cancel-editor") {
      closeEditor(true);
    } else if (action === "clear-search") {
      clearSearch();
    } else if (action === "empty-action") {
      searchQuery ? clearSearch() : openEditor(null);
    } else if (action === "copy") {
      void copySnippet(id, target);
    } else if (action === "edit") {
      openEditor(id);
    } else if (action === "request-delete") {
      pendingDeleteId = id;
      renderList();
    } else if (action === "cancel-delete") {
      pendingDeleteId = null;
      renderList();
    } else if (action === "confirm-delete") {
      const deleted = state.snippets.find((item) => item.id === id);
      state = { ...state, snippets: state.snippets.filter((item) => item.id !== id) };
      pendingDeleteId = null;
      if (editingId === id) {
        closeEditor(false);
      }
      render();
      void persistState();
      showToast(deleted ? `已删除：${deleted.title}` : "内容已删除");
    }
  });

  refs.search.addEventListener("input", () => {
    searchQuery = refs.search.value.trim();
    refs.searchClear.hidden = searchQuery.length === 0;
    renderList();
  });

  refs.titleInput.addEventListener("input", () => {
    refs.titleInput.setCustomValidity("");
    updateCharacterCounts();
  });

  refs.contentInput.addEventListener("input", () => {
    refs.contentInput.setCustomValidity("");
    updateCharacterCounts();
  });

  refs.editor.addEventListener("submit", (event) => {
    event.preventDefault();
    void saveEditor();
  });

  refs.editor.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      refs.editor.requestSubmit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeEditor(true);
    }
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message && message.type === TOGGLE_MESSAGE) {
      togglePanel();
    }
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !changes[STORAGE_KEY]) {
      return;
    }

    state = Model.normalizeState(changes[STORAGE_KEY].newValue);
    if (editingId && !state.snippets.some((item) => item.id === editingId)) {
      closeEditor(false);
    }
    render();
  });

  readStoredState().then((storedState) => {
    state = storedState;
    render();
  });
})();
