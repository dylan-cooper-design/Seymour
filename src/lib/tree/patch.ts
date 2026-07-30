/**
 * Applies the agent's write contract (`AgentPatch`, see `@/types/tree-patch`)
 * to a forest. Pure, like the rest of `@/lib/tree` — forest in, forest out.
 *
 * `applyStructurePatch` is safe to run unconditionally the moment a patch
 * arrives (structure is Seymour's to write freely). `applyProposal` only ever
 * runs once the user accepts a specific proposal — see APPROACH.md §4.
 */

import { createAction, createDecision, createFolder, createWorkstream, touch } from "./create";
import { insertNodes, type Forest, updateNode } from "./nodes";
import type { ProjectNode } from "@/types/project";
import type { NewNodeSpec, Proposal, StructurePatch } from "@/types/tree-patch";

function buildNode(spec: NewNodeSpec): ProjectNode {
  const children = (spec.children ?? []).map(buildNode);

  if (spec.kind === "folder") {
    return { ...createFolder(spec.label), children };
  }
  if (spec.kind === "workstream") {
    return { ...createWorkstream(spec.label, { objective: spec.objective }), children };
  }
  return { ...createDecision(spec.label), children };
}

export function applyStructurePatch(roots: Forest, patch: StructurePatch): Forest {
  let next = roots;

  for (const { parentId, nodes } of patch.createUnder ?? []) {
    next = insertNodes(next, parentId, nodes.map(buildNode));
  }

  for (const { id, label } of patch.rename ?? []) {
    const trimmed = label.trim();
    if (!trimmed) continue;
    next = updateNode(next, id, (node) => touch({ ...node, label: trimmed }));
  }

  for (const { id, objective } of patch.setObjective ?? []) {
    next = updateNode(next, id, (node) =>
      node.kind === "workstream" ? touch({ ...node, objective }) : node
    );
  }

  return next;
}

/**
 * Which existing node ids a structure patch writes to — drives chat-session
 * tagging (see `SessionsByWorkstreamId`). Newly created nodes aren't tagged:
 * they don't exist yet at the moment the session needs a target id, and the
 * parent they're filed under is already tagged instead.
 */
export function structurePatchTargetIds(patch: StructurePatch): string[] {
  const ids = new Set<string>();
  for (const { parentId } of patch.createUnder ?? []) {
    if (parentId) ids.add(parentId);
  }
  for (const { id } of patch.rename ?? []) ids.add(id);
  for (const { id } of patch.setObjective ?? []) ids.add(id);
  return [...ids];
}

/** Which node id a proposal writes to once accepted — same role as `structurePatchTargetIds`. */
export function proposalTargetId(proposal: Proposal): string {
  return proposal.kind === "action" ? proposal.parentId : proposal.nodeId;
}

export function applyProposal(roots: Forest, proposal: Proposal): Forest {
  if (proposal.kind === "note") {
    return updateNode(roots, proposal.nodeId, (node) => touch({ ...node, note: proposal.note }));
  }

  if (proposal.kind === "resolveDecision") {
    return updateNode(roots, proposal.nodeId, (node) => {
      if (node.kind !== "decision") return node;
      return touch({
        ...node,
        status: "resolved",
        resolution: proposal.resolution,
        rationale: proposal.rationale,
        options: proposal.options ?? node.options,
        resolvedAt: new Date().toISOString(),
      });
    });
  }

  return insertNodes(roots, proposal.parentId, [createAction(proposal.label)]);
}
