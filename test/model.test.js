"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const model = require("../src/model.js");

test("createDefaultState returns an empty version 2 hierarchy", () => {
  assert.deepEqual(model.createDefaultState(), {
    version: 2,
    collapsed: false,
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

  assert.equal(migrated.version, 2);
  assert.equal(migrated.collapsed, true);
  assert.equal(migrated.groups.length, 1);
  assert.equal(migrated.groups[0].name, "未分类");
  assert.equal(migrated.groups[0].description, "从旧版本自动迁移的内容");
  assert.equal(migrated.snippets.length, 2);
  assert.ok(migrated.snippets.every((snippet) => snippet.groupId === migrated.groups[0].id));
  assert.equal(migrated.snippets[0].title, "邮箱");
  assert.equal(migrated.snippets[0].content, "  name@example.com  ");
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

  assert.equal(normalized.groups[0].name, "个人 信息");
  assert.equal(normalized.groups[0].description, "常用 资料");
  assert.equal(new Set(normalized.groups.map((group) => group.id)).size, normalized.groups.length);
  assert.equal(normalized.snippets.length, 2);
  assert.ok(normalized.groups.some((group) => group.name === "未分类"));
  const rescued = normalized.snippets.find((snippet) => snippet.id === "item-2");
  assert.equal(normalized.groups.find((group) => group.id === rescued.groupId).name, "未分类");
});

test("createGroup and updateGroup validate and normalize values", () => {
  const group = model.createGroup(
    { name: "  获奖   经历  ", description: " 竞赛 相关 内容 " },
    { id: "group-fixed", now: 1234 }
  );

  assert.deepEqual(group, {
    id: "group-fixed",
    name: "获奖 经历",
    description: "竞赛 相关 内容",
    createdAt: 1234,
    updatedAt: 1234
  });
  assert.throws(() => model.createGroup({ name: "  " }), /不能为空/);

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
