import { describe, it, expect } from "vitest";
import type { ProjectNode } from "@/types/project";
import type { Forest } from "../nodes";
import { findNode } from "../nodes";
import {
  applyProposal,
  applyStructurePatch,
  proposalTargetId,
  structurePatchTargetIds,
} from "../patch";

// ---------------------------------------------------------------------------
//   foundations (folder, locked)
//     problem (workstream)
//       framing (decision, open)
//   password-recovery (folder)
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
      children: [
        node({
          id: "problem",
          kind: "workstream",
          label: "Problem statement",
          children: [node({ id: "framing", kind: "decision", label: "Framing", status: "open" })],
        } as Partial<ProjectNode> & Pick<ProjectNode, "id" | "kind" | "label">),
      ],
    }),
    node({ id: "password-recovery", kind: "folder", label: "Password recovery" }),
  ];
}

describe("applyStructurePatch", () => {
  it("creates nested nodes under an existing parent", () => {
    const roots = applyStructurePatch(fixture(), {
      createUnder: [
        {
          parentId: "password-recovery",
          nodes: [
            {
              kind: "workstream",
              label: "Error states",
              objective: "Settle what the user sees when recovery fails.",
              children: [{ kind: "decision", label: "How do we handle expired tokens?" }],
            },
          ],
        },
      ],
    });

    const parent = findNode(roots, "password-recovery");
    expect(parent?.children).toHaveLength(1);
    const workstream = parent!.children[0];
    expect(workstream.kind).toBe("workstream");
    expect(workstream.label).toBe("Error states");
    expect((workstream as { objective?: string }).objective).toBe(
      "Settle what the user sees when recovery fails."
    );
    expect(workstream.children).toHaveLength(1);
    expect(workstream.children[0].kind).toBe("decision");
    expect(workstream.children[0].label).toBe("How do we handle expired tokens?");
  });

  it("creates root-level nodes when parentId is null", () => {
    const roots = applyStructurePatch(fixture(), {
      createUnder: [{ parentId: null, nodes: [{ kind: "folder", label: "New work area" }] }],
    });
    expect(roots.map((n) => n.label)).toContain("New work area");
  });

  it("renames a node, including locked ones", () => {
    const roots = applyStructurePatch(fixture(), {
      rename: [{ id: "foundations", label: "Foundations (renamed)" }],
    });
    expect(findNode(roots, "foundations")?.label).toBe("Foundations (renamed)");
  });

  it("ignores a rename with a blank label", () => {
    const before = fixture();
    const roots = applyStructurePatch(before, { rename: [{ id: "foundations", label: "   " }] });
    expect(findNode(roots, "foundations")?.label).toBe("Foundations");
  });

  it("sets an objective on a workstream", () => {
    const roots = applyStructurePatch(fixture(), {
      setObjective: [{ id: "problem", objective: "Settle the problem." }],
    });
    const workstream = findNode(roots, "problem");
    expect((workstream as { objective?: string })?.objective).toBe("Settle the problem.");
  });

  it("does not set an objective on a non-workstream node", () => {
    const roots = applyStructurePatch(fixture(), {
      setObjective: [{ id: "foundations", objective: "Should not apply." }],
    });
    expect((findNode(roots, "foundations") as { objective?: string })?.objective).toBeUndefined();
  });

  it("is a no-op when the patch is empty", () => {
    const before = fixture();
    const roots = applyStructurePatch(before, {});
    expect(roots).toEqual(before);
  });
});

describe("applyProposal", () => {
  it("writes a note onto any node", () => {
    const roots = applyProposal(fixture(), {
      id: "p1",
      kind: "note",
      nodeId: "problem",
      note: "Recovery fails silently for 40% of users.",
    });
    expect(findNode(roots, "problem")?.note).toBe("Recovery fails silently for 40% of users.");
  });

  it("resolves a decision with resolution, rationale, and options", () => {
    const roots = applyProposal(fixture(), {
      id: "p2",
      kind: "resolveDecision",
      nodeId: "framing",
      resolution: "Modal",
      rationale: "Fastest to test.",
      options: [{ label: "Modal", recommended: true }, { label: "Full page" }],
    });
    const decision = findNode(roots, "framing");
    expect(decision).toMatchObject({
      status: "resolved",
      resolution: "Modal",
      rationale: "Fastest to test.",
    });
    expect((decision as { resolvedAt?: string })?.resolvedAt).toBeDefined();
  });

  it("does nothing when resolving a node that isn't a decision", () => {
    const before = fixture();
    const roots = applyProposal(before, {
      id: "p3",
      kind: "resolveDecision",
      nodeId: "problem",
      resolution: "Modal",
    });
    expect(roots).toEqual(before);
  });

  it("creates a new action under the given parent", () => {
    const roots = applyProposal(fixture(), {
      id: "p4",
      kind: "action",
      parentId: "framing",
      label: "Write the empty-state copy.",
    });
    const decision = findNode(roots, "framing");
    expect(decision?.children).toHaveLength(1);
    expect(decision?.children[0]).toMatchObject({
      kind: "action",
      label: "Write the empty-state copy.",
      done: false,
    });
  });
});

describe("structurePatchTargetIds", () => {
  it("collects the parent of created nodes, not the new nodes themselves", () => {
    const ids = structurePatchTargetIds({
      createUnder: [{ parentId: "password-recovery", nodes: [{ kind: "folder", label: "New" }] }],
    });
    expect(ids).toEqual(["password-recovery"]);
  });

  it("ignores a null parentId (root-level creation has no existing node to tag)", () => {
    const ids = structurePatchTargetIds({
      createUnder: [{ parentId: null, nodes: [{ kind: "folder", label: "New work area" }] }],
    });
    expect(ids).toEqual([]);
  });

  it("collects renamed and re-objectived node ids, deduped", () => {
    const ids = structurePatchTargetIds({
      rename: [{ id: "foundations", label: "Renamed" }],
      setObjective: [{ id: "foundations", objective: "New objective" }],
    });
    expect(ids).toEqual(["foundations"]);
  });

  it("returns an empty array for an empty patch", () => {
    expect(structurePatchTargetIds({})).toEqual([]);
  });
});

describe("proposalTargetId", () => {
  it("targets nodeId for note and resolveDecision proposals", () => {
    expect(proposalTargetId({ id: "p1", kind: "note", nodeId: "problem", note: "x" })).toBe(
      "problem"
    );
    expect(
      proposalTargetId({ id: "p2", kind: "resolveDecision", nodeId: "framing", resolution: "x" })
    ).toBe("framing");
  });

  it("targets parentId for action proposals", () => {
    expect(
      proposalTargetId({ id: "p3", kind: "action", parentId: "framing", label: "Do the thing" })
    ).toBe("framing");
  });
});
