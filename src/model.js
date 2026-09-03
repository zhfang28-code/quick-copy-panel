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

  const SCHEMA_VERSION = 1;
  const MAX_SNIPPETS = 500;
  const MAX_TITLE_LENGTH = 80;
  const MAX_CONTENT_LENGTH = 10000;

  function createDefaultState() {
    return {
      version: SCHEMA_VERSION,
      collapsed: false,
      snippets: []
    };
  }

  function cleanTitle(value) {
    if (typeof value !== "string") {
      return "";
    }

    return value.trim().slice(0, MAX_TITLE_LENGTH);
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

  function normalizeState(candidate) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      return createDefaultState();
    }

    const rawSnippets = Array.isArray(candidate.snippets) ? candidate.snippets : [];
    const snippets = [];
    const usedIds = new Set();
    const fallbackTime = Date.now();

    for (let index = 0; index < rawSnippets.length && snippets.length < MAX_SNIPPETS; index += 1) {
      const raw = rawSnippets[index];
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        continue;
      }

      const title = cleanTitle(raw.title);
      const content = cleanContent(raw.content);
      if (!title || !content) {
        continue;
      }

      const createdAt = cleanTimestamp(raw.createdAt, fallbackTime + index);
      const updatedAt = cleanTimestamp(raw.updatedAt, createdAt);
      const rawId = typeof raw.id === "string" ? raw.id.trim().slice(0, 128) : "";
      let id = rawId || `legacy-${createdAt}-${index}`;

      if (usedIds.has(id)) {
        id = `${id}-${index}`;
      }

      usedIds.add(id);
      snippets.push({ id, title, content, createdAt, updatedAt });
    }

    return {
      version: SCHEMA_VERSION,
      collapsed: candidate.collapsed === true,
      snippets
    };
  }

  function createSnippet(values, options) {
    const settings = options || {};
    const title = cleanTitle(values && values.title);
    const content = cleanContent(values && values.content);

    if (!title || !content) {
      throw new Error("名称/主题和文本内容均不能为空");
    }

    const now = cleanTimestamp(settings.now, Date.now());
    const id = typeof settings.id === "string" && settings.id.trim()
      ? settings.id.trim().slice(0, 128)
      : createId(now);

    return {
      id,
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

    const title = cleanTitle(values && values.title);
    const content = cleanContent(values && values.content);
    if (!title || !content) {
      throw new Error("名称/主题和文本内容均不能为空");
    }

    return {
      ...snippet,
      title,
      content,
      updatedAt: cleanTimestamp(now, Date.now())
    };
  }

  function filterSnippets(snippets, query) {
    const list = Array.isArray(snippets) ? snippets : [];
    const tokens = typeof query === "string"
      ? query.trim().toLocaleLowerCase().split(/\s+/u).filter(Boolean)
      : [];

    const filtered = tokens.length === 0
      ? list.slice()
      : list.filter((snippet) => {
          const searchable = `${snippet.title}\n${snippet.content}`.toLocaleLowerCase();
          return tokens.every((token) => searchable.includes(token));
        });

    return filtered.sort((left, right) => {
      if (right.updatedAt !== left.updatedAt) {
        return right.updatedAt - left.updatedAt;
      }

      return left.title.localeCompare(right.title, "zh-CN");
    });
  }

  function createId(now) {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }

    const randomPart = Math.random().toString(36).slice(2, 10);
    return `snippet-${now}-${randomPart}`;
  }

  return {
    SCHEMA_VERSION,
    MAX_SNIPPETS,
    MAX_TITLE_LENGTH,
    MAX_CONTENT_LENGTH,
    createDefaultState,
    normalizeState,
    createSnippet,
    updateSnippet,
    filterSnippets
  };
});
