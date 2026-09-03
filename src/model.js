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

  const SCHEMA_VERSION = 2;
  const MAX_GROUPS = 100;
  const MAX_SNIPPETS = 500;
  const MAX_GROUP_NAME_LENGTH = 50;
  const MAX_GROUP_DESCRIPTION_LENGTH = 120;
  const MAX_TITLE_LENGTH = 80;
  const MAX_CONTENT_LENGTH = 10000;
  const UNCATEGORIZED_GROUP_ID = "group-uncategorized";

  function createDefaultState() {
    return {
      version: SCHEMA_VERSION,
      collapsed: false,
      groups: [],
      snippets: []
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

  function normalizeState(candidate) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      return createDefaultState();
    }

    const fallbackTime = Date.now();
    const rawGroups = Array.isArray(candidate.groups) ? candidate.groups : [];
    const rawSnippets = Array.isArray(candidate.snippets) ? candidate.snippets : [];
    const groupIds = new Set();
    const snippetIds = new Set();
    let groups = [];
    const snippets = [];

    for (let index = 0; index < rawGroups.length && groups.length < MAX_GROUPS; index += 1) {
      const raw = rawGroups[index];
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        continue;
      }

      const name = cleanSingleLine(raw.name, MAX_GROUP_NAME_LENGTH);
      if (!name) {
        continue;
      }

      const createdAt = cleanTimestamp(raw.createdAt, fallbackTime + index);
      const updatedAt = cleanTimestamp(raw.updatedAt, createdAt);
      const id = uniqueId(cleanId(raw.id), "group", createdAt, index, groupIds);
      groups.push({
        id,
        name,
        description: cleanSingleLine(raw.description, MAX_GROUP_DESCRIPTION_LENGTH),
        createdAt,
        updatedAt
      });
    }

    for (let index = 0; index < rawSnippets.length && snippets.length < MAX_SNIPPETS; index += 1) {
      const raw = rawSnippets[index];
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        continue;
      }

      const title = cleanSingleLine(raw.title, MAX_TITLE_LENGTH);
      const content = cleanContent(raw.content);
      if (!title || !content) {
        continue;
      }

      const createdAt = cleanTimestamp(raw.createdAt, fallbackTime + index);
      const updatedAt = cleanTimestamp(raw.updatedAt, createdAt);
      const id = uniqueId(cleanId(raw.id), "snippet", createdAt, index, snippetIds);
      snippets.push({
        id,
        groupId: cleanId(raw.groupId),
        title,
        content,
        createdAt,
        updatedAt
      });
    }

    const orphanedSnippets = snippets.filter((snippet) => !groupIds.has(snippet.groupId));
    if (orphanedSnippets.length > 0) {
      let fallbackGroup = groups.find((group) => group.id === UNCATEGORIZED_GROUP_ID);

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
          name: "未分类",
          description: candidate.version === 1 ? "从旧版本自动迁移的内容" : "尚未归入其他分类的内容",
          createdAt: oldestSnippetTime,
          updatedAt: newestSnippetTime
        };
        groups.push(fallbackGroup);
      }

      if (!fallbackGroup) {
        fallbackGroup = groups[0];
      }

      if (fallbackGroup) {
        for (const snippet of orphanedSnippets) {
          snippet.groupId = fallbackGroup.id;
        }
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

    return {
      version: SCHEMA_VERSION,
      collapsed: candidate.collapsed === true,
      groups,
      snippets
    };
  }

  function createGroup(values, options) {
    const settings = options || {};
    const name = cleanSingleLine(values && values.name, MAX_GROUP_NAME_LENGTH);
    if (!name) {
      throw new Error("分类名称不能为空");
    }

    const now = cleanTimestamp(settings.now, Date.now());
    return {
      id: cleanId(settings.id) || createId("group", now),
      name,
      description: cleanSingleLine(
        values && values.description,
        MAX_GROUP_DESCRIPTION_LENGTH
      ),
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

    return sortByUpdatedAt(filtered);
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

    return sortByUpdatedAt(filtered);
  }

  function searchTokens(query) {
    return typeof query === "string"
      ? query.trim().toLocaleLowerCase().split(/\s+/u).filter(Boolean)
      : [];
  }

  function sortByUpdatedAt(items) {
    return items.sort((left, right) => {
      if (right.updatedAt !== left.updatedAt) {
        return right.updatedAt - left.updatedAt;
      }

      const leftName = left.name || left.title;
      const rightName = right.name || right.title;
      return leftName.localeCompare(rightName, "zh-CN");
    });
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
    MAX_GROUPS,
    MAX_SNIPPETS,
    MAX_GROUP_NAME_LENGTH,
    MAX_GROUP_DESCRIPTION_LENGTH,
    MAX_TITLE_LENGTH,
    MAX_CONTENT_LENGTH,
    UNCATEGORIZED_GROUP_ID,
    createDefaultState,
    normalizeState,
    createGroup,
    updateGroup,
    createSnippet,
    updateSnippet,
    filterGroups,
    filterSnippets
  };
});
