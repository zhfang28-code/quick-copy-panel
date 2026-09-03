"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const model = require("../src/model.js");

test("normalizeState falls back for malformed state", () => {
  assert.deepEqual(model.normalizeState(null), model.createDefaultState());
  assert.deepEqual(model.normalizeState([]), model.createDefaultState());
});

test("normalizeState sanitizes records and removes invalid ones", () => {
  const normalized = model.normalizeState({
    collapsed: true,
    snippets: [
      {
        id: "same-id",
        title: "  客服回复  ",
        content: "  保留首尾空格  ",
        createdAt: 100,
        updatedAt: 200
      },
      {
        id: "same-id",
        title: "重复 ID",
        content: "第二条",
        createdAt: 300
      },
      { id: "empty", title: "空内容", content: "   " },
      "invalid"
    ]
  });

  assert.equal(normalized.collapsed, true);
  assert.equal(normalized.snippets.length, 2);
  assert.equal(normalized.snippets[0].title, "客服回复");
  assert.equal(normalized.snippets[0].content, "  保留首尾空格  ");
  assert.notEqual(normalized.snippets[0].id, normalized.snippets[1].id);
});

test("createSnippet validates values and keeps content formatting", () => {
  const snippet = model.createSnippet(
    { title: "  地址  ", content: "第一行\n  第二行" },
    { id: "fixed-id", now: 1234 }
  );

  assert.deepEqual(snippet, {
    id: "fixed-id",
    title: "地址",
    content: "第一行\n  第二行",
    createdAt: 1234,
    updatedAt: 1234
  });

  assert.throws(
    () => model.createSnippet({ title: "只有标题", content: "  " }),
    /不能为空/
  );
});

test("filterSnippets searches title and content with all query tokens", () => {
  const snippets = [
    { id: "1", title: "客服回复", content: "Hello Alice", updatedAt: 10 },
    { id: "2", title: "地址", content: "上海市 浦东新区", updatedAt: 30 },
    { id: "3", title: "英文问候", content: "HELLO Bob", updatedAt: 20 }
  ];

  assert.deepEqual(
    model.filterSnippets(snippets, "hello").map((item) => item.id),
    ["3", "1"]
  );
  assert.deepEqual(
    model.filterSnippets(snippets, "客服 alice").map((item) => item.id),
    ["1"]
  );
  assert.deepEqual(
    model.filterSnippets(snippets, "上海 浦东").map((item) => item.id),
    ["2"]
  );
});

test("updateSnippet preserves identity and creation time", () => {
  const original = {
    id: "item-1",
    title: "旧名称",
    content: "旧内容",
    createdAt: 100,
    updatedAt: 100
  };

  assert.deepEqual(
    model.updateSnippet(original, { title: "新名称", content: "新内容" }, 900),
    {
      id: "item-1",
      title: "新名称",
      content: "新内容",
      createdAt: 100,
      updatedAt: 900
    }
  );
});
