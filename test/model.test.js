"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const model = require("../src/model.js");

test("createDefaultState returns a version 4 hierarchy with one default template", () => {
  assert.deepEqual(model.createDefaultState(), {
    version: 4,
    collapsed: false,
    selectedTemplateId: "template-default",
    templates: [{
      id: "template-default",
      name: "默认模板",
      description: "",
      order: 0,
      createdAt: 1,
      updatedAt: 1
    }],
    groups: [],
    snippets: []
  });
});

test("normalizeState migrates version 1 flat snippets into 未分类", () => {
  const migrated = model.normalizeState({
    version: 1,
    collapsed: true,
    snippets: [
      {
        id: "legacy-1",
        title: "  邮箱  ",
        content: "  name@example.com  ",
        createdAt: 100,
        updatedAt: 200
      },
      {
        id: "legacy-2",
        title: "奖项",
        content: "一等奖",
        createdAt: 300,
        updatedAt: 400
      }
    ]
  });

  assert.equal(migrated.version, 4);
  assert.equal(migrated.collapsed, true);
  assert.equal(migrated.templates.length, 1);
  assert.equal(migrated.templates[0].name, "默认模板");
  assert.equal(migrated.selectedTemplateId, migrated.templates[0].id);
  assert.equal(migrated.groups.length, 1);
  assert.equal(migrated.groups[0].name, "未分类");
  assert.equal(migrated.groups[0].description, "从旧版本自动迁移的内容");
  assert.equal(migrated.groups[0].templateId, migrated.templates[0].id);
  assert.equal(migrated.snippets.length, 2);
  assert.ok(migrated.snippets.every((snippet) => snippet.groupId === migrated.groups[0].id));
  assert.deepEqual(migrated.snippets.map((snippet) => snippet.title), ["奖项", "邮箱"]);
  assert.deepEqual(migrated.snippets.map((snippet) => snippet.order), [0, 1]);
  assert.equal(
    migrated.snippets.find((snippet) => snippet.title === "邮箱").content,
    "  name@example.com  "
  );
  assert.equal(migrated.groups[0].updatedAt, 400);
});

test("normalizeState keeps valid hierarchy and rescues orphaned snippets", () => {
  const normalized = model.normalizeState({
    version: 2,
    groups: [
      { id: "group-1", name: "  个人   信息  ", description: " 常用 资料 ", createdAt: 10 },
      { id: "group-1", name: "重复 ID", description: "", createdAt: 20 },
      { id: "invalid", name: "   " }
    ],
    snippets: [
      { id: "item-1", groupId: "group-1", title: "邮箱", content: "a@example.com", createdAt: 30 },
      { id: "item-2", groupId: "missing", title: "孤立内容", content: "会被保留", createdAt: 40 },
      { id: "empty", groupId: "group-1", title: "空正文", content: "   " }
    ]
  });

  const personalGroup = normalized.groups.find((group) => group.name === "个人 信息");
  assert.equal(personalGroup.description, "常用 资料");
  assert.equal(new Set(normalized.groups.map((group) => group.id)).size, normalized.groups.length);
  assert.equal(normalized.snippets.length, 2);
  assert.ok(normalized.groups.some((group) => group.name === "未分类"));
  const rescued = normalized.snippets.find((snippet) => snippet.id === "item-2");
  assert.equal(normalized.groups.find((group) => group.id === rescued.groupId).name, "未分类");
});

test("createGroup and updateGroup validate and normalize values", () => {
  const group = model.createGroup(
    { templateId: "template-1", name: "  获奖   经历  ", description: " 竞赛 相关 内容 " },
    { id: "group-fixed", now: 1234 }
  );

  assert.deepEqual(group, {
    id: "group-fixed",
    templateId: "template-1",
    name: "获奖 经历",
    description: "竞赛 相关 内容",
    order: 0,
    createdAt: 1234,
    updatedAt: 1234
  });
  assert.throws(() => model.createGroup({ templateId: "template-1", name: "  " }), /不能为空/);
  assert.throws(() => model.createGroup({ name: "分类" }), /选择一个模板/);

  const updated = model.updateGroup(group, { name: "奖项", description: "" }, 2000);
  assert.equal(updated.id, group.id);
  assert.equal(updated.createdAt, 1234);
  assert.equal(updated.name, "奖项");
  assert.equal(updated.updatedAt, 2000);
});

test("createSnippet requires a group and preserves exact body formatting", () => {
  const snippet = model.createSnippet(
    { groupId: "group-1", title: "  地址  ", content: "第一行\n  第二行  " },
    { id: "snippet-fixed", now: 500 }
  );

  assert.deepEqual(snippet, {
    id: "snippet-fixed",
    groupId: "group-1",
    title: "地址",
    content: "第一行\n  第二行  ",
    order: 0,
    createdAt: 500,
    updatedAt: 500
  });
  assert.throws(
    () => model.createSnippet({ title: "无分类", content: "正文" }),
    /选择一个分类/
  );
  assert.throws(
    () => model.createSnippet({ groupId: "group-1", title: "空正文", content: "  " }),
    /不能为空/
  );
});

test("filterGroups searches both level 1 fields and child text", () => {
  const groups = [
    { id: "g1", name: "个人信息", description: "基础资料", updatedAt: 10 },
    { id: "g2", name: "获奖经历", description: "竞赛记录", updatedAt: 30 },
    { id: "g3", name: "常用回复", description: "客户沟通", updatedAt: 20 }
  ];
  const snippets = [
    { groupId: "g1", title: "邮箱", content: "alice@example.com" },
    { groupId: "g2", title: "数学竞赛", content: "全国一等奖" },
    { groupId: "g3", title: "英文问候", content: "Hello Bob" }
  ];

  assert.deepEqual(model.filterGroups(groups, snippets, "竞赛 一等奖").map((item) => item.id), ["g2"]);
  assert.deepEqual(model.filterGroups(groups, snippets, "alice").map((item) => item.id), ["g1"]);
  assert.deepEqual(model.filterGroups(groups, snippets, "").map((item) => item.id), ["g2", "g3", "g1"]);
});

test("filterSnippets searches all tokens and update preserves hierarchy", () => {
  const snippets = [
    { id: "1", groupId: "g1", title: "客服回复", content: "Hello Alice", createdAt: 1, updatedAt: 10 },
    { id: "2", groupId: "g1", title: "地址", content: "上海市 浦东新区", createdAt: 2, updatedAt: 30 },
    { id: "3", groupId: "g1", title: "英文问候", content: "HELLO Bob", createdAt: 3, updatedAt: 20 }
  ];

  assert.deepEqual(model.filterSnippets(snippets, "hello").map((item) => item.id), ["3", "1"]);
  assert.deepEqual(model.filterSnippets(snippets, "客服 alice").map((item) => item.id), ["1"]);

  const updated = model.updateSnippet(snippets[0], { title: "新名称", content: "新内容" }, 900);
  assert.equal(updated.id, "1");
  assert.equal(updated.groupId, "g1");
  assert.equal(updated.createdAt, 1);
  assert.equal(updated.updatedAt, 900);
});

test("version 2 migration captures the previously visible updated-time order", () => {
  const normalized = model.normalizeState({
    version: 2,
    groups: [
      { id: "older", name: "较早更新", description: "", createdAt: 1, updatedAt: 10 },
      { id: "newer", name: "最近更新", description: "", createdAt: 2, updatedAt: 30 }
    ],
    snippets: [
      { id: "a", groupId: "newer", title: "旧内容", content: "A", createdAt: 1, updatedAt: 20 },
      { id: "b", groupId: "newer", title: "新内容", content: "B", createdAt: 2, updatedAt: 40 }
    ]
  });

  assert.deepEqual(normalized.groups.map((group) => group.id), ["newer", "older"]);
  assert.deepEqual(normalized.groups.map((group) => group.order), [0, 1]);
  assert.deepEqual(normalized.snippets.map((snippet) => snippet.id), ["b", "a"]);
  assert.deepEqual(normalized.snippets.map((snippet) => snippet.order), [0, 1]);
});

test("version 3 normalization and reorderItems preserve custom card positions", () => {
  const normalized = model.normalizeState({
    version: 3,
    groups: [
      { id: "first", name: "手动置顶", description: "", order: 0, createdAt: 1, updatedAt: 10 },
      { id: "second", name: "最近更新", description: "", order: 1, createdAt: 2, updatedAt: 999 }
    ],
    snippets: []
  });
  assert.deepEqual(normalized.groups.map((group) => group.id), ["first", "second"]);
  assert.ok(normalized.groups.every((group) => group.templateId === model.DEFAULT_TEMPLATE_ID));

  const moved = model.reorderItems(normalized.groups, "second", "first", false);
  assert.deepEqual(moved.map((group) => group.id), ["second", "first"]);
  assert.deepEqual(moved.map((group) => group.order), [0, 1]);
  assert.deepEqual(normalized.groups.map((group) => group.id), ["first", "second"]);

  const movedToEnd = model.reorderItems(moved, "second", null, true);
  assert.deepEqual(movedToEnd.map((group) => group.id), ["first", "second"]);
  assert.equal(model.leadingOrder(movedToEnd), -1);
});

test("version 4 keeps groups separated and ordered inside their templates", () => {
  const normalized = model.normalizeState({
    version: 4,
    selectedTemplateId: "template-b",
    templates: [
      { id: "template-a", name: "模板 A", order: 0, createdAt: 1, updatedAt: 1 },
      { id: "template-b", name: "模板 B", order: 1, createdAt: 2, updatedAt: 2 }
    ],
    groups: [
      { id: "a-2", templateId: "template-a", name: "A2", order: 1, createdAt: 1, updatedAt: 1 },
      { id: "b-1", templateId: "template-b", name: "B1", order: 0, createdAt: 1, updatedAt: 1 },
      { id: "a-1", templateId: "template-a", name: "A1", order: 0, createdAt: 1, updatedAt: 1 },
      { id: "orphan", templateId: "missing", name: "待归档", order: 3, createdAt: 1, updatedAt: 1 }
    ],
    snippets: []
  });

  assert.equal(normalized.selectedTemplateId, "template-b");
  assert.deepEqual(normalized.groups.map((group) => group.id), ["a-1", "a-2", "orphan", "b-1"]);
  assert.equal(normalized.groups.find((group) => group.id === "orphan").templateId, "template-a");
});

test("createTemplate and updateTemplate normalize names and preserve identity", () => {
  const template = model.createTemplate(
    { name: "  求职   模板 ", description: " 简历 和 自荐信 " },
    { id: "template-job", now: 100 }
  );
  assert.deepEqual(template, {
    id: "template-job",
    name: "求职 模板",
    description: "简历 和 自荐信",
    order: 0,
    createdAt: 100,
    updatedAt: 100
  });
  assert.throws(() => model.createTemplate({ name: "  " }), /不能为空/);

  const updated = model.updateTemplate(template, { name: "科研申请", description: "" }, 200);
  assert.equal(updated.id, "template-job");
  assert.equal(updated.createdAt, 100);
  assert.equal(updated.name, "科研申请");
  assert.equal(updated.updatedAt, 200);
});

test("group clipboard copies descendants and instantiates independent records", () => {
  const sourceGroup = {
    id: "source-group",
    templateId: "source-template",
    name: "获奖经历",
    description: "竞赛记录",
    order: 0,
    createdAt: 1,
    updatedAt: 2
  };
  const clipboard = model.createGroupClipboard(sourceGroup, [
    { id: "skip", groupId: "other", title: "其他", content: "不复制", order: 0 },
    { id: "second", groupId: "source-group", title: "二等奖", content: "第二条\n正文", order: 1 },
    { id: "first", groupId: "source-group", title: "一等奖", content: "  第一条正文  ", order: 0 }
  ], { now: 300 });

  assert.equal(clipboard.sourceTemplateId, "source-template");
  assert.deepEqual(clipboard.snippets.map((snippet) => snippet.title), ["一等奖", "二等奖"]);
  assert.equal(clipboard.snippets[0].content, "  第一条正文  ");

  const pasted = model.instantiateGroupClipboard(
    clipboard,
    "target-template",
    [{ name: "获奖经历" }, { name: "获奖经历（副本）" }],
    {
      groupId: "new-group",
      snippetIds: ["new-first", "new-second"],
      now: 400,
      order: -1
    }
  );

  assert.equal(pasted.group.id, "new-group");
  assert.equal(pasted.group.templateId, "target-template");
  assert.equal(pasted.group.name, "获奖经历（副本 2）");
  assert.deepEqual(pasted.snippets.map((snippet) => snippet.id), ["new-first", "new-second"]);
  assert.ok(pasted.snippets.every((snippet) => snippet.groupId === "new-group"));
  assert.equal(pasted.snippets[0].content, "  第一条正文  ");
  assert.notEqual(pasted.group.id, sourceGroup.id);
});

test("normalizeGroupClipboard rejects malformed buffers", () => {
  assert.equal(model.normalizeGroupClipboard(null), null);
  assert.equal(model.normalizeGroupClipboard({ sourceTemplateId: "t", group: { name: "" } }), null);
  assert.throws(
    () => model.instantiateGroupClipboard(null, "target", []),
    /数据无效/
  );
});

test("normalizePanelPosition keeps valid coordinates and rejects incomplete values", () => {
  assert.deepEqual(model.normalizePanelPosition(null), {
    version: 1,
    expanded: null,
    collapsedTop: null
  });

  assert.deepEqual(model.normalizePanelPosition({
    version: 99,
    expanded: { left: 128.7, top: 42.2 },
    collapsedTop: 315.9
  }), {
    version: 1,
    expanded: { left: 129, top: 42 },
    collapsedTop: 316
  });

  assert.deepEqual(model.normalizePanelPosition({
    expanded: { left: 80 },
    collapsedTop: "200"
  }), {
    version: 1,
    expanded: null,
    collapsedTop: null
  });
});
