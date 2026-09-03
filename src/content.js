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
    <div class="qcp-shell" data-collapsed="false" data-level="groups">
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
            <p>分级整理，一点即用</p>
          </div>
          <button class="qcp-icon-button qcp-collapse-button" type="button" data-action="toggle" aria-label="收起面板" title="收起面板">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>
          </button>
        </header>

        <div class="qcp-main">
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

            <div class="qcp-editor-actions">
              <span class="qcp-save-hint"><kbd>Ctrl</kbd> + <kbd>Enter</kbd> 保存</span>
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
  let activeGroupId = null;
  let searchQuery = "";
  let editorType = null;
  let editingId = null;
  let editorLimits = { title: Model.MAX_GROUP_NAME_LENGTH, content: Model.MAX_GROUP_DESCRIPTION_LENGTH };
  let pendingDelete = null;
  let toastTimer = null;

  function readStoredState() {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        const error = chrome.runtime.lastError;
        if (error) {
          resolve({ state: Model.createDefaultState(), needsMigration: false });
          return;
        }

        const stored = result[STORAGE_KEY];
        resolve({
          state: Model.normalizeState(stored),
          needsMigration: Boolean(stored) && stored.version !== Model.SCHEMA_VERSION
        });
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

  function getActiveGroup() {
    return activeGroupId
      ? state.groups.find((group) => group.id === activeGroupId) || null
      : null;
  }

  function snippetsForGroup(groupId) {
    return state.snippets.filter((snippet) => snippet.groupId === groupId);
  }

  function render() {
    let activeGroup = getActiveGroup();
    if (activeGroupId && !activeGroup) {
      activeGroupId = null;
      activeGroup = null;
    }

    const isDetail = Boolean(activeGroup);
    refs.shell.dataset.collapsed = String(state.collapsed);
    refs.shell.dataset.level = isDetail ? "snippets" : "groups";
    refs.panel.setAttribute("aria-hidden", String(state.collapsed));
    refs.collapsedCount.textContent = String(state.groups.length);
    refs.addLabel.textContent = isDetail ? "内容" : "分类";
    refs.addButton.setAttribute("aria-label", isDetail ? "新增二级内容" : "新增一级分类");
    refs.search.placeholder = isDetail ? "搜索当前分类内容" : "搜索分类或内容";
    refs.searchClear.hidden = searchQuery.length === 0;
    refs.levelContext.hidden = !isDetail;

    if (activeGroup) {
      const itemCount = snippetsForGroup(activeGroup.id).length;
      refs.levelName.textContent = activeGroup.name;
      refs.levelDescription.textContent = activeGroup.description || `${itemCount} 条二级内容`;
    }

    renderList();
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
      refs.listHint.textContent = "单击卡片即可复制";

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
      visibleItems = Model.filterGroups(state.groups, state.snippets, searchQuery);
      refs.resultCount.textContent = searchQuery
        ? `${visibleItems.length} / ${state.groups.length} 个`
        : `${state.groups.length} 个分类`;
      refs.listHint.textContent = "点击分类进入";

      for (const group of visibleItems) {
        refs.list.appendChild(createGroupCard(group));
      }

      configureEmptyState({
        hasResults: visibleItems.length > 0,
        hasAnyItems: state.groups.length > 0,
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
      actions.append(
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

  function openGroupEditor(id) {
    if (!id && state.groups.length >= Model.MAX_GROUPS) {
      showToast(`最多建立 ${Model.MAX_GROUPS} 个分类`, "error");
      return;
    }

    const group = id ? state.groups.find((item) => item.id === id) : null;
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
    refs.contentInput.rows = settings.type === "group" ? 3 : 5;
    refs.contentInput.value = settings.contentValue;
    refs.saveButton.textContent = settings.saveLabel;
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
    editorType = null;
    editingId = null;
    refs.editor.hidden = true;
    refs.editor.reset();
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
      refs.titleInput.setCustomValidity(editorType === "group" ? "请输入分类名称" : "请输入内容名称");
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

      if (editorType === "group") {
        const values = { name: refs.titleInput.value, description: refs.contentInput.value };
        if (editingId) {
          const index = state.groups.findIndex((group) => group.id === editingId);
          if (index === -1) throw new Error("找不到要编辑的分类");
          const groups = state.groups.slice();
          groups[index] = Model.updateGroup(groups[index], values, now);
          state = { ...state, groups };
          message = "分类修改已保存";
        } else {
          const group = Model.createGroup(values, { now });
          state = { ...state, groups: [group, ...state.groups] };
          activeGroupId = group.id;
          clearSearch(false);
          message = "分类已建立，可以添加二级内容";
        }
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
          const snippet = Model.createSnippet(values, { now });
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
    state = {
      ...state,
      groups: state.groups.map((group) => group.id === groupId
        ? { ...group, updatedAt: timestamp }
        : group)
    };
  }

  function navigateToGroup(groupId) {
    const group = state.groups.find((item) => item.id === groupId);
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

  function navigateToGroups() {
    activeGroupId = null;
    pendingDelete = null;
    closeEditor(false);
    clearSearch(false);
    render();
    requestAnimationFrame(() => refs.search.focus());
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

  function clearSearch(shouldFocus) {
    searchQuery = "";
    refs.search.value = "";
    refs.searchClear.hidden = true;
    if (shouldFocus) refs.search.focus();
  }

  function confirmDelete(type, id) {
    if (type === "group") {
      const group = state.groups.find((item) => item.id === id);
      if (!group) return;
      const childCount = snippetsForGroup(id).length;
      state = {
        ...state,
        groups: state.groups.filter((item) => item.id !== id),
        snippets: state.snippets.filter((snippet) => snippet.groupId !== id)
      };
      if (activeGroupId === id) activeGroupId = null;
      pendingDelete = null;
      render();
      void persistState();
      showToast(childCount > 0 ? `已删除分类及 ${childCount} 条内容` : `已删除分类：${group.name}`);
    } else {
      const snippet = state.snippets.find((item) => item.id === id);
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

  shadow.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target.closest("[data-action]") : null;
    if (!target) return;

    const action = target.dataset.action;
    const id = target.dataset.id;
    const entity = target.dataset.entity;

    if (action === "toggle") togglePanel();
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
    else if (action === "request-delete") { pendingDelete = { type: entity, id }; renderList(); }
    else if (action === "cancel-delete") { pendingDelete = null; renderList(); }
    else if (action === "confirm-delete") confirmDelete(entity, id);
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
    if (message && message.type === TOGGLE_MESSAGE) togglePanel();
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !changes[STORAGE_KEY]) return;
    state = Model.normalizeState(changes[STORAGE_KEY].newValue);
    if (activeGroupId && !getActiveGroup()) activeGroupId = null;
    if (editingId) {
      const source = editorType === "group" ? state.groups : state.snippets;
      if (!source.some((item) => item.id === editingId)) closeEditor(false);
    }
    render();
  });

  readStoredState().then((stored) => {
    state = stored.state;
    render();
    if (stored.needsMigration) void persistState();
  });
})();
