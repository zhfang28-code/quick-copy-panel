(function exposeQuickCopyModel(root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.QuickCopyModel = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createModelApi() {
  "use strict";

  const SCHEMA_VERSION = 4;
  const MAX_TEMPLATES = 30;
  const MAX_GROUPS = 100;
  const MAX_SNIPPETS = 500;
  const MAX_TEMPLATE_NAME_LENGTH = 40;
  const MAX_TEMPLATE_DESCRIPTION_LENGTH = 100;
  const MAX_GROUP_NAME_LENGTH = 50;
  const MAX_GROUP_DESCRIPTION_LENGTH = 120;
  const MAX_TITLE_LENGTH = 80;
  const MAX_CONTENT_LENGTH = 10000;
  const UNCATEGORIZED_GROUP_ID = "group-uncategorized";
  const DEFAULT_TEMPLATE_ID = "template-default";
  const GROUP_CLIPBOARD_VERSION = 1;
  const POSITION_VERSION = 1;

  function createDefaultState() {
    const defaultTemplate = createDefaultTemplate(1);
    return {
      version: SCHEMA_VERSION,
      collapsed: false,
      selectedTemplateId: defaultTemplate.id,
      templates: [defaultTemplate],
      groups: [],
      snippets: []
    };
  }

  function createDefaultTemplate(timestamp) {
    const now = cleanTimestamp(timestamp, 1);
    return {
      id: DEFAULT_TEMPLATE_ID,
      name: "默认模板",
      description: "",
      order: 0,
      createdAt: now,
      updatedAt: now
    };
  }

  function cleanSingleLine(value, maxLength) {
    if (typeof value !== "string") {
      return "";
    }

    return value.replace(/\s+/gu, " ").trim().slice(0, maxLength);
  }

  function cleanContent(value) {
    if (typeof value !== "string") {
      return "";
    }

    const content = value.slice(0, MAX_CONTENT_LENGTH);
    return content.trim() ? content : "";
  }

  function cleanTimestamp(value, fallback) {
    return Number.isFinite(value) && value > 0 ? value : fallback;
  }

  function cleanOrder(value, fallback) {
    return Number.isFinite(value) ? value : fallback;
  }

  function cleanCoordinate(value) {
    if (!Number.isFinite(value)) {
      return null;
    }

    return Math.round(Math.max(-100000, Math.min(100000, value)));
  }

  function cleanId(value) {
    return typeof value === "string" ? value.trim().slice(0, 128) : "";
  }

  function uniqueId(preferredId, prefix, timestamp, index, usedIds) {
    let id = preferredId || `${prefix}-${timestamp}-${index}`;
    let suffix = index;

    while (usedIds.has(id)) {
      suffix += 1;
      id = `${preferredId || `${prefix}-${timestamp}`}-${suffix}`;
    }

    usedIds.add(id);
    return id;
  }

  function normalizePanelPosition(candidate) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      return {
        version: POSITION_VERSION,
        expanded: null,
        collapsedTop: null
      };
    }

    const rawExpanded = candidate.expanded;
    const left = rawExpanded && typeof rawExpanded === "object"
      ? cleanCoordinate(rawExpanded.left)
      : null;
    const top = rawExpanded && typeof rawExpanded === "object"
      ? cleanCoordinate(rawExpanded.top)
      : null;

    return {
      version: POSITION_VERSION,
      expanded: left === null || top === null ? null : { left, top },
      collapsedTop: cleanCoordinate(candidate.collapsedTop)
    };
  }

  function normalizeState(candidate) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      return createDefaultState();
    }

    const fallbackTime = Date.now();
    const rawTemplates = Array.isArray(candidate.templates) ? candidate.templates : [];
    const rawGroups = Array.isArray(candidate.groups) ? candidate.groups : [];
    const rawSnippets = Array.isArray(candidate.snippets) ? candidate.snippets : [];
    const templateIds = new Set();
    const groupIds = new Set();
    const snippetIds = new Set();
    let templates = [];
    let groups = [];
    const snippets = [];

    for (let index = 0; index < rawTemplates.length && templates.length < MAX_TEMPLATES; index += 1) {
      const raw = rawTemplates[index];
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;

      const name = cleanSingleLine(raw.name, MAX_TEMPLATE_NAME_LENGTH);
      if (!name) continue;

      const createdAt = cleanTimestamp(raw.createdAt, fallbackTime + index);
      const updatedAt = cleanTimestamp(raw.updatedAt, createdAt);
      const id = uniqueId(cleanId(raw.id), "template", createdAt, index, templateIds);
      templates.push({
        id,
        name,
        description: cleanSingleLine(raw.description, MAX_TEMPLATE_DESCRIPTION_LENGTH),
        order: cleanOrder(raw.order, index),
        createdAt,
        updatedAt
      });
    }

    if (templates.length === 0) {
      const sourceTimes = [...rawGroups, ...rawSnippets]
        .flatMap((item) => item && typeof item === "object"
          ? [item.createdAt, item.updatedAt].filter((value) => Number.isFinite(value) && value > 0)
          : []);
      const createdAt = sourceTimes.length > 0 ? Math.min(...sourceTimes) : fallbackTime;
      const updatedAt = sourceTimes.length > 0 ? Math.max(...sourceTimes) : createdAt;
      const defaultTemplate = {
        ...createDefaultTemplate(createdAt),
        description: candidate.version < SCHEMA_VERSION ? "包含升级前保存的全部内容" : "",
        updatedAt
      };
      templates.push(defaultTemplate);
      templateIds.add(defaultTemplate.id);
    }

    const fallbackTemplate = templates.find((template) => template.id === DEFAULT_TEMPLATE_ID)
      || templates[0];

    for (let index = 0; index < rawGroups.length && groups.length < MAX_GROUPS; index += 1) {
      const raw = rawGroups[index];
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;

      const name = cleanSingleLine(raw.name, MAX_GROUP_NAME_LENGTH);
      if (!name) continue;

      const createdAt = cleanTimestamp(raw.createdAt, fallbackTime + index);
      const updatedAt = cleanTimestamp(raw.updatedAt, createdAt);
      const id = uniqueId(cleanId(raw.id), "group", createdAt, index, groupIds);
      const requestedTemplateId = cleanId(raw.templateId);
      groups.push({
        id,
        templateId: templateIds.has(requestedTemplateId)
          ? requestedTemplateId
          : fallbackTemplate.id,
        name,
        description: cleanSingleLine(raw.description, MAX_GROUP_DESCRIPTION_LENGTH),
        order: cleanOrder(raw.order, index),
        createdAt,
        updatedAt
      });
    }

    for (let index = 0; index < rawSnippets.length && snippets.length < MAX_SNIPPETS; index += 1) {
      const raw = rawSnippets[index];
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;

      const title = cleanSingleLine(raw.title, MAX_TITLE_LENGTH);
      const content = cleanContent(raw.content);
      if (!title || !content) continue;

      const createdAt = cleanTimestamp(raw.createdAt, fallbackTime + index);
      const updatedAt = cleanTimestamp(raw.updatedAt, createdAt);
      const id = uniqueId(cleanId(raw.id), "snippet", createdAt, index, snippetIds);
      snippets.push({
        id,
        groupId: cleanId(raw.groupId),
        title,
        content,
        order: cleanOrder(raw.order, index),
        createdAt,
        updatedAt
      });
    }

    const orphanedSnippets = snippets.filter((snippet) => !groupIds.has(snippet.groupId));
    if (orphanedSnippets.length > 0) {
      let fallbackGroup = groups.find((group) =>
        group.id === UNCATEGORIZED_GROUP_ID && group.templateId === fallbackTemplate.id
      );

      if (!fallbackGroup && groups.length < MAX_GROUPS) {
        const oldestSnippetTime = Math.min(...orphanedSnippets.map((snippet) => snippet.createdAt));
        const newestSnippetTime = Math.max(...orphanedSnippets.map((snippet) => snippet.updatedAt));
        const id = uniqueId(
          UNCATEGORIZED_GROUP_ID,
          "group",
          oldestSnippetTime,
          groups.length,
          groupIds
        );
        fallbackGroup = {
          id,
          templateId: fallbackTemplate.id,
          name: "未分类",
          description: candidate.version === 1 ? "从旧版本自动迁移的内容" : "尚未归入其他分类的内容",
          order: groups.filter((group) => group.templateId === fallbackTemplate.id).length,
          createdAt: oldestSnippetTime,
          updatedAt: newestSnippetTime
        };
        groups.push(fallbackGroup);
      }

      if (!fallbackGroup) fallbackGroup = groups[0];
      if (fallbackGroup) {
        for (const snippet of orphanedSnippets) snippet.groupId = fallbackGroup.id;
      }
    }

    const latestSnippetByGroup = new Map();
    for (const snippet of snippets) {
      const current = latestSnippetByGroup.get(snippet.groupId) || 0;
      latestSnippetByGroup.set(snippet.groupId, Math.max(current, snippet.updatedAt));
    }

    groups = groups.map((group) => ({
      ...group,
      updatedAt: Math.max(group.updatedAt, latestSnippetByGroup.get(group.id) || 0)
    }));

    const latestGroupByTemplate = new Map();
    for (const group of groups) {
      const current = latestGroupByTemplate.get(group.templateId) || 0;
      latestGroupByTemplate.set(group.templateId, Math.max(current, group.updatedAt));
    }

    const hasTemplateOrder = candidate.version >= 4;
    templates = templates
      .map((template) => ({
        ...template,
        updatedAt: Math.max(template.updatedAt, latestGroupByTemplate.get(template.id) || 0)
      }))
      .sort(hasTemplateOrder ? compareByOrder : compareByUpdatedAt)
      .map((template, index) => ({ ...template, order: index }));

    const hasCardOrder = candidate.version >= 3;
    const orderedGroups = [];
    for (const template of templates) {
      const children = groups
        .filter((group) => group.templateId === template.id)
        .sort(hasCardOrder ? compareByOrder : compareByUpdatedAt)
        .map((group, index) => ({ ...group, order: index }));
      orderedGroups.push(...children);
    }

    const orderedSnippets = [];
    for (const group of orderedGroups) {
      const children = snippets
        .filter((snippet) => snippet.groupId === group.id)
        .sort(hasCardOrder ? compareByOrder : compareByUpdatedAt)
        .map((snippet, index) => ({ ...snippet, order: index }));
      orderedSnippets.push(...children);
    }

    const requestedTemplateId = cleanId(candidate.selectedTemplateId);
    const selectedTemplateId = templates.some((template) => template.id === requestedTemplateId)
      ? requestedTemplateId
      : templates[0].id;

    return {
      version: SCHEMA_VERSION,
      collapsed: candidate.collapsed === true,
      selectedTemplateId,
      templates,
      groups: orderedGroups,
      snippets: orderedSnippets
    };
  }

  function createTemplate(values, options) {
    const settings = options || {};
    const name = cleanSingleLine(values && values.name, MAX_TEMPLATE_NAME_LENGTH);
    if (!name) throw new Error("模板名称不能为空");

    const now = cleanTimestamp(settings.now, Date.now());
    return {
      id: cleanId(settings.id) || createId("template", now),
      name,
      description: cleanSingleLine(
        values && values.description,
        MAX_TEMPLATE_DESCRIPTION_LENGTH
      ),
      order: cleanOrder(settings.order, 0),
      createdAt: now,
      updatedAt: now
    };
  }

  function updateTemplate(template, values, now) {
    if (!template || typeof template !== "object") {
      throw new Error("找不到要编辑的模板");
    }

    const name = cleanSingleLine(values && values.name, MAX_TEMPLATE_NAME_LENGTH);
    if (!name) throw new Error("模板名称不能为空");

    return {
      ...template,
      name,
      description: cleanSingleLine(
        values && values.description,
        MAX_TEMPLATE_DESCRIPTION_LENGTH
      ),
      updatedAt: cleanTimestamp(now, Date.now())
    };
  }

  function createGroup(values, options) {
    const settings = options || {};
    const templateId = cleanId(values && values.templateId);
    const name = cleanSingleLine(values && values.name, MAX_GROUP_NAME_LENGTH);
    if (!templateId) {
      throw new Error("必须先选择一个模板");
    }
    if (!name) {
      throw new Error("分类名称不能为空");
    }

    const now = cleanTimestamp(settings.now, Date.now());
    return {
      id: cleanId(settings.id) || createId("group", now),
      templateId,
      name,
      description: cleanSingleLine(
        values && values.description,
        MAX_GROUP_DESCRIPTION_LENGTH
      ),
      order: cleanOrder(settings.order, 0),
      createdAt: now,
      updatedAt: now
    };
  }

  function updateGroup(group, values, now) {
    if (!group || typeof group !== "object") {
      throw new Error("找不到要编辑的分类");
    }

    const name = cleanSingleLine(values && values.name, MAX_GROUP_NAME_LENGTH);
    if (!name) {
      throw new Error("分类名称不能为空");
    }

    return {
      ...group,
      name,
      description: cleanSingleLine(
        values && values.description,
        MAX_GROUP_DESCRIPTION_LENGTH
      ),
      updatedAt: cleanTimestamp(now, Date.now())
    };
  }

  function createSnippet(values, options) {
    const settings = options || {};
    const groupId = cleanId(values && values.groupId);
    const title = cleanSingleLine(values && values.title, MAX_TITLE_LENGTH);
    const content = cleanContent(values && values.content);

    if (!groupId) {
      throw new Error("必须先选择一个分类");
    }
    if (!title || !content) {
      throw new Error("内容名称和文本正文均不能为空");
    }

    const now = cleanTimestamp(settings.now, Date.now());
    return {
      id: cleanId(settings.id) || createId("snippet", now),
      groupId,
      title,
      content,
      order: cleanOrder(settings.order, 0),
      createdAt: now,
      updatedAt: now
    };
  }

  function updateSnippet(snippet, values, now) {
    if (!snippet || typeof snippet !== "object") {
      throw new Error("找不到要编辑的内容");
    }

    const title = cleanSingleLine(values && values.title, MAX_TITLE_LENGTH);
    const content = cleanContent(values && values.content);
    if (!title || !content) {
      throw new Error("内容名称和文本正文均不能为空");
    }

    return {
      ...snippet,
      title,
      content,
      updatedAt: cleanTimestamp(now, Date.now())
    };
  }

  function normalizeGroupClipboard(candidate) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      return null;
    }

    const sourceTemplateId = cleanId(candidate.sourceTemplateId);
    const rawGroup = candidate.group;
    const groupName = rawGroup && typeof rawGroup === "object"
      ? cleanSingleLine(rawGroup.name, MAX_GROUP_NAME_LENGTH)
      : "";
    if (!sourceTemplateId || !groupName) return null;

    const rawSnippets = Array.isArray(candidate.snippets) ? candidate.snippets : [];
    const snippets = [];
    for (let index = 0; index < rawSnippets.length && snippets.length < MAX_SNIPPETS; index += 1) {
      const raw = rawSnippets[index];
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
      const title = cleanSingleLine(raw.title, MAX_TITLE_LENGTH);
      const content = cleanContent(raw.content);
      if (!title || !content) continue;
      snippets.push({
        title,
        content,
        order: cleanOrder(raw.order, index)
      });
    }

    return {
      version: GROUP_CLIPBOARD_VERSION,
      sourceTemplateId,
      copiedAt: cleanTimestamp(candidate.copiedAt, Date.now()),
      group: {
        name: groupName,
        description: cleanSingleLine(
          rawGroup.description,
          MAX_GROUP_DESCRIPTION_LENGTH
        )
      },
      snippets: snippets.sort(compareByOrder).map((snippet, index) => ({
        ...snippet,
        order: index
      }))
    };
  }

  function createGroupClipboard(group, snippets, options) {
    if (!group || typeof group !== "object") {
      throw new Error("找不到要复制的分类");
    }

    const settings = options || {};
    return normalizeGroupClipboard({
      version: GROUP_CLIPBOARD_VERSION,
      sourceTemplateId: group.templateId,
      copiedAt: cleanTimestamp(settings.now, Date.now()),
      group: {
        name: group.name,
        description: group.description
      },
      snippets: (Array.isArray(snippets) ? snippets : [])
        .filter((snippet) => snippet && snippet.groupId === group.id)
        .map((snippet) => ({
          title: snippet.title,
          content: snippet.content,
          order: snippet.order
        }))
    });
  }

  function uniqueGroupName(preferredName, existingGroups) {
    const baseName = cleanSingleLine(preferredName, MAX_GROUP_NAME_LENGTH) || "复制的分类";
    const existingNames = new Set((Array.isArray(existingGroups) ? existingGroups : [])
      .map((group) => cleanSingleLine(group && group.name, MAX_GROUP_NAME_LENGTH))
      .filter(Boolean));
    if (!existingNames.has(baseName)) return baseName;

    for (let index = 1; index <= MAX_GROUPS + 1; index += 1) {
      const suffix = index === 1 ? "（副本）" : `（副本 ${index}）`;
      const stem = baseName.slice(0, MAX_GROUP_NAME_LENGTH - suffix.length).trim();
      const candidate = `${stem}${suffix}`;
      if (!existingNames.has(candidate)) return candidate;
    }

    return `${baseName.slice(0, MAX_GROUP_NAME_LENGTH - 8)}（新副本）`;
  }

  function instantiateGroupClipboard(candidate, targetTemplateId, existingGroups, options) {
    const clipboard = normalizeGroupClipboard(candidate);
    if (!clipboard) throw new Error("复制的分类数据无效，请重新复制");

    const destinationId = cleanId(targetTemplateId);
    if (!destinationId) throw new Error("必须先选择目标模板");

    const settings = options || {};
    const now = cleanTimestamp(settings.now, Date.now());
    const group = createGroup({
      templateId: destinationId,
      name: uniqueGroupName(clipboard.group.name, existingGroups),
      description: clipboard.group.description
    }, {
      id: settings.groupId,
      now,
      order: cleanOrder(settings.order, 0)
    });

    const snippetIds = Array.isArray(settings.snippetIds) ? settings.snippetIds : [];
    const snippets = clipboard.snippets.map((snippet, index) => createSnippet({
      groupId: group.id,
      title: snippet.title,
      content: snippet.content
    }, {
      id: snippetIds[index],
      now,
      order: index
    }));

    return { group, snippets };
  }

  function filterGroups(groups, snippets, query) {
    const groupList = Array.isArray(groups) ? groups : [];
    const snippetList = Array.isArray(snippets) ? snippets : [];
    const tokens = searchTokens(query);
    const searchableChildren = new Map();

    for (const snippet of snippetList) {
      const existing = searchableChildren.get(snippet.groupId) || "";
      searchableChildren.set(
        snippet.groupId,
        `${existing}\n${snippet.title}\n${snippet.content}`.toLocaleLowerCase()
      );
    }

    const filtered = tokens.length === 0
      ? groupList.slice()
      : groupList.filter((group) => {
          const searchable = `${group.name}\n${group.description}\n${searchableChildren.get(group.id) || ""}`
            .toLocaleLowerCase();
          return tokens.every((token) => searchable.includes(token));
        });

    return sortByOrder(filtered);
  }

  function filterSnippets(snippets, query) {
    const list = Array.isArray(snippets) ? snippets : [];
    const tokens = searchTokens(query);
    const filtered = tokens.length === 0
      ? list.slice()
      : list.filter((snippet) => {
          const searchable = `${snippet.title}\n${snippet.content}`.toLocaleLowerCase();
          return tokens.every((token) => searchable.includes(token));
        });

    return sortByOrder(filtered);
  }

  function searchTokens(query) {
    return typeof query === "string"
      ? query.trim().toLocaleLowerCase().split(/\s+/u).filter(Boolean)
      : [];
  }

  function sortByOrder(items) {
    return items.sort(compareByOrder);
  }

  function compareByOrder(left, right) {
    const orderDifference = cleanOrder(left.order, Number.MAX_SAFE_INTEGER)
      - cleanOrder(right.order, Number.MAX_SAFE_INTEGER);
    return orderDifference || compareByUpdatedAt(left, right);
  }

  function compareByUpdatedAt(left, right) {
    if (right.updatedAt !== left.updatedAt) {
      return right.updatedAt - left.updatedAt;
    }

    const leftName = left.name || left.title;
    const rightName = right.name || right.title;
    return leftName.localeCompare(rightName, "zh-CN");
  }

  function leadingOrder(items) {
    const list = Array.isArray(items) ? items : [];
    if (list.length === 0) {
      return 0;
    }

    return Math.min(...list.map((item) => cleanOrder(item.order, 0))) - 1;
  }

  function reorderItems(items, sourceId, targetId, placeAfter) {
    const ordered = sortByOrder(Array.isArray(items) ? items.slice() : []);
    const sourceIndex = ordered.findIndex((item) => item.id === sourceId);
    if (sourceIndex === -1) {
      return ordered.map((item, index) => ({ ...item, order: index }));
    }

    const [source] = ordered.splice(sourceIndex, 1);
    if (targetId === null || targetId === undefined) {
      ordered.push(source);
    } else {
      const targetIndex = ordered.findIndex((item) => item.id === targetId);
      if (targetIndex === -1) {
        ordered.splice(sourceIndex, 0, source);
      } else {
        ordered.splice(targetIndex + (placeAfter ? 1 : 0), 0, source);
      }
    }

    return ordered.map((item, index) => ({ ...item, order: index }));
  }

  function createId(prefix, now) {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }

    const randomPart = Math.random().toString(36).slice(2, 10);
    return `${prefix}-${now}-${randomPart}`;
  }

  return {
    SCHEMA_VERSION,
    MAX_TEMPLATES,
    MAX_GROUPS,
    MAX_SNIPPETS,
    MAX_TEMPLATE_NAME_LENGTH,
    MAX_TEMPLATE_DESCRIPTION_LENGTH,
    MAX_GROUP_NAME_LENGTH,
    MAX_GROUP_DESCRIPTION_LENGTH,
    MAX_TITLE_LENGTH,
    MAX_CONTENT_LENGTH,
    UNCATEGORIZED_GROUP_ID,
    DEFAULT_TEMPLATE_ID,
    GROUP_CLIPBOARD_VERSION,
    POSITION_VERSION,
    createDefaultState,
    normalizePanelPosition,
    normalizeState,
    createTemplate,
    updateTemplate,
    createGroup,
    updateGroup,
    createSnippet,
    updateSnippet,
    normalizeGroupClipboard,
    createGroupClipboard,
    instantiateGroupClipboard,
    uniqueGroupName,
    filterGroups,
    filterSnippets,
    leadingOrder,
    reorderItems
  };
});
