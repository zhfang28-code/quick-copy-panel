(function mountQuickCopyPanel() {
  "use strict";

  const Model = globalThis.QuickCopyModel;
  const HOST_ID = "quick-copy-panel-extension-host";
  const STORAGE_KEY = "quickCopyPanelState";
  const ENABLED_KEY = "quickCopyPanelEnabled";
  const POSITION_KEY = "quickCopyPanelPosition";
  const GROUP_CLIPBOARD_KEY = "quickCopyPanelGroupClipboard";
  const TOGGLE_MESSAGE = "QUICK_COPY_PANEL_TOGGLE";
  const SET_ENABLED_MESSAGE = "QUICK_COPY_PANEL_SET_ENABLED";
  const OPEN_MESSAGE = "QUICK_COPY_PANEL_OPEN";
  const GET_STATUS_MESSAGE = "QUICK_COPY_PANEL_GET_STATUS";

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
  host.style.setProperty("display", "none", "important");

  const shadow = host.attachShadow({ mode: "open" });
  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = chrome.runtime.getURL("src/panel.css");
  shadow.appendChild(stylesheet);

  const app = document.createElement("div");
  app.innerHTML = `
    <div class="qcp-shell" data-collapsed="false" data-level="groups">
      <button class="qcp-collapsed-trigger" type="button" data-action="toggle" data-window-drag-zone="collapsed" aria-label="展开随手复制面板；拖动可调整上下位置" title="单击展开，拖动调整位置">
        <span class="qcp-collapsed-grip" aria-hidden="true">
          <svg viewBox="0 0 18 8"><circle cx="4" cy="2" r="1"/><circle cx="9" cy="2" r="1"/><circle cx="14" cy="2" r="1"/><circle cx="4" cy="6" r="1"/><circle cx="9" cy="6" r="1"/><circle cx="14" cy="6" r="1"/></svg>
        </span>
        <span class="qcp-collapsed-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M8 5.75A2.75 2.75 0 0 1 10.75 3h7.5A2.75 2.75 0 0 1 21 5.75v7.5A2.75 2.75 0 0 1 18.25 16H17v1.25A3.75 3.75 0 0 1 13.25 21h-7.5A3.75 3.75 0 0 1 2 17.25v-7.5A3.75 3.75 0 0 1 5.75 6H7v-.25Zm1 2.5v5A1.75 1.75 0 0 0 10.75 15h2.5A1.75 1.75 0 0 0 15 13.25v-5a.25.25 0 0 0-.25-.25h-5.5a.25.25 0 0 0-.25.25Z"/></svg>
        </span>
        <span class="qcp-collapsed-label">随手复制</span>
        <span class="qcp-collapsed-count" data-ref="collapsed-count">0</span>
      </button>

      <section class="qcp-panel" data-ref="panel" aria-label="随手复制面板">
        <header class="qcp-header" data-window-drag-zone="expanded" title="拖动标题栏可移动面板">
          <div class="qcp-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M8 5.75A2.75 2.75 0 0 1 10.75 3h7.5A2.75 2.75 0 0 1 21 5.75v7.5A2.75 2.75 0 0 1 18.25 16H17v1.25A3.75 3.75 0 0 1 13.25 21h-7.5A3.75 3.75 0 0 1 2 17.25v-7.5A3.75 3.75 0 0 1 5.75 6H7v-.25Zm1 2.5v5A1.75 1.75 0 0 0 10.75 15h2.5A1.75 1.75 0 0 0 15 13.25v-5a.25.25 0 0 0-.25-.25h-5.5a.25.25 0 0 0-.25.25Z"/></svg>
          </div>
          <div class="qcp-brand-copy">
            <h1>随手复制</h1>
            <p>分级整理，一点即用</p>
          </div>
          <span class="qcp-window-drag-handle" data-window-drag-handle="expanded" role="button" tabindex="0" aria-label="拖动面板；按 Alt 加方向键可微调位置" title="拖动面板">
            <svg viewBox="0 0 18 14" aria-hidden="true"><circle cx="5" cy="3" r="1.25"/><circle cx="13" cy="3" r="1.25"/><circle cx="5" cy="7" r="1.25"/><circle cx="13" cy="7" r="1.25"/><circle cx="5" cy="11" r="1.25"/><circle cx="13" cy="11" r="1.25"/></svg>
          </span>
          <button class="qcp-icon-button qcp-collapse-button" type="button" data-action="toggle" aria-label="收起面板" title="收起面板">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>
          </button>
        </header>

        <div class="qcp-main">
          <section class="qcp-template-toolbar" aria-label="模板选择与管理">
            <label class="qcp-template-picker">
              <span class="qcp-template-label">当前模板</span>
              <span class="qcp-template-select-wrap">
                <select data-ref="template-select" aria-label="选择模板"></select>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 10 4 4 4-4"/></svg>
              </span>
            </label>
            <button class="qcp-template-icon-button" type="button" data-action="add-template" aria-label="新建模板" title="新建模板">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
            </button>
            <button class="qcp-template-icon-button" type="button" data-action="edit-template" aria-label="编辑当前模板" title="编辑当前模板">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 20 4.2-1 10.1-10.1a2.1 2.1 0 0 0-3-3L5.2 16 4 20Z"/><path d="m13.8 7.3 3 3"/></svg>
            </button>
          </section>

          <section class="qcp-transfer-banner" data-ref="transfer-banner" aria-label="整组复制暂存区" hidden>
            <span class="qcp-transfer-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>
            </span>
            <span class="qcp-transfer-copy">
              <strong data-ref="transfer-title">已复制分类</strong>
              <small data-ref="transfer-description">切换模板后即可粘贴</small>
            </span>
            <button class="qcp-transfer-paste" data-ref="transfer-paste" type="button" data-action="paste-group">粘贴整组</button>
            <button class="qcp-transfer-clear" type="button" data-action="clear-group-copy" aria-label="清除已复制分类" title="清除">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"/></svg>
            </button>
          </section>

          <div class="qcp-toolbar">
            <label class="qcp-search">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m20 20-4.2-4.2m1.2-5.3a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"/></svg>
              <span class="qcp-visually-hidden">搜索</span>
              <input data-ref="search" type="search" placeholder="搜索分类或内容" autocomplete="off" />
              <button class="qcp-search-clear" data-ref="search-clear" type="button" data-action="clear-search" aria-label="清空搜索" title="清空搜索" hidden>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"/></svg>
              </button>
            </label>
            <button class="qcp-add-button" data-ref="add-button" type="button" data-action="add">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
              <span data-ref="add-label">分类</span>
            </button>
          </div>

          <section class="qcp-level-context" data-ref="level-context" aria-label="当前分类" hidden>
            <button class="qcp-back-button" type="button" data-action="back-to-groups" aria-label="返回全部分类" title="返回全部分类">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg>
            </button>
            <div class="qcp-level-copy">
              <span>当前分类</span>
              <h2 data-ref="level-name"></h2>
              <p data-ref="level-description"></p>
            </div>
            <button class="qcp-level-edit" type="button" data-action="edit-current-group">编辑分类</button>
          </section>

          <form class="qcp-editor" data-ref="editor" hidden>
            <div class="qcp-editor-heading">
              <div>
                <span class="qcp-eyebrow" data-ref="editor-eyebrow">一级分类</span>
                <h2 data-ref="editor-title">新增分类</h2>
              </div>
              <button class="qcp-icon-button" type="button" data-action="cancel-editor" aria-label="关闭编辑器" title="关闭">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"/></svg>
              </button>
            </div>

            <label class="qcp-field">
              <span class="qcp-field-label" data-ref="title-label">分类名称</span>
              <input data-ref="title-input" name="title" type="text" maxlength="50" placeholder="例如：个人信息、获奖经历" required />
              <span class="qcp-character-count" data-ref="title-count">0 / 50</span>
            </label>

            <label class="qcp-field">
              <span class="qcp-field-label">
                <span data-ref="content-label">分类说明</span>
                <em data-ref="content-optional">选填</em>
              </span>
              <textarea data-ref="content-input" name="content" maxlength="120" rows="3" placeholder="简单说明这个分类保存什么内容"></textarea>
              <span class="qcp-character-count" data-ref="content-count">0 / 120</span>
            </label>

            <div class="qcp-template-delete-confirmation" data-ref="template-delete-confirmation" hidden>
              <span data-ref="template-delete-message">确定删除当前模板？</span>
              <button class="qcp-text-button" type="button" data-action="cancel-template-delete">取消</button>
              <button class="qcp-danger-button" type="button" data-action="confirm-template-delete">确认删除</button>
            </div>

            <div class="qcp-editor-actions">
              <div class="qcp-editor-meta-actions">
                <button class="qcp-editor-delete-template" data-ref="delete-template-button" type="button" data-action="request-template-delete" hidden>删除模板</button>
                <span class="qcp-save-hint"><kbd>Ctrl</kbd> + <kbd>Enter</kbd> 保存</span>
              </div>
              <div>
                <button class="qcp-secondary-button" type="button" data-action="cancel-editor">取消</button>
                <button class="qcp-primary-button" type="submit" data-ref="save-button">保存分类</button>
              </div>
            </div>
          </form>

          <div class="qcp-list-heading">
            <span data-ref="result-count">0 个分类</span>
            <span data-ref="list-hint">点击分类进入</span>
          </div>

          <div class="qcp-list" data-ref="list" role="list" aria-label="保存的分类或文字内容"></div>

          <div class="qcp-empty" data-ref="empty" hidden>
            <div class="qcp-empty-illustration" aria-hidden="true">
              <svg viewBox="0 0 64 64"><rect x="14" y="18" width="30" height="34" rx="7"/><rect x="23" y="10" width="27" height="32" rx="7"/><path d="M29 20h15M29 27h10"/></svg>
            </div>
            <h2 data-ref="empty-title">还没有分类</h2>
            <p data-ref="empty-description">先建立一级分类，再向其中添加可复制内容。</p>
            <button class="qcp-empty-button" type="button" data-action="empty-action" data-ref="empty-action">新建第一个分类</button>
          </div>
        </div>

        <footer class="qcp-footer">
          <span><i aria-hidden="true"></i> 分级数据仅保存在本机</span>
          <span class="qcp-shortcut">Alt + Shift + C</span>
        </footer>

        <div class="qcp-toast" data-ref="toast" role="status" aria-live="polite" aria-atomic="true">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6.5 12.5 3.5 3.5 7.5-8"/></svg>
          <span data-ref="toast-message">已保存</span>
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
    templateSelect: getRef("template-select"),
    transferBanner: getRef("transfer-banner"),
    transferTitle: getRef("transfer-title"),
    transferDescription: getRef("transfer-description"),
    transferPaste: getRef("transfer-paste"),
    search: getRef("search"),
    searchClear: getRef("search-clear"),
    addButton: getRef("add-button"),
    addLabel: getRef("add-label"),
    levelContext: getRef("level-context"),
    levelName: getRef("level-name"),
    levelDescription: getRef("level-description"),
    editor: getRef("editor"),
    editorEyebrow: getRef("editor-eyebrow"),
    editorTitle: getRef("editor-title"),
    titleLabel: getRef("title-label"),
    titleInput: getRef("title-input"),
    titleCount: getRef("title-count"),
    contentLabel: getRef("content-label"),
    contentOptional: getRef("content-optional"),
    contentInput: getRef("content-input"),
    contentCount: getRef("content-count"),
    saveButton: getRef("save-button"),
    deleteTemplateButton: getRef("delete-template-button"),
    templateDeleteConfirmation: getRef("template-delete-confirmation"),
    templateDeleteMessage: getRef("template-delete-message"),
    resultCount: getRef("result-count"),
    listHint: getRef("list-hint"),
    list: getRef("list"),
    empty: getRef("empty"),
    emptyTitle: getRef("empty-title"),
    emptyDescription: getRef("empty-description"),
    emptyAction: getRef("empty-action"),
    toast: getRef("toast"),
    toastMessage: getRef("toast-message")
  };

  let state = Model.createDefaultState();
  let panelEnabled = false;
  let panelPosition = Model.normalizePanelPosition(null);
  let groupClipboard = null;
  let activeTemplateId = state.selectedTemplateId;
  let activeGroupId = null;
  let searchQuery = "";
  let editorType = null;
  let editingId = null;
  let editorLimits = { title: Model.MAX_GROUP_NAME_LENGTH, content: Model.MAX_GROUP_DESCRIPTION_LENGTH };
  let pendingDelete = null;
  let dragState = null;
  let windowDragState = null;
  let suppressCollapsedToggle = false;
  let positionFrame = null;
  let toastTimer = null;

  function readStoredState() {
    return new Promise((resolve) => {
      chrome.storage.local.get(
        [STORAGE_KEY, ENABLED_KEY, POSITION_KEY, GROUP_CLIPBOARD_KEY],
        (result) => {
          const error = chrome.runtime.lastError;
          if (error) {
            resolve({
              state: Model.createDefaultState(),
              enabled: true,
              position: Model.normalizePanelPosition(null),
              clipboard: null,
              needsMigration: false
            });
            return;
          }

          const stored = result[STORAGE_KEY];
          resolve({
            state: Model.normalizeState(stored),
            enabled: result[ENABLED_KEY] !== false,
            position: Model.normalizePanelPosition(result[POSITION_KEY]),
            clipboard: Model.normalizeGroupClipboard(result[GROUP_CLIPBOARD_KEY]),
            needsMigration: Boolean(stored) && stored.version !== Model.SCHEMA_VERSION
          });
        }
      );
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

  function persistEnabled(enabled) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [ENABLED_KEY]: enabled }, () => {
        const error = chrome.runtime.lastError;
        if (error) reject(new Error(error.message));
        else resolve();
      });
    }).catch(() => {
      if (panelEnabled) showToast("开关状态保存失败，请稍后重试", "error");
    });
  }

  function persistPanelPosition() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [POSITION_KEY]: panelPosition }, () => {
        const error = chrome.runtime.lastError;
        if (error) reject(new Error(error.message));
        else resolve();
      });
    }).catch(() => {
      if (panelEnabled && !state.collapsed) {
        showToast("窗口位置保存失败，请稍后重试", "error");
      }
    });
  }

  function persistGroupClipboard() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [GROUP_CLIPBOARD_KEY]: groupClipboard }, () => {
        const error = chrome.runtime.lastError;
        if (error) reject(new Error(error.message));
        else resolve();
      });
    }).catch(() => {
      showToast("整组复制状态保存失败，请稍后重试", "error");
    });
  }

  function getActiveTemplate() {
    return activeTemplateId
      ? state.templates.find((template) => template.id === activeTemplateId) || null
      : null;
  }

  function groupsForTemplate(templateId) {
    return state.groups.filter((group) => group.templateId === templateId);
  }

  function getActiveGroup() {
    if (!activeGroupId) return null;
    return state.groups.find((group) =>
      group.id === activeGroupId && group.templateId === activeTemplateId
    ) || null;
  }

  function snippetsForGroup(groupId) {
    return state.snippets.filter((snippet) => snippet.groupId === groupId);
  }

  function render() {
    let activeTemplate = getActiveTemplate();
    if (!activeTemplate) {
      activeTemplate = state.templates[0] || null;
      activeTemplateId = activeTemplate ? activeTemplate.id : null;
      if (activeTemplate) state = { ...state, selectedTemplateId: activeTemplate.id };
    }

    let activeGroup = getActiveGroup();
    if (activeGroupId && !activeGroup) {
      activeGroupId = null;
      activeGroup = null;
    }

    const isDetail = Boolean(activeGroup);
    const currentGroups = activeTemplate ? groupsForTemplate(activeTemplate.id) : [];
    refs.shell.dataset.collapsed = String(state.collapsed);
    refs.shell.dataset.level = isDetail ? "snippets" : "groups";
    refs.panel.setAttribute("aria-hidden", String(state.collapsed));
    refs.collapsedCount.textContent = String(currentGroups.length);
    refs.addLabel.textContent = isDetail ? "内容" : "分类";
    refs.addButton.setAttribute("aria-label", isDetail ? "新增二级内容" : "新增一级分类");
    refs.search.placeholder = isDetail ? "搜索当前分类内容" : "搜索分类或内容";
    refs.searchClear.hidden = searchQuery.length === 0;
    refs.levelContext.hidden = !isDetail;

    renderTemplateOptions(activeTemplate);
    renderTransferBanner(activeTemplate);

    if (activeGroup) {
      const itemCount = snippetsForGroup(activeGroup.id).length;
      refs.levelName.textContent = activeGroup.name;
      refs.levelDescription.textContent = activeGroup.description || `${itemCount} 条二级内容`;
    }

    renderList();
    schedulePanelPosition();
  }

  function renderTemplateOptions(activeTemplate) {
    const options = document.createDocumentFragment();
    for (const template of state.templates) {
      const option = document.createElement("option");
      option.value = template.id;
      option.textContent = template.name;
      option.title = template.description;
      options.appendChild(option);
    }
    refs.templateSelect.replaceChildren(options);
    refs.templateSelect.value = activeTemplate ? activeTemplate.id : "";
    refs.templateSelect.disabled = state.templates.length === 0;
  }

  function renderTransferBanner(activeTemplate) {
    if (!groupClipboard || !activeTemplate) {
      refs.transferBanner.hidden = true;
      return;
    }

    const sourceTemplate = state.templates.find((template) =>
      template.id === groupClipboard.sourceTemplateId
    );
    const snippetCount = groupClipboard.snippets.length;
    const sameTemplate = groupClipboard.sourceTemplateId === activeTemplate.id;
    refs.transferBanner.hidden = false;
    refs.transferTitle.textContent = `已复制“${groupClipboard.group.name}”`;
    refs.transferDescription.textContent = sameTemplate
      ? `${snippetCount} 条内容 · 切换到其他模板后粘贴`
      : `${snippetCount} 条内容 · 来自“${sourceTemplate ? sourceTemplate.name : "已删除模板"}”`;
    refs.transferPaste.disabled = sameTemplate;
    refs.transferPaste.textContent = sameTemplate ? "等待切换" : "粘贴整组";
    refs.transferPaste.setAttribute(
      "aria-label",
      sameTemplate
        ? "请先切换到其他模板"
        : `将“${groupClipboard.group.name}”及其内容粘贴到“${activeTemplate.name}”`
    );
  }

  function renderList() {
    const activeGroup = getActiveGroup();
    refs.list.replaceChildren();
    let visibleItems;

    if (activeGroup) {
      const allItems = snippetsForGroup(activeGroup.id);
      visibleItems = Model.filterSnippets(allItems, searchQuery);
      refs.resultCount.textContent = searchQuery
        ? `${visibleItems.length} / ${allItems.length} 条`
        : `${allItems.length} 条内容`;
      refs.listHint.textContent = searchQuery ? "清空搜索后可排序" : "拖动排序 · 单击复制";

      for (const snippet of visibleItems) {
        refs.list.appendChild(createSnippetCard(snippet));
      }

      configureEmptyState({
        hasResults: visibleItems.length > 0,
        hasAnyItems: allItems.length > 0,
        emptyTitle: "这个分类还是空的",
        emptyDescription: "新增一条二级内容，之后单击卡片即可复制。",
        emptyAction: "新增第一条内容"
      });
    } else {
      const activeTemplate = getActiveTemplate();
      const allGroups = activeTemplate ? groupsForTemplate(activeTemplate.id) : [];
      visibleItems = Model.filterGroups(allGroups, state.snippets, searchQuery);
      refs.resultCount.textContent = searchQuery
        ? `${visibleItems.length} / ${allGroups.length} 个`
        : `${allGroups.length} 个分类`;
      refs.listHint.textContent = searchQuery ? "清空搜索后可排序" : "拖动排序 · 点击进入";

      for (const group of visibleItems) {
        refs.list.appendChild(createGroupCard(group));
      }

      configureEmptyState({
        hasResults: visibleItems.length > 0,
        hasAnyItems: allGroups.length > 0,
        emptyTitle: "还没有分类",
        emptyDescription: "先建立一级分类，再向其中添加可复制内容。",
        emptyAction: "新建第一个分类"
      });
    }
  }

  function configureEmptyState(settings) {
    refs.empty.hidden = settings.hasResults;
    refs.list.hidden = !settings.hasResults;

    if (settings.hasResults) {
      return;
    }

    if (searchQuery && settings.hasAnyItems) {
      refs.emptyTitle.textContent = "没有找到匹配内容";
      refs.emptyDescription.textContent = "换个关键词试试，一级名称和二级正文都可以搜索。";
      refs.emptyAction.textContent = "清空搜索";
    } else {
      refs.emptyTitle.textContent = settings.emptyTitle;
      refs.emptyDescription.textContent = settings.emptyDescription;
      refs.emptyAction.textContent = settings.emptyAction;
    }
  }

  function createGroupCard(group) {
    const childSnippets = Model.filterSnippets(snippetsForGroup(group.id), "");
    const card = document.createElement("article");
    card.className = "qcp-group-card";
    card.setAttribute("role", "listitem");
    card.dataset.id = group.id;
    card.dataset.tone = String(hashText(group.id) % 5);

    const openButton = document.createElement("button");
    openButton.className = "qcp-group-open";
    openButton.type = "button";
    openButton.dataset.action = "open-group";
    openButton.dataset.id = group.id;
    openButton.setAttribute("aria-label", `进入分类“${group.name}”，包含 ${childSnippets.length} 条内容`);

    const heading = document.createElement("span");
    heading.className = "qcp-group-heading";

    const icon = document.createElement("span");
    icon.className = "qcp-group-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = group.name.slice(0, 1);

    const copy = document.createElement("span");
    copy.className = "qcp-group-copy";
    const name = document.createElement("strong");
    name.textContent = group.name;
    const description = document.createElement("span");
    description.textContent = group.description || "点击进入查看二级内容";
    copy.append(name, description);

    const arrow = document.createElement("span");
    arrow.className = "qcp-group-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.innerHTML = '<svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>';
    heading.append(icon, copy, arrow);
    openButton.appendChild(heading);

    if (childSnippets.length > 0) {
      const preview = document.createElement("span");
      preview.className = "qcp-group-preview";
      for (const snippet of childSnippets.slice(0, 3)) {
        const chip = document.createElement("span");
        chip.textContent = snippet.title;
        preview.appendChild(chip);
      }
      if (childSnippets.length > 3) {
        const more = document.createElement("span");
        more.textContent = `+${childSnippets.length - 3}`;
        preview.appendChild(more);
      }
      openButton.appendChild(preview);
    }

    const metadata = document.createElement("span");
    metadata.className = "qcp-group-meta";
    metadata.innerHTML = `<b>${childSnippets.length} 条内容</b><span>更新于 ${formatTime(group.updatedAt)}</span>`;
    openButton.appendChild(metadata);
    card.appendChild(openButton);

    if (pendingDelete && pendingDelete.type === "group" && pendingDelete.id === group.id) {
      const confirmation = document.createElement("div");
      confirmation.className = "qcp-delete-confirmation qcp-group-delete-confirmation";
      const question = document.createElement("span");
      question.textContent = childSnippets.length > 0
        ? `同时删除其中 ${childSnippets.length} 条内容？`
        : "确定删除这个分类？";
      confirmation.append(
        question,
        createActionButton("取消", "cancel-delete", group.id, "group", "qcp-text-button"),
        createActionButton("删除", "confirm-delete", group.id, "group", "qcp-danger-button")
      );
      card.appendChild(confirmation);
    } else {
      const actions = document.createElement("div");
      actions.className = "qcp-card-actions qcp-group-actions";
      const copyGroupButton = createActionButton(
        "复制整组",
        "copy-group",
        group.id,
        "group",
        "qcp-text-button qcp-copy-group-button"
      );
      copyGroupButton.setAttribute(
        "aria-label",
        `复制分类“${group.name}”及其中 ${childSnippets.length} 条内容`
      );
      actions.append(
        createDragHandle("group", group.id, group.name),
        copyGroupButton,
        createActionButton("编辑分类", "edit-group", group.id, "group", "qcp-text-button"),
        createActionButton("删除", "request-delete", group.id, "group", "qcp-text-button qcp-delete-button")
      );
      card.appendChild(actions);
    }

    return card;
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

    if (pendingDelete && pendingDelete.type === "snippet" && pendingDelete.id === snippet.id) {
      const confirmation = document.createElement("div");
      confirmation.className = "qcp-delete-confirmation";
      const question = document.createElement("span");
      question.textContent = "确定删除这条内容？";
      confirmation.append(
        question,
        createActionButton("取消", "cancel-delete", snippet.id, "snippet", "qcp-text-button"),
        createActionButton("删除", "confirm-delete", snippet.id, "snippet", "qcp-danger-button")
      );
      card.appendChild(confirmation);
    } else {
      const actions = document.createElement("div");
      actions.className = "qcp-card-actions";
      actions.append(
        createDragHandle("snippet", snippet.id, snippet.title),
        createActionButton("编辑", "edit-snippet", snippet.id, "snippet", "qcp-text-button"),
        createActionButton("删除", "request-delete", snippet.id, "snippet", "qcp-text-button qcp-delete-button")
      );
      card.appendChild(actions);
    }

    return card;
  }

  function createActionButton(label, action, id, entity, className) {
    const button = document.createElement("button");
    button.className = className;
    button.type = "button";
    button.dataset.action = action;
    button.dataset.id = id;
    button.dataset.entity = entity;
    button.textContent = label;
    return button;
  }

  function createDragHandle(type, id, label) {
    const button = document.createElement("button");
    const canDrag = searchQuery.length === 0;
    button.className = "qcp-drag-handle";
    button.type = "button";
    button.draggable = canDrag;
    button.dataset.dragHandle = "true";
    button.dataset.dragType = type;
    button.dataset.id = id;
    button.setAttribute("aria-disabled", String(!canDrag));
    button.setAttribute("aria-grabbed", "false");
    button.setAttribute(
      "aria-label",
      canDrag
        ? `拖动“${label}”调整位置，或按 Alt 加上下方向键移动`
        : "清空搜索后可以调整位置"
    );
    button.title = canDrag ? "拖动排序 · Alt + ↑/↓" : "清空搜索后可排序";
    button.innerHTML = `
      <svg viewBox="0 0 18 18" aria-hidden="true">
        <circle cx="6" cy="4" r="1.25"/><circle cx="12" cy="4" r="1.25"/>
        <circle cx="6" cy="9" r="1.25"/><circle cx="12" cy="9" r="1.25"/>
        <circle cx="6" cy="14" r="1.25"/><circle cx="12" cy="14" r="1.25"/>
      </svg>`;
    return button;
  }

  function hashText(value) {
    let hash = 0;
    for (const character of value) {
      hash = ((hash << 5) - hash + character.codePointAt(0)) | 0;
    }
    return Math.abs(hash);
  }

  function formatTime(timestamp) {
    const elapsed = Math.max(0, Date.now() - timestamp);
    if (elapsed < 60 * 1000) return "刚刚";
    if (elapsed < 60 * 60 * 1000) return `${Math.floor(elapsed / (60 * 1000))} 分钟前`;
    if (elapsed < 24 * 60 * 60 * 1000) return `${Math.floor(elapsed / (60 * 60 * 1000))} 小时前`;
    return new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric" }).format(new Date(timestamp));
  }

  function openTemplateEditor(id) {
    if (!id && state.templates.length >= Model.MAX_TEMPLATES) {
      showToast(`最多建立 ${Model.MAX_TEMPLATES} 个模板`, "error");
      return;
    }

    const template = id ? state.templates.find((item) => item.id === id) : null;
    if (id && !template) {
      showToast("这个模板已不存在", "error");
      return;
    }

    configureEditor({
      type: "template",
      id: template ? template.id : null,
      eyebrow: "内容模板",
      heading: template ? "编辑模板" : "新建模板",
      titleLabel: "模板名称",
      titlePlaceholder: "例如：求职资料、客服话术",
      titleValue: template ? template.name : "",
      titleMax: Model.MAX_TEMPLATE_NAME_LENGTH,
      contentLabel: "模板说明",
      contentPlaceholder: "简单说明这个模板的使用场景",
      contentValue: template ? template.description : "",
      contentMax: Model.MAX_TEMPLATE_DESCRIPTION_LENGTH,
      contentRequired: false,
      canDelete: Boolean(template && state.templates.length > 1),
      saveLabel: template ? "保存模板" : "建立模板"
    });
  }

  function openGroupEditor(id) {
    const activeTemplate = getActiveTemplate();
    if (!activeTemplate) {
      showToast("请先选择一个模板", "error");
      return;
    }
    if (!id && state.groups.length >= Model.MAX_GROUPS) {
      showToast(`最多建立 ${Model.MAX_GROUPS} 个分类`, "error");
      return;
    }

    const group = id ? state.groups.find((item) =>
      item.id === id && item.templateId === activeTemplate.id
    ) : null;
    if (id && !group) {
      showToast("这个分类已不存在", "error");
      return;
    }

    configureEditor({
      type: "group",
      id: group ? group.id : null,
      eyebrow: "一级分类",
      heading: group ? "编辑分类" : "新增分类",
      titleLabel: "分类名称",
      titlePlaceholder: "例如：个人信息、获奖经历",
      titleValue: group ? group.name : "",
      titleMax: Model.MAX_GROUP_NAME_LENGTH,
      contentLabel: "分类说明",
      contentPlaceholder: "简单说明这个分类保存什么内容",
      contentValue: group ? group.description : "",
      contentMax: Model.MAX_GROUP_DESCRIPTION_LENGTH,
      contentRequired: false,
      canDelete: false,
      saveLabel: group ? "保存修改" : "保存分类"
    });
  }

  function openSnippetEditor(id) {
    const activeGroup = getActiveGroup();
    if (!activeGroup) {
      showToast("请先进入一个分类", "error");
      return;
    }
    if (!id && state.snippets.length >= Model.MAX_SNIPPETS) {
      showToast(`最多保存 ${Model.MAX_SNIPPETS} 条内容`, "error");
      return;
    }

    const snippet = id ? state.snippets.find((item) => item.id === id && item.groupId === activeGroup.id) : null;
    if (id && !snippet) {
      showToast("这条内容已不存在", "error");
      return;
    }

    configureEditor({
      type: "snippet",
      id: snippet ? snippet.id : null,
      eyebrow: `二级内容 · ${activeGroup.name}`,
      heading: snippet ? "编辑内容" : "新增内容",
      titleLabel: "内容名称",
      titlePlaceholder: "例如：邮箱、一等奖、客服回复",
      titleValue: snippet ? snippet.title : "",
      titleMax: Model.MAX_TITLE_LENGTH,
      contentLabel: "复制正文",
      contentPlaceholder: "输入单击卡片时要复制的完整文字…",
      contentValue: snippet ? snippet.content : "",
      contentMax: Model.MAX_CONTENT_LENGTH,
      contentRequired: true,
      canDelete: false,
      saveLabel: snippet ? "保存修改" : "保存内容"
    });
  }

  function configureEditor(settings) {
    editorType = settings.type;
    editingId = settings.id;
    editorLimits = { title: settings.titleMax, content: settings.contentMax };
    pendingDelete = null;
    refs.editor.reset();
    refs.editor.dataset.type = settings.type;
    refs.editorEyebrow.textContent = settings.eyebrow;
    refs.editorTitle.textContent = settings.heading;
    refs.titleLabel.textContent = settings.titleLabel;
    refs.titleInput.placeholder = settings.titlePlaceholder;
    refs.titleInput.maxLength = settings.titleMax;
    refs.titleInput.value = settings.titleValue;
    refs.contentLabel.textContent = settings.contentLabel;
    refs.contentOptional.hidden = settings.contentRequired;
    refs.contentInput.placeholder = settings.contentPlaceholder;
    refs.contentInput.maxLength = settings.contentMax;
    refs.contentInput.required = settings.contentRequired;
    refs.contentInput.rows = settings.type === "snippet" ? 5 : 3;
    refs.contentInput.value = settings.contentValue;
    refs.saveButton.textContent = settings.saveLabel;
    refs.deleteTemplateButton.hidden = !settings.canDelete;
    refs.templateDeleteConfirmation.hidden = true;
    refs.editor.hidden = false;
    clearValidation();
    updateCharacterCounts();
    renderList();

    requestAnimationFrame(() => {
      refs.titleInput.focus({ preventScroll: true });
    });
  }

  function closeEditor(restoreFocus) {
    editorType = null;
    editingId = null;
    refs.editor.hidden = true;
    refs.editor.reset();
    refs.templateDeleteConfirmation.hidden = true;
    clearValidation();

    if (restoreFocus) {
      refs.addButton.focus();
    }
  }

  function clearValidation() {
    refs.titleInput.setCustomValidity("");
    refs.contentInput.setCustomValidity("");
  }

  function updateCharacterCounts() {
    refs.titleCount.textContent = `${refs.titleInput.value.length} / ${editorLimits.title}`;
    refs.contentCount.textContent = `${refs.contentInput.value.length} / ${editorLimits.content}`;
  }

  function validateEditor() {
    clearValidation();
    if (!refs.titleInput.value.trim()) {
      refs.titleInput.setCustomValidity(
        editorType === "template"
          ? "请输入模板名称"
          : editorType === "group"
            ? "请输入分类名称"
            : "请输入内容名称"
      );
      refs.titleInput.reportValidity();
      return false;
    }
    if (editorType === "snippet" && !refs.contentInput.value.trim()) {
      refs.contentInput.setCustomValidity("请输入要复制的文本正文");
      refs.contentInput.reportValidity();
      return false;
    }
    return true;
  }

  async function saveEditor() {
    if (!validateEditor()) return;

    try {
      const now = Date.now();
      let message;

      if (editorType === "template") {
        const values = { name: refs.titleInput.value, description: refs.contentInput.value };
        if (editingId) {
          const index = state.templates.findIndex((template) => template.id === editingId);
          if (index === -1) throw new Error("找不到要编辑的模板");
          const updated = Model.updateTemplate(state.templates[index], values, now);
          const duplicate = state.templates.some((template) =>
            template.id !== editingId && template.name.toLocaleLowerCase() === updated.name.toLocaleLowerCase()
          );
          if (duplicate) throw new Error("已有同名模板，请换一个名称");
          const templates = state.templates.slice();
          templates[index] = updated;
          state = { ...state, templates };
          message = "模板修改已保存";
        } else {
          const template = Model.createTemplate(values, {
            now,
            order: Model.leadingOrder(state.templates)
          });
          const duplicate = state.templates.some((item) =>
            item.name.toLocaleLowerCase() === template.name.toLocaleLowerCase()
          );
          if (duplicate) throw new Error("已有同名模板，请换一个名称");
          activeTemplateId = template.id;
          activeGroupId = null;
          state = {
            ...state,
            selectedTemplateId: template.id,
            templates: [template, ...state.templates]
          };
          clearSearch(false);
          message = "模板已建立，可以添加一级分类";
        }
      } else if (editorType === "group") {
        const activeTemplate = getActiveTemplate();
        if (!activeTemplate) throw new Error("当前模板已不存在");
        const values = {
          templateId: activeTemplate.id,
          name: refs.titleInput.value,
          description: refs.contentInput.value
        };
        if (editingId) {
          const index = state.groups.findIndex((group) =>
            group.id === editingId && group.templateId === activeTemplate.id
          );
          if (index === -1) throw new Error("找不到要编辑的分类");
          const groups = state.groups.slice();
          groups[index] = Model.updateGroup(groups[index], values, now);
          state = { ...state, groups };
          message = "分类修改已保存";
        } else {
          const group = Model.createGroup(values, {
            now,
            order: Model.leadingOrder(groupsForTemplate(activeTemplate.id))
          });
          state = { ...state, groups: [group, ...state.groups] };
          activeGroupId = group.id;
          clearSearch(false);
          message = "分类已建立，可以添加二级内容";
        }
        touchTemplate(activeTemplate.id, now);
      } else if (editorType === "snippet") {
        const activeGroup = getActiveGroup();
        if (!activeGroup) throw new Error("当前分类已不存在");
        const values = {
          groupId: activeGroup.id,
          title: refs.titleInput.value,
          content: refs.contentInput.value
        };

        if (editingId) {
          const index = state.snippets.findIndex((snippet) => snippet.id === editingId);
          if (index === -1) throw new Error("找不到要编辑的内容");
          const snippets = state.snippets.slice();
          snippets[index] = Model.updateSnippet(snippets[index], values, now);
          state = { ...state, snippets };
          message = "内容修改已保存";
        } else {
          const snippet = Model.createSnippet(values, {
            now,
            order: Model.leadingOrder(snippetsForGroup(activeGroup.id))
          });
          state = { ...state, snippets: [snippet, ...state.snippets] };
          message = "二级内容已保存";
        }
        touchGroup(activeGroup.id, now);
      } else {
        throw new Error("编辑器状态无效");
      }

      closeEditor(false);
      render();
      await persistState();
      showToast(message);
    } catch (error) {
      showToast(error.message || "保存失败", "error");
    }
  }

  function touchGroup(groupId, timestamp) {
    const group = state.groups.find((item) => item.id === groupId);
    state = {
      ...state,
      groups: state.groups.map((group) => group.id === groupId
        ? { ...group, updatedAt: timestamp }
        : group)
    };
    if (group) touchTemplate(group.templateId, timestamp);
  }

  function touchTemplate(templateId, timestamp) {
    state = {
      ...state,
      templates: state.templates.map((template) => template.id === templateId
        ? { ...template, updatedAt: timestamp }
        : template)
    };
  }

  function navigateToGroup(groupId) {
    const group = state.groups.find((item) =>
      item.id === groupId && item.templateId === activeTemplateId
    );
    if (!group) {
      showToast("这个分类已不存在", "error");
      return;
    }
    activeGroupId = group.id;
    pendingDelete = null;
    closeEditor(false);
    clearSearch(false);
    render();
    requestAnimationFrame(() => refs.search.focus());
  }

  function selectTemplate(templateId) {
    const template = state.templates.find((item) => item.id === templateId);
    if (!template) {
      showToast("这个模板已不存在", "error");
      render();
      return;
    }

    activeTemplateId = template.id;
    activeGroupId = null;
    pendingDelete = null;
    closeEditor(false);
    clearSearch(false);
    state = { ...state, selectedTemplateId: template.id };
    render();
    void persistState();
  }

  function requestTemplateDelete() {
    const template = editingId
      ? state.templates.find((item) => item.id === editingId)
      : null;
    if (editorType !== "template" || !template) {
      showToast("这个模板已不存在", "error");
      closeEditor(false);
      return;
    }
    if (state.templates.length <= 1) {
      showToast("至少保留一个模板", "error");
      return;
    }

    const groupIds = new Set(groupsForTemplate(template.id).map((group) => group.id));
    const snippetCount = state.snippets.filter((snippet) => groupIds.has(snippet.groupId)).length;
    const groupCount = groupIds.size;
    refs.templateDeleteMessage.textContent = groupCount > 0
      ? `删除“${template.name}”及其中 ${groupCount} 个分类、${snippetCount} 条内容？`
      : `确定删除空模板“${template.name}”？`;
    refs.templateDeleteConfirmation.hidden = false;
    refs.deleteTemplateButton.hidden = true;
  }

  function cancelTemplateDelete() {
    refs.templateDeleteConfirmation.hidden = true;
    refs.deleteTemplateButton.hidden = state.templates.length <= 1;
  }

  function confirmTemplateDelete() {
    const template = editingId
      ? state.templates.find((item) => item.id === editingId)
      : null;
    if (editorType !== "template" || !template) {
      showToast("这个模板已不存在", "error");
      closeEditor(false);
      return;
    }
    if (state.templates.length <= 1) {
      showToast("至少保留一个模板", "error");
      cancelTemplateDelete();
      return;
    }

    const templateIndex = state.templates.findIndex((item) => item.id === template.id);
    const remainingTemplates = state.templates.filter((item) => item.id !== template.id);
    const fallbackTemplate = remainingTemplates[Math.min(templateIndex, remainingTemplates.length - 1)]
      || remainingTemplates[0];
    const deletedGroups = groupsForTemplate(template.id);
    const deletedGroupIds = new Set(deletedGroups.map((group) => group.id));
    const deletedSnippetCount = state.snippets.filter((snippet) =>
      deletedGroupIds.has(snippet.groupId)
    ).length;

    activeTemplateId = fallbackTemplate.id;
    activeGroupId = null;
    pendingDelete = null;
    clearSearch(false);
    state = {
      ...state,
      selectedTemplateId: fallbackTemplate.id,
      templates: remainingTemplates,
      groups: state.groups.filter((group) => !deletedGroupIds.has(group.id)),
      snippets: state.snippets.filter((snippet) => !deletedGroupIds.has(snippet.groupId))
    };
    closeEditor(false);
    render();
    void persistState();
    showToast(
      deletedGroups.length > 0
        ? `已删除模板及 ${deletedGroups.length} 个分类、${deletedSnippetCount} 条内容`
        : `已删除模板：${template.name}`
    );
  }

  function copyGroup(groupId) {
    const group = state.groups.find((item) =>
      item.id === groupId && item.templateId === activeTemplateId
    );
    if (!group) {
      showToast("这个分类已不存在", "error");
      return;
    }

    groupClipboard = Model.createGroupClipboard(
      group,
      snippetsForGroup(group.id),
      { now: Date.now() }
    );
    renderTransferBanner(getActiveTemplate());
    void persistGroupClipboard();
    showToast(`已复制整组“${group.name}”，切换模板后可粘贴`);
  }

  function clearGroupClipboard(announce) {
    groupClipboard = null;
    renderTransferBanner(getActiveTemplate());
    void persistGroupClipboard();
    if (announce !== false) showToast("已清除整组复制暂存");
  }

  function pasteGroupClipboard() {
    const activeTemplate = getActiveTemplate();
    if (!groupClipboard) {
      showToast("请先复制一个一级分类", "error");
      return;
    }
    if (!activeTemplate) {
      showToast("请先选择目标模板", "error");
      return;
    }
    if (groupClipboard.sourceTemplateId === activeTemplate.id) {
      showToast("请切换到其他模板后再粘贴", "error");
      return;
    }
    if (state.groups.length >= Model.MAX_GROUPS) {
      showToast(`最多建立 ${Model.MAX_GROUPS} 个分类`, "error");
      return;
    }
    if (state.snippets.length + groupClipboard.snippets.length > Model.MAX_SNIPPETS) {
      showToast(`粘贴后将超过 ${Model.MAX_SNIPPETS} 条内容上限`, "error");
      return;
    }

    try {
      const now = Date.now();
      const currentGroups = groupsForTemplate(activeTemplate.id);
      const pasted = Model.instantiateGroupClipboard(
        groupClipboard,
        activeTemplate.id,
        currentGroups,
        { now, order: Model.leadingOrder(currentGroups) }
      );
      state = {
        ...state,
        groups: [pasted.group, ...state.groups],
        snippets: [...pasted.snippets, ...state.snippets]
      };
      touchTemplate(activeTemplate.id, now);
      activeGroupId = pasted.group.id;
      pendingDelete = null;
      closeEditor(false);
      clearSearch(false);
      render();
      void persistState();
      showToast(`已粘贴“${pasted.group.name}”及 ${pasted.snippets.length} 条内容`);
    } catch (error) {
      showToast(error.message || "整组粘贴失败", "error");
    }
  }

  function navigateToGroups() {
    activeGroupId = null;
    pendingDelete = null;
    closeEditor(false);
    clearSearch(false);
    render();
    requestAnimationFrame(() => refs.search.focus());
  }

  function currentPanelMode() {
    return state.collapsed ? "collapsed" : "expanded";
  }

  function panelElementForMode(mode) {
    return mode === "collapsed"
      ? shadow.querySelector(".qcp-collapsed-trigger")
      : refs.panel;
  }

  function clampValue(value, minimum, maximum) {
    return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
  }

  function clampPanelCoordinates(mode, left, top) {
    const element = panelElementForMode(mode);
    const bounds = element ? element.getBoundingClientRect() : { width: 0, height: 0 };
    const width = element ? element.offsetWidth || bounds.width : bounds.width;
    const height = element ? element.offsetHeight || bounds.height : bounds.height;
    const margin = mode === "collapsed" ? 6 : 8;
    const maxTop = window.innerHeight - height - margin;

    if (mode === "collapsed") {
      return {
        left,
        top: clampValue(top, margin, maxTop)
      };
    }

    const maxLeft = window.innerWidth - width - margin;
    return {
      left: clampValue(left, margin, maxLeft),
      top: clampValue(top, margin, maxTop)
    };
  }

  function clearPanelPositionStyles() {
    refs.shell.style.removeProperty("left");
    refs.shell.style.removeProperty("right");
    refs.shell.style.removeProperty("top");
    refs.shell.style.removeProperty("transform");
  }

  function setPanelCoordinates(mode, coordinates) {
    refs.shell.style.setProperty("top", `${Math.round(coordinates.top)}px`);
    refs.shell.style.setProperty("transform", "none");

    if (mode === "expanded") {
      refs.shell.style.setProperty("left", `${Math.round(coordinates.left)}px`);
      refs.shell.style.setProperty("right", "auto");
    } else {
      refs.shell.style.removeProperty("left");
      refs.shell.style.removeProperty("right");
    }
  }

  function applySavedPanelPosition() {
    positionFrame = null;
    if (windowDragState) return;

    const mode = currentPanelMode();
    const saved = mode === "expanded"
      ? panelPosition.expanded
      : panelPosition.collapsedTop === null
        ? null
        : { left: 0, top: panelPosition.collapsedTop };

    if (!saved) {
      clearPanelPositionStyles();
      return;
    }

    setPanelCoordinates(
      mode,
      clampPanelCoordinates(mode, saved.left, saved.top)
    );
  }

  function schedulePanelPosition() {
    if (positionFrame !== null) cancelAnimationFrame(positionFrame);
    positionFrame = requestAnimationFrame(applySavedPanelPosition);
  }

  function beginWindowDrag(event) {
    if (!panelEnabled || event.isPrimary === false) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const target = event.target instanceof Element ? event.target : null;
    const zone = target ? target.closest("[data-window-drag-zone]") : null;
    if (!zone) return;

    const mode = zone.dataset.windowDragZone;
    if (mode !== currentPanelMode()) return;
    if (mode === "expanded" && target.closest("button, input, textarea, select, a")) return;

    const element = panelElementForMode(mode);
    if (!element) return;
    const bounds = refs.shell.getBoundingClientRect();

    windowDragState = {
      mode,
      pointerId: event.pointerId,
      zone,
      startX: event.clientX,
      startY: event.clientY,
      originLeft: bounds.left,
      originTop: bounds.top,
      current: { left: bounds.left, top: bounds.top },
      moved: false
    };

    if (typeof zone.setPointerCapture === "function") {
      zone.setPointerCapture(event.pointerId);
    }
  }

  function updateWindowDrag(event) {
    if (!windowDragState || event.pointerId !== windowDragState.pointerId) return;

    const deltaX = event.clientX - windowDragState.startX;
    const deltaY = event.clientY - windowDragState.startY;
    if (!windowDragState.moved && Math.hypot(deltaX, deltaY) < 5) return;

    windowDragState.moved = true;
    refs.shell.classList.add("is-window-dragging");
    event.preventDefault();

    const coordinates = clampPanelCoordinates(
      windowDragState.mode,
      windowDragState.originLeft + (windowDragState.mode === "expanded" ? deltaX : 0),
      windowDragState.originTop + deltaY
    );
    windowDragState.current = coordinates;
    setPanelCoordinates(windowDragState.mode, coordinates);
  }

  function finishWindowDrag(event) {
    if (!windowDragState || event.pointerId !== windowDragState.pointerId) return;
    const completedDrag = windowDragState;
    windowDragState = null;
    refs.shell.classList.remove("is-window-dragging");

    if (typeof completedDrag.zone.hasPointerCapture === "function"
      && completedDrag.zone.hasPointerCapture(completedDrag.pointerId)) {
      completedDrag.zone.releasePointerCapture(completedDrag.pointerId);
    }

    if (!completedDrag.moved) return;

    if (completedDrag.mode === "expanded") {
      panelPosition = Model.normalizePanelPosition({
        ...panelPosition,
        expanded: completedDrag.current
      });
      showToast("窗口位置已保存");
    } else {
      panelPosition = Model.normalizePanelPosition({
        ...panelPosition,
        collapsedTop: completedDrag.current.top
      });
      if (event.type === "pointerup") {
        suppressCollapsedToggle = true;
        window.setTimeout(() => { suppressCollapsedToggle = false; }, 0);
      }
    }

    void persistPanelPosition();
  }

  function cancelWindowDrag() {
    if (!windowDragState) return;
    const activeDrag = windowDragState;
    windowDragState = null;
    refs.shell.classList.remove("is-window-dragging");
    if (typeof activeDrag.zone.hasPointerCapture === "function"
      && activeDrag.zone.hasPointerCapture(activeDrag.pointerId)) {
      activeDrag.zone.releasePointerCapture(activeDrag.pointerId);
    }
  }

  function movePanelWithKeyboard(mode, key, step) {
    if (mode !== currentPanelMode()) return false;
    if (mode === "collapsed" && !["ArrowUp", "ArrowDown"].includes(key)) return false;

    const element = panelElementForMode(mode);
    if (!element) return false;
    const bounds = refs.shell.getBoundingClientRect();
    const horizontal = key === "ArrowLeft" ? -step : key === "ArrowRight" ? step : 0;
    const vertical = key === "ArrowUp" ? -step : key === "ArrowDown" ? step : 0;
    const coordinates = clampPanelCoordinates(
      mode,
      bounds.left + horizontal,
      bounds.top + vertical
    );

    setPanelCoordinates(mode, coordinates);
    panelPosition = Model.normalizePanelPosition(mode === "expanded"
      ? { ...panelPosition, expanded: coordinates }
      : { ...panelPosition, collapsedTop: coordinates.top });
    void persistPanelPosition();
    if (mode === "expanded") showToast("窗口位置已保存");
    return true;
  }

  function setPanelEnabled(enabled) {
    panelEnabled = enabled !== false;
    host.style.setProperty("display", panelEnabled ? "block" : "none", "important");
    host.setAttribute("aria-hidden", String(!panelEnabled));
    if (!panelEnabled) {
      finishDrag();
      cancelWindowDrag();
    }
    if (panelEnabled) schedulePanelPosition();
  }

  function openPanel() {
    const shouldSaveLayout = state.collapsed;
    setPanelEnabled(true);
    if (shouldSaveLayout) {
      state = { ...state, collapsed: false };
      render();
      void persistState();
    }
    void persistEnabled(true);
    requestAnimationFrame(() => refs.search.focus());
  }

  function togglePanel() {
    if (!panelEnabled) {
      openPanel();
      return;
    }

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

  function clearSearch(shouldFocus) {
    searchQuery = "";
    refs.search.value = "";
    refs.searchClear.hidden = true;
    if (shouldFocus) refs.search.focus();
  }

  function confirmDelete(type, id) {
    if (type === "group") {
      const group = state.groups.find((item) =>
        item.id === id && item.templateId === activeTemplateId
      );
      if (!group) return;
      const childCount = snippetsForGroup(id).length;
      const now = Date.now();
      state = {
        ...state,
        groups: state.groups.filter((item) => item.id !== id),
        snippets: state.snippets.filter((snippet) => snippet.groupId !== id)
      };
      touchTemplate(group.templateId, now);
      if (activeGroupId === id) activeGroupId = null;
      pendingDelete = null;
      render();
      void persistState();
      showToast(childCount > 0 ? `已删除分类及 ${childCount} 条内容` : `已删除分类：${group.name}`);
    } else {
      const activeGroup = getActiveGroup();
      const snippet = activeGroup
        ? state.snippets.find((item) => item.id === id && item.groupId === activeGroup.id)
        : null;
      if (!snippet) return;
      state = { ...state, snippets: state.snippets.filter((item) => item.id !== id) };
      touchGroup(snippet.groupId, Date.now());
      pendingDelete = null;
      if (editingId === id) closeEditor(false);
      render();
      void persistState();
      showToast(`已删除：${snippet.title}`);
    }
  }

  function orderedItemsFor(type) {
    return type === "group"
      ? Model.filterGroups(groupsForTemplate(activeTemplateId), state.snippets, "")
      : Model.filterSnippets(snippetsForGroup(activeGroupId), "");
  }

  function applyReorder(type, sourceId, targetId, placeAfter, focusHandle) {
    const items = orderedItemsFor(type);
    const source = items.find((item) => item.id === sourceId);
    if (!source || (targetId && !items.some((item) => item.id === targetId))) {
      return;
    }

    const reordered = Model.reorderItems(items, sourceId, targetId, placeAfter);
    if (type === "group") {
      const orderById = new Map(reordered.map((item) => [item.id, item.order]));
      state = {
        ...state,
        groups: state.groups.map((group) => orderById.has(group.id)
          ? { ...group, order: orderById.get(group.id) }
          : group)
      };
    } else {
      const orderById = new Map(reordered.map((item) => [item.id, item.order]));
      state = {
        ...state,
        snippets: state.snippets.map((snippet) => orderById.has(snippet.id)
          ? { ...snippet, order: orderById.get(snippet.id) }
          : snippet)
      };
    }

    render();
    void persistState();
    showToast(`位置已更新：${source.name || source.title}`);

    if (focusHandle) {
      requestAnimationFrame(() => {
        const handle = Array.from(shadow.querySelectorAll("[data-drag-handle]"))
          .find((item) => item.dataset.id === sourceId && item.dataset.dragType === type);
        handle && handle.focus();
      });
    }
  }

  function moveWithKeyboard(type, id, direction) {
    if (searchQuery) {
      showToast("请先清空搜索再调整位置", "error");
      return;
    }

    const items = orderedItemsFor(type);
    const sourceIndex = items.findIndex((item) => item.id === id);
    const targetIndex = sourceIndex + direction;
    if (sourceIndex === -1 || targetIndex < 0 || targetIndex >= items.length) {
      showToast(direction < 0 ? "已经在最前面" : "已经在最后面");
      return;
    }

    applyReorder(type, id, items[targetIndex].id, direction > 0, true);
  }

  function clearDropMarkers() {
    for (const card of shadow.querySelectorAll(".qcp-drop-before, .qcp-drop-after")) {
      card.classList.remove("qcp-drop-before", "qcp-drop-after");
    }
  }

  function finishDrag() {
    clearDropMarkers();
    refs.list.classList.remove("is-dragging");
    for (const card of shadow.querySelectorAll(".is-dragging")) {
      card.classList.remove("is-dragging");
    }
    for (const handle of shadow.querySelectorAll('[aria-grabbed="true"]')) {
      handle.setAttribute("aria-grabbed", "false");
    }
    dragState = null;
  }

  function dragCardFromTarget(target, type) {
    if (!(target instanceof Element)) return null;
    return target.closest(type === "group" ? ".qcp-group-card" : ".qcp-card");
  }

  function autoScrollList(pointerY) {
    const bounds = refs.list.getBoundingClientRect();
    const edgeSize = 42;
    if (pointerY < bounds.top + edgeSize) refs.list.scrollTop -= 12;
    else if (pointerY > bounds.bottom - edgeSize) refs.list.scrollTop += 12;
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
        // Clipboard API may be denied by the current page; use the legacy fallback.
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
    if (previousFocus instanceof HTMLElement) previousFocus.focus();
    if (!copied) throw new Error("Copy command failed");
  }

  function showToast(message, tone) {
    window.clearTimeout(toastTimer);
    refs.toastMessage.textContent = message;
    refs.toast.dataset.tone = tone || "success";
    refs.toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => refs.toast.classList.remove("is-visible"), 2200);
  }

  shadow.addEventListener("pointerdown", beginWindowDrag);
  shadow.addEventListener("pointermove", updateWindowDrag);
  shadow.addEventListener("pointerup", finishWindowDrag);
  shadow.addEventListener("pointercancel", finishWindowDrag);

  shadow.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target.closest("[data-action]") : null;
    if (!target) return;

    const action = target.dataset.action;
    const id = target.dataset.id;
    const entity = target.dataset.entity;

    if (action === "toggle"
      && target.classList.contains("qcp-collapsed-trigger")
      && suppressCollapsedToggle) {
      suppressCollapsedToggle = false;
      event.preventDefault();
      return;
    }

    if (action === "toggle") togglePanel();
    else if (action === "add-template") openTemplateEditor(null);
    else if (action === "edit-template") {
      const activeTemplate = getActiveTemplate();
      if (activeTemplate) openTemplateEditor(activeTemplate.id);
    }
    else if (action === "request-template-delete") requestTemplateDelete();
    else if (action === "cancel-template-delete") cancelTemplateDelete();
    else if (action === "confirm-template-delete") confirmTemplateDelete();
    else if (action === "add") getActiveGroup() ? openSnippetEditor(null) : openGroupEditor(null);
    else if (action === "cancel-editor") closeEditor(true);
    else if (action === "clear-search") { clearSearch(true); renderList(); }
    else if (action === "empty-action") {
      if (searchQuery) { clearSearch(true); renderList(); }
      else getActiveGroup() ? openSnippetEditor(null) : openGroupEditor(null);
    }
    else if (action === "open-group") navigateToGroup(id);
    else if (action === "back-to-groups") navigateToGroups();
    else if (action === "edit-group") openGroupEditor(id);
    else if (action === "edit-current-group") {
      const activeGroup = getActiveGroup();
      if (activeGroup) openGroupEditor(activeGroup.id);
    }
    else if (action === "edit-snippet") openSnippetEditor(id);
    else if (action === "copy") void copySnippet(id, target);
    else if (action === "copy-group") copyGroup(id);
    else if (action === "paste-group") pasteGroupClipboard();
    else if (action === "clear-group-copy") clearGroupClipboard(true);
    else if (action === "request-delete") { pendingDelete = { type: entity, id }; renderList(); }
    else if (action === "cancel-delete") { pendingDelete = null; renderList(); }
    else if (action === "confirm-delete") confirmDelete(entity, id);
  });

  shadow.addEventListener("dragstart", (event) => {
    const handle = event.target instanceof Element
      ? event.target.closest("[data-drag-handle]")
      : null;
    if (!handle || searchQuery || handle.getAttribute("aria-disabled") === "true") {
      event.preventDefault();
      return;
    }

    const type = handle.dataset.dragType;
    const card = dragCardFromTarget(handle, type);
    if (!card || !event.dataTransfer) {
      event.preventDefault();
      return;
    }

    dragState = { type, id: handle.dataset.id };
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", handle.dataset.id);
    handle.setAttribute("aria-grabbed", "true");
    refs.list.classList.add("is-dragging");
    requestAnimationFrame(() => card.classList.add("is-dragging"));
  });

  shadow.addEventListener("dragover", (event) => {
    if (!dragState) return;
    const targetCard = dragCardFromTarget(event.target, dragState.type);
    if (!targetCard || targetCard.dataset.id === dragState.id) return;

    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
    clearDropMarkers();
    const bounds = targetCard.getBoundingClientRect();
    targetCard.classList.add(event.clientY >= bounds.top + bounds.height / 2
      ? "qcp-drop-after"
      : "qcp-drop-before");
    autoScrollList(event.clientY);
  });

  shadow.addEventListener("drop", (event) => {
    if (!dragState) return;
    const currentDrag = { ...dragState };
    const targetCard = dragCardFromTarget(event.target, currentDrag.type);
    if (!targetCard || targetCard.dataset.id === currentDrag.id) {
      finishDrag();
      return;
    }

    event.preventDefault();
    const targetId = targetCard.dataset.id;
    const placeAfter = targetCard.classList.contains("qcp-drop-after");
    finishDrag();
    applyReorder(currentDrag.type, currentDrag.id, targetId, placeAfter, false);
  });

  shadow.addEventListener("dragend", () => {
    finishDrag();
  });

  shadow.addEventListener("keydown", (event) => {
    const windowHandle = event.target instanceof Element
      ? event.target.closest("[data-window-drag-handle], [data-window-drag-zone=\"collapsed\"]")
      : null;
    if (windowHandle && event.altKey && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
      const mode = windowHandle.dataset.windowDragHandle || windowHandle.dataset.windowDragZone;
      if (movePanelWithKeyboard(mode, event.key, event.shiftKey ? 32 : 12)) {
        event.preventDefault();
        return;
      }
    }

    const handle = event.target instanceof Element
      ? event.target.closest("[data-drag-handle]")
      : null;
    if (!handle || !event.altKey || !["ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    moveWithKeyboard(handle.dataset.dragType, handle.dataset.id, event.key === "ArrowUp" ? -1 : 1);
  });

  refs.search.addEventListener("input", () => {
    searchQuery = refs.search.value.trim();
    refs.searchClear.hidden = searchQuery.length === 0;
    renderList();
  });

  refs.templateSelect.addEventListener("change", () => {
    selectTemplate(refs.templateSelect.value);
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

  window.addEventListener("resize", schedulePanelPosition);

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || typeof message !== "object") return;

    if (message.type === TOGGLE_MESSAGE) {
      togglePanel();
    } else if (message.type === SET_ENABLED_MESSAGE) {
      setPanelEnabled(message.enabled !== false);
    } else if (message.type === OPEN_MESSAGE) {
      openPanel();
    } else if (message.type !== GET_STATUS_MESSAGE) {
      return;
    }

    sendResponse({
      ok: true,
      enabled: panelEnabled,
      collapsed: state.collapsed,
      templates: state.templates.length,
      groups: state.groups.length,
      snippets: state.snippets.length
    });
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") return;
    let shouldMigrateState = false;

    if (changes[ENABLED_KEY]) {
      setPanelEnabled(changes[ENABLED_KEY].newValue !== false);
    }

    if (changes[POSITION_KEY]) {
      panelPosition = Model.normalizePanelPosition(changes[POSITION_KEY].newValue);
      schedulePanelPosition();
    }

    if (changes[GROUP_CLIPBOARD_KEY]) {
      groupClipboard = Model.normalizeGroupClipboard(changes[GROUP_CLIPBOARD_KEY].newValue);
    }

    if (changes[STORAGE_KEY]) {
      const incomingState = changes[STORAGE_KEY].newValue;
      shouldMigrateState = Boolean(incomingState)
        && incomingState.version !== Model.SCHEMA_VERSION;
      const nextState = Model.normalizeState(incomingState);
      const templateChanged = activeTemplateId !== nextState.selectedTemplateId;
      state = nextState;
      activeTemplateId = state.selectedTemplateId;

      if (templateChanged) {
        activeGroupId = null;
        pendingDelete = null;
        closeEditor(false);
        clearSearch(false);
      } else {
        if (activeGroupId && !getActiveGroup()) activeGroupId = null;
        if (editingId) {
          const source = editorType === "template"
            ? state.templates
            : editorType === "group"
              ? state.groups
              : state.snippets;
          if (!source.some((item) => item.id === editingId)) closeEditor(false);
        }
      }
    }

    if (changes[STORAGE_KEY] || changes[GROUP_CLIPBOARD_KEY]) render();
    if (shouldMigrateState) void persistState();
  });

  readStoredState().then((stored) => {
    state = stored.state;
    panelPosition = stored.position;
    groupClipboard = stored.clipboard;
    activeTemplateId = state.selectedTemplateId;
    render();
    setPanelEnabled(stored.enabled);
    if (stored.needsMigration) void persistState();
  });
})();
