import { describe, it, expect } from "vitest";
import type { ProjectNode } from "@/types/project";
import { countOpenDecisions, countPendingActions, derivedStatus } from "../status";

function node(partial: Partial<ProjectNode> & Pick<ProjectNode, "id" | "kind" | "label">) {
  return {
    children: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  } as ProjectNode;
}

describe("derivedStatus — leaves", () => {
  it("an open decision is active", () => {
    expect(derivedStatus(node({ id: "d", kind: "decision", label: "D", status: "open" }))).toBe(
      "active"
    );
  });

  it("a resolved decision is settled", () => {
    expect(derivedStatus(node({ id: "d", kind: "decision", label: "D", status: "resolved" }))).toBe(
      "settled"
    );
  });

  it("a deferred decision is settled — it is no longer blocking", () => {
    expect(derivedStatus(node({ id: "d", kind: "decision", label: "D", status: "deferred" }))).toBe(
      "settled"
    );
  });

  it("an unfinished action is active", () => {
    expect(derivedStatus(node({ id: "a", kind: "action", label: "A", done: false }))).toBe(
      "active"
    );
  });

  it("a finished action is settled", () => {
    expect(derivedStatus(node({ id: "a", kind: "action", label: "A", done: true }))).toBe(
      "settled"
    );
  });
});

describe("derivedStatus — containers", () => {
  it("a folder with no decisions or actions below is empty", () => {
    const folder = node({
      id: "f",
      kind: "folder",
      label: "F",
      children: [node({ id: "w", kind: "workstream", label: "W" })],
    });
    expect(derivedStatus(folder)).toBe("empty");
  });

  it("a bare workstream is empty", () => {
    expect(derivedStatus(node({ id: "w", kind: "workstream", label: "W" }))).toBe("empty");
  });

  it("a workstream with one open decision is active", () => {
    const ws = node({
      id: "w",
      kind: "workstream",
      label: "W",
      children: [node({ id: "d", kind: "decision", label: "D", status: "open" })],
    });
    expect(derivedStatus(ws)).toBe("active");
  });

  it("a workstream whose decisions are all resolved is settled", () => {
    const ws = node({
      id: "w",
      kind: "workstream",
      label: "W",
      children: [
        node({ id: "d1", kind: "decision", label: "D1", status: "resolved" }),
        node({ id: "d2", kind: "decision", label: "D2", status: "deferred" }),
      ],
    });
    expect(derivedStatus(ws)).toBe("settled");
  });

  it("a resolved decision with an unfinished action is still active", () => {
    const ws = node({
      id: "w",
      kind: "workstream",
      label: "W",
      children: [
        node({
          id: "d",
          kind: "decision",
          label: "D",
          status: "resolved",
          children: [node({ id: "a", kind: "action", label: "A", done: false })],
        }),
      ],
    });
    expect(derivedStatus(ws)).toBe("active");
  });

  it("propagates activity up four levels of folders", () => {
    const deep = node({
      id: "root",
      kind: "folder",
      label: "Root",
      children: [
        node({
          id: "mid",
          kind: "folder",
          label: "Mid",
          children: [
            node({
              id: "ws",
              kind: "workstream",
              label: "WS",
              children: [
                node({
                  id: "d",
                  kind: "decision",
                  label: "D",
                  status: "resolved",
                  children: [node({ id: "a", kind: "action", label: "A", done: false })],
                }),
              ],
            }),
          ],
        }),
      ],
    });
    expect(derivedStatus(deep)).toBe("active");
  });

  it("settles the whole chain once the deepest action is done", () => {
    const deep = node({
      id: "root",
      kind: "folder",
      label: "Root",
      children: [
        node({
          id: "ws",
          kind: "workstream",
          label: "WS",
          children: [
            node({
              id: "d",
              kind: "decision",
              label: "D",
              status: "resolved",
              children: [node({ id: "a", kind: "action", label: "A", done: true })],
            }),
          ],
        }),
      ],
    });
    expect(derivedStatus(deep)).toBe("settled");
  });
});

describe("counts", () => {
  const tree = node({
    id: "root",
    kind: "folder",
    label: "Root",
    children: [
      node({
        id: "ws",
        kind: "workstream",
        label: "WS",
        children: [
          node({
            id: "d1",
            kind: "decision",
            label: "D1",
            status: "open",
            children: [
              node({ id: "a1", kind: "action", label: "A1", done: false }),
              node({ id: "a2", kind: "action", label: "A2", done: true }),
            ],
          }),
          node({ id: "d2", kind: "decision", label: "D2", status: "open" }),
          node({ id: "d3", kind: "decision", label: "D3", status: "resolved" }),
        ],
      }),
    ],
  });

  it("counts open decisions across the whole subtree", () => {
    expect(countOpenDecisions(tree)).toBe(2);
  });

  it("counts pending actions across the whole subtree", () => {
    expect(countPendingActions(tree)).toBe(1);
  });

  it("counts the node itself when it is the matching leaf", () => {
    expect(
      countOpenDecisions(node({ id: "d", kind: "decision", label: "D", status: "open" }))
    ).toBe(1);
    expect(countPendingActions(node({ id: "a", kind: "action", label: "A", done: false }))).toBe(1);
  });
});
