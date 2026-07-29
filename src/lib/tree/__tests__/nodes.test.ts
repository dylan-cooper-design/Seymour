import { describe, it, expect } from "vitest";
import type { ProjectNode } from "@/types/project";
import {
  CONTAINS,
  ROOT_ACCEPTS,
  canContain,
  canDrop,
  collectIds,
  findByTemplateKey,
  findNode,
  findParent,
  findPath,
  flatten,
  getAncestors,
  insertNodes,
  isDescendantOf,
  mapNodes,
  moveNode,
  moveRelativeTo,
  nearestSelfOrAncestorOfKind,
  removeNode,
  updateNode,
  walk,
  type Forest,
} from "../nodes";

// ---------------------------------------------------------------------------
// Fixture — deterministic ids, and deep enough to exercise recursion.
//
//   foundations (folder, locked)
//     problem (workstream)
//       framing (decision, open)
//         write-brief (action, not done)
//   design-system (folder, locked)
//     styles (folder)
//       color (workstream)
//         scale (decision, resolved)
//         naming (decision, open)
//       type (workstream)
//   research (folder, locked)
// ---------------------------------------------------------------------------

function node(partial: Partial<ProjectNode> & Pick<ProjectNode, "id" | "kind" | "label">) {
  return {
    children: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  } as ProjectNode;
}

function fixture(): Forest {
  return [
    node({
      id: "foundations",
      kind: "folder",
      label: "Foundations",
      locked: true,
      templateKey: "foundations",
      children: [
        node({
          id: "problem",
          kind: "workstream",
          label: "Problem statement",
          templateKey: "foundations.problem-statement",
          children: [
            node({
              id: "framing",
              kind: "decision",
              label: "Which framing",
              status: "open",
              children: [
                node({ id: "write-brief", kind: "action", label: "Write brief", done: false }),
              ],
            }),
          ],
        }),
      ],
    }),
    node({
      id: "design-system",
      kind: "folder",
      label: "Design system",
      locked: true,
      children: [
        node({
          id: "styles",
          kind: "folder",
          label: "Styles",
          children: [
            node({
              id: "color",
              kind: "workstream",
              label: "Color palette",
              children: [
                node({
                  id: "scale",
                  kind: "decision",
                  label: "Primary vs neutral",
                  status: "resolved",
                }),
                node({ id: "naming", kind: "decision", label: "Token naming", status: "open" }),
              ],
            }),
            node({ id: "type", kind: "workstream", label: "Type scale" }),
          ],
        }),
      ],
    }),
    node({ id: "research", kind: "folder", label: "Research", locked: true }),
  ];
}

// ---------------------------------------------------------------------------
// read
// ---------------------------------------------------------------------------

describe("findNode / findPath / findParent", () => {
  it("finds a node nested five levels deep", () => {
    expect(findNode(fixture(), "write-brief")?.label).toBe("Write brief");
  });

  it("returns undefined for an unknown id", () => {
    expect(findNode(fixture(), "nope")).toBeUndefined();
  });

  it("returns the full path root -> node, inclusive", () => {
    expect(findPath(fixture(), "write-brief")).toEqual([
      "foundations",
      "problem",
      "framing",
      "write-brief",
    ]);
  });

  it("returns a single-element path for a root node", () => {
    expect(findPath(fixture(), "research")).toEqual(["research"]);
  });

  it("returns undefined path for an unknown id", () => {
    expect(findPath(fixture(), "nope")).toBeUndefined();
  });

  it("finds the immediate parent", () => {
    expect(findParent(fixture(), "color")?.id).toBe("styles");
  });

  it("returns undefined parent for a root node", () => {
    expect(findParent(fixture(), "foundations")).toBeUndefined();
  });
});

describe("getAncestors", () => {
  it("returns ancestors outermost -> innermost, excluding self", () => {
    expect(getAncestors(fixture(), "write-brief").map((n) => n.id)).toEqual([
      "foundations",
      "problem",
      "framing",
    ]);
  });

  it("returns an empty array for a root node", () => {
    expect(getAncestors(fixture(), "research")).toEqual([]);
  });
});

describe("findByTemplateKey", () => {
  it("finds a nested template node by key", () => {
    expect(findByTemplateKey(fixture(), "foundations.problem-statement")?.id).toBe("problem");
  });

  it("still resolves after the node is renamed", () => {
    const renamed = updateNode(fixture(), "problem", (n) => ({ ...n, label: "The problem" }));
    expect(findByTemplateKey(renamed, "foundations.problem-statement")?.id).toBe("problem");
  });

  it("returns undefined for an unknown key", () => {
    expect(findByTemplateKey(fixture(), "nope")).toBeUndefined();
  });
});

describe("nearestSelfOrAncestorOfKind", () => {
  it("returns the node itself when it already matches", () => {
    expect(nearestSelfOrAncestorOfKind(fixture(), "color", "workstream")?.id).toBe("color");
  });

  it("walks up from a decision to its owning workstream", () => {
    expect(nearestSelfOrAncestorOfKind(fixture(), "naming", "workstream")?.id).toBe("color");
  });

  it("walks up two levels from an action to its owning workstream", () => {
    expect(nearestSelfOrAncestorOfKind(fixture(), "write-brief", "workstream")?.id).toBe("problem");
  });

  it("returns undefined when a folder has no workstream ancestor", () => {
    expect(nearestSelfOrAncestorOfKind(fixture(), "styles", "workstream")).toBeUndefined();
  });
});

describe("walk / flatten / collectIds", () => {
  it("visits every node exactly once", () => {
    const seen: string[] = [];
    walk(fixture(), (n) => seen.push(n.id));
    expect(seen).toHaveLength(11);
    expect(new Set(seen).size).toBe(11);
  });

  it("reports depth correctly at each level", () => {
    const depths = new Map<string, number>();
    walk(fixture(), (n, _path, depth) => depths.set(n.id, depth));
    expect(depths.get("foundations")).toBe(0);
    expect(depths.get("problem")).toBe(1);
    expect(depths.get("framing")).toBe(2);
    expect(depths.get("write-brief")).toBe(3);
    expect(depths.get("color")).toBe(2);
  });

  it("flattens depth-first with parent ids", () => {
    const flat = flatten(fixture());
    expect(flat.map((f) => f.node.id).slice(0, 4)).toEqual([
      "foundations",
      "problem",
      "framing",
      "write-brief",
    ]);
    expect(flat.find((f) => f.node.id === "color")?.parentId).toBe("styles");
    expect(flat.find((f) => f.node.id === "foundations")?.parentId).toBeNull();
  });

  it("collects every id", () => {
    expect(collectIds(fixture()).has("write-brief")).toBe(true);
    expect(collectIds(fixture()).size).toBe(11);
  });
});

describe("isDescendantOf", () => {
  it("is true for a deep descendant", () => {
    expect(isDescendantOf(fixture(), "write-brief", "foundations")).toBe(true);
  });

  it("is false for the node itself", () => {
    expect(isDescendantOf(fixture(), "foundations", "foundations")).toBe(false);
  });

  it("is false for an unrelated node", () => {
    expect(isDescendantOf(fixture(), "color", "foundations")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// nesting rules
// ---------------------------------------------------------------------------

describe("canContain", () => {
  it("matches the CONTAINS table exactly", () => {
    const kinds = ["folder", "workstream", "decision", "action"] as const;
    for (const parent of kinds) {
      for (const child of kinds) {
        expect(canContain(parent, child)).toBe(CONTAINS[parent].includes(child));
      }
    }
  });

  it("allows folders and workstreams at the root, nothing else", () => {
    expect(canContain(null, "folder")).toBe(true);
    expect(canContain(null, "workstream")).toBe(true);
    expect(canContain(null, "decision")).toBe(false);
    expect(canContain(null, "action")).toBe(false);
    expect(ROOT_ACCEPTS).toEqual(["folder", "workstream"]);
  });

  it("allows an action directly under a workstream, not only under a decision", () => {
    expect(canContain("workstream", "action")).toBe(true);
    expect(canContain("decision", "action")).toBe(true);
  });

  it("never allows a folder inside a workstream", () => {
    expect(canContain("workstream", "folder")).toBe(false);
  });

  it("treats actions as leaves", () => {
    expect(CONTAINS.action).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// identity on no-op — every mutator must return the SAME array reference
// ---------------------------------------------------------------------------

describe("identity on no-op", () => {
  it("updateNode returns the identical forest when the id is absent", () => {
    const roots = fixture();
    expect(updateNode(roots, "nope", (n) => n)).toBe(roots);
  });

  it("updateNode returns the identical forest when the updater is a no-op", () => {
    const roots = fixture();
    expect(updateNode(roots, "color", (n) => n)).toBe(roots);
  });

  it("removeNode returns the identical forest when the id is absent", () => {
    const roots = fixture();
    expect(removeNode(roots, "nope")).toBe(roots);
  });

  it("insertNodes returns the identical forest when inserting nothing", () => {
    const roots = fixture();
    expect(insertNodes(roots, "styles", [])).toBe(roots);
  });

  it("insertNodes returns the identical forest when the parent is absent", () => {
    const roots = fixture();
    const added = [node({ id: "x", kind: "workstream", label: "X" })];
    expect(insertNodes(roots, "nope", added)).toBe(roots);
  });

  it("moveNode returns the identical forest when the move is a no-op", () => {
    const roots = fixture();
    expect(moveNode(roots, "foundations", { parentId: null, index: 0 })).toBe(roots);
  });

  it("mapNodes returns the identical forest when nothing changes", () => {
    const roots = fixture();
    expect(mapNodes(roots, (n) => n)).toBe(roots);
  });

  it("preserves untouched sibling subtrees by reference", () => {
    const roots = fixture();
    const next = updateNode(roots, "color", (n) => ({ ...n, label: "Colour palette" }));
    expect(next).not.toBe(roots);
    // The Foundations branch was not on the path to the change.
    expect(next[0]).toBe(roots[0]);
  });
});

// ---------------------------------------------------------------------------
// write
// ---------------------------------------------------------------------------

describe("updateNode", () => {
  it("updates a deeply nested node without touching siblings", () => {
    const next = updateNode(fixture(), "naming", (n) => ({ ...n, label: "Renamed" }));
    expect(findNode(next, "naming")?.label).toBe("Renamed");
    expect(findNode(next, "scale")?.label).toBe("Primary vs neutral");
  });
});

describe("removeNode", () => {
  it("removes a node and its whole subtree", () => {
    const next = removeNode(fixture(), "framing");
    expect(findNode(next, "framing")).toBeUndefined();
    expect(findNode(next, "write-brief")).toBeUndefined();
    expect(findNode(next, "problem")).toBeDefined();
  });

  it("removes a root node", () => {
    const next = removeNode(fixture(), "research");
    expect(next).toHaveLength(2);
  });
});

describe("insertNodes", () => {
  it("appends to a parent when no index is given", () => {
    const added = [node({ id: "spacing", kind: "workstream", label: "Spacing" })];
    const next = insertNodes(fixture(), "styles", added);
    expect(findNode(next, "styles")?.children.map((c) => c.id)).toEqual([
      "color",
      "type",
      "spacing",
    ]);
  });

  it("inserts at a specific index", () => {
    const added = [node({ id: "spacing", kind: "workstream", label: "Spacing" })];
    const next = insertNodes(fixture(), "styles", added, 0);
    expect(findNode(next, "styles")?.children.map((c) => c.id)).toEqual([
      "spacing",
      "color",
      "type",
    ]);
  });

  it("clamps an out-of-range index", () => {
    const added = [node({ id: "spacing", kind: "workstream", label: "Spacing" })];
    const next = insertNodes(fixture(), "styles", added, 99);
    expect(findNode(next, "styles")?.children.map((c) => c.id)).toEqual([
      "color",
      "type",
      "spacing",
    ]);
  });

  it("inserts at the root when parentId is null", () => {
    const added = [node({ id: "extra", kind: "folder", label: "Extra" })];
    const next = insertNodes(fixture(), null, added, 1);
    expect(next.map((n) => n.id)).toEqual(["foundations", "extra", "design-system", "research"]);
  });
});

// ---------------------------------------------------------------------------
// moveNode — the index math is the classic bug, so it gets its own block
// ---------------------------------------------------------------------------

describe("moveNode — reordering within the same parent", () => {
  it("moves a node DOWN to the correct slot (the off-by-one case)", () => {
    // roots: [foundations, design-system, research] — move foundations to index 2.
    const next = moveNode(fixture(), "foundations", { parentId: null, index: 2 });
    expect(next.map((n) => n.id)).toEqual(["design-system", "foundations", "research"]);
  });

  it("moves a node DOWN to the very end", () => {
    const next = moveNode(fixture(), "foundations", { parentId: null, index: 3 });
    expect(next.map((n) => n.id)).toEqual(["design-system", "research", "foundations"]);
  });

  it("moves a node UP without adjusting the index", () => {
    const next = moveNode(fixture(), "research", { parentId: null, index: 0 });
    expect(next.map((n) => n.id)).toEqual(["research", "foundations", "design-system"]);
  });

  it("reorders children within a nested parent", () => {
    const next = moveNode(fixture(), "color", { parentId: "styles", index: 2 });
    expect(findNode(next, "styles")?.children.map((c) => c.id)).toEqual(["type", "color"]);
  });
});

describe("moveNode — reparenting", () => {
  it("moves a workstream into a different folder", () => {
    const next = moveNode(fixture(), "color", { parentId: "research", index: 0 });
    expect(findNode(next, "research")?.children.map((c) => c.id)).toEqual(["color"]);
    expect(findNode(next, "styles")?.children.map((c) => c.id)).toEqual(["type"]);
  });

  it("carries the whole subtree along", () => {
    const next = moveNode(fixture(), "color", { parentId: "research", index: 0 });
    expect(findNode(next, "naming")).toBeDefined();
    expect(findPath(next, "naming")).toEqual(["research", "color", "naming"]);
  });

  it("rejects moving a node into itself", () => {
    const roots = fixture();
    expect(moveNode(roots, "styles", { parentId: "styles", index: 0 })).toBe(roots);
  });

  it("rejects moving a node into its own descendant", () => {
    const roots = fixture();
    expect(moveNode(roots, "design-system", { parentId: "color", index: 0 })).toBe(roots);
  });

  it("rejects a move that violates the nesting rules", () => {
    const roots = fixture();
    // A folder may not live inside a workstream.
    expect(moveNode(roots, "research", { parentId: "color", index: 0 })).toBe(roots);
  });

  it("rejects a decision at the root", () => {
    const roots = fixture();
    expect(moveNode(roots, "naming", { parentId: null, index: 0 })).toBe(roots);
  });

  it("rejects reparenting a locked node", () => {
    const roots = fixture();
    expect(moveNode(roots, "research", { parentId: "design-system", index: 0 })).toBe(roots);
  });

  it("still allows reordering a locked node at the root", () => {
    const next = moveNode(fixture(), "research", { parentId: null, index: 0 });
    expect(next.map((n) => n.id)).toEqual(["research", "foundations", "design-system"]);
  });

  it("allows an action to move from a decision up to its workstream", () => {
    const next = moveNode(fixture(), "write-brief", { parentId: "problem" });
    expect(findPath(next, "write-brief")).toEqual(["foundations", "problem", "write-brief"]);
  });
});

describe("moveRelativeTo", () => {
  it("drops a node before its reference", () => {
    const next = moveRelativeTo(fixture(), "research", "foundations", "before");
    expect(next.map((n) => n.id)).toEqual(["research", "foundations", "design-system"]);
  });

  it("drops a node after its reference, moving downward", () => {
    const next = moveRelativeTo(fixture(), "foundations", "design-system", "after");
    expect(next.map((n) => n.id)).toEqual(["design-system", "foundations", "research"]);
  });

  it("drops a node before a later sibling, moving downward", () => {
    const next = moveRelativeTo(fixture(), "foundations", "research", "before");
    expect(next.map((n) => n.id)).toEqual(["design-system", "foundations", "research"]);
  });

  it("drops a node inside a folder", () => {
    const next = moveRelativeTo(fixture(), "color", "research", "inside");
    expect(findNode(next, "research")?.children.map((c) => c.id)).toEqual(["color"]);
  });

  it("is a no-op when source and reference are the same node", () => {
    const roots = fixture();
    expect(moveRelativeTo(roots, "color", "color", "inside")).toBe(roots);
  });

  it("is a no-op when the reference does not exist", () => {
    const roots = fixture();
    expect(moveRelativeTo(roots, "color", "nope", "inside")).toBe(roots);
  });
});

describe("canDrop", () => {
  it("refuses dropping a node onto itself", () => {
    expect(canDrop(fixture(), "color", "color", "inside")).toBe(false);
  });

  it("refuses dropping a node into its own descendant", () => {
    expect(canDrop(fixture(), "design-system", "color", "inside")).toBe(false);
  });

  it("refuses a folder inside a workstream", () => {
    expect(canDrop(fixture(), "research", "color", "inside")).toBe(false);
  });

  it("refuses a decision dropped into a folder", () => {
    expect(canDrop(fixture(), "naming", "research", "inside")).toBe(false);
  });

  it("refuses reparenting a locked folder", () => {
    expect(canDrop(fixture(), "research", "design-system", "inside")).toBe(false);
  });

  it("allows reordering a locked folder among its root siblings", () => {
    expect(canDrop(fixture(), "research", "foundations", "before")).toBe(true);
  });

  it("allows a workstream into a folder", () => {
    expect(canDrop(fixture(), "color", "research", "inside")).toBe(true);
  });

  it("allows a decision beside another decision", () => {
    expect(canDrop(fixture(), "naming", "scale", "before")).toBe(true);
  });

  it("agrees with moveNode — a refused drop is also a refused move", () => {
    const roots = fixture();
    const cases: Array<[string, string, "before" | "after" | "inside"]> = [
      ["research", "color", "inside"],
      ["design-system", "color", "inside"],
      ["naming", "research", "inside"],
      ["research", "design-system", "inside"],
    ];
    for (const [dragId, refId, position] of cases) {
      expect(canDrop(roots, dragId, refId, position)).toBe(false);
      expect(moveRelativeTo(roots, dragId, refId, position)).toBe(roots);
    }
  });
});
