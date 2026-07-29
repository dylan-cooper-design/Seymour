import { describe, it, expect } from "vitest";
import { SCHEMA_VERSION } from "@/types/project";
import {
  canContain,
  collectIds,
  findByTemplateKey,
  findPath,
  flatten,
  walk,
} from "@/lib/tree/nodes";
import { derivedStatus } from "@/lib/tree/status";
import {
  INITIAL_TEMPLATE_KEY,
  TEMPLATE_KEYS,
  createProductDesignTemplate,
} from "../product-design";

describe("createProductDesignTemplate", () => {
  it("stamps the current schema version", () => {
    expect(createProductDesignTemplate().schemaVersion).toBe(SCHEMA_VERSION);
  });

  it("uses the given project name, falling back to a placeholder", () => {
    expect(createProductDesignTemplate({ projectName: "Seymour" }).projectName).toBe("Seymour");
    expect(createProductDesignTemplate().projectName).toBe("Untitled project");
    expect(createProductDesignTemplate({ projectName: "   " }).projectName).toBe(
      "Untitled project"
    );
  });

  it("ships the four top-level folders in order", () => {
    const { roots } = createProductDesignTemplate();
    expect(roots.map((n) => n.label)).toEqual([
      "Foundations",
      "Research",
      "Best practices",
      "Design system",
    ]);
  });

  it("locks every top-level folder so the prompt's guarantees stay true", () => {
    const { roots } = createProductDesignTemplate();
    expect(roots).toHaveLength(4);
    expect(roots.every((n) => n.locked === true)).toBe(true);
  });

  it("does not lock anything below the top level", () => {
    const { roots } = createProductDesignTemplate();
    const nested: string[] = [];
    for (const root of roots) {
      walk(root.children, (n) => {
        if (n.locked) nested.push(n.id);
      });
    }
    expect(nested).toEqual([]);
  });

  it("gives Foundations four workstreams", () => {
    const foundations = findByTemplateKey(
      createProductDesignTemplate().roots,
      TEMPLATE_KEYS.foundations
    );
    expect(foundations?.children.map((c) => c.label)).toEqual([
      "Problem statement",
      "Users",
      "Goals & success metrics",
      "Constraints & assumptions",
    ]);
    expect(foundations?.children.every((c) => c.kind === "workstream")).toBe(true);
  });

  it("gives Design system its Styles and Components folders", () => {
    const ds = findByTemplateKey(createProductDesignTemplate().roots, TEMPLATE_KEYS.designSystem);
    expect(ds?.children.map((c) => c.label)).toEqual(["Styles", "Components"]);
    expect(ds?.children.every((c) => c.kind === "folder")).toBe(true);
  });

  it("resolves every declared template key", () => {
    const { roots } = createProductDesignTemplate();
    for (const key of Object.values(TEMPLATE_KEYS)) {
      expect(findByTemplateKey(roots, key), `missing template key: ${key}`).toBeDefined();
    }
  });

  it("lands the user on the problem statement", () => {
    const { roots } = createProductDesignTemplate();
    expect(findByTemplateKey(roots, INITIAL_TEMPLATE_KEY)?.label).toBe("Problem statement");
  });

  it("mints unique ids", () => {
    const { roots } = createProductDesignTemplate();
    const count = flatten(roots).length;
    expect(collectIds(roots).size).toBe(count);
  });

  it("mints fresh ids on every call — it is a factory, not a shared constant", () => {
    const a = createProductDesignTemplate();
    const b = createProductDesignTemplate();
    const overlap = [...collectIds(a.roots)].filter((id) => collectIds(b.roots).has(id));
    expect(overlap).toEqual([]);
  });

  it("obeys its own nesting rules at every level", () => {
    const { roots } = createProductDesignTemplate();
    for (const root of roots) {
      expect(canContain(null, root.kind)).toBe(true);
    }
    walk(roots, (parent) => {
      for (const child of parent.children) {
        expect(
          canContain(parent.kind, child.kind),
          `${parent.label} may not contain ${child.label}`
        ).toBe(true);
      }
    });
  });

  it("gives every empty folder a note so it is never a dead end", () => {
    const { roots } = createProductDesignTemplate();
    walk(roots, (n) => {
      if (n.kind === "folder" && n.children.length === 0) {
        expect(n.note, `${n.label} has no guidance note`).toBeTruthy();
      }
    });
  });

  it("gives every Foundations workstream an objective", () => {
    const foundations = findByTemplateKey(
      createProductDesignTemplate().roots,
      TEMPLATE_KEYS.foundations
    );
    for (const child of foundations?.children ?? []) {
      expect(child.kind === "workstream" && child.objective).toBeTruthy();
    }
  });

  it("starts every node empty — no decisions or actions are pre-seeded", () => {
    const { roots } = createProductDesignTemplate();
    walk(roots, (n) => {
      expect(n.kind === "decision" || n.kind === "action").toBe(false);
    });
    expect(roots.every((n) => derivedStatus(n) === "empty")).toBe(true);
  });

  it("supports depth 4 out of the box (design-system > styles is two levels in)", () => {
    const { roots } = createProductDesignTemplate();
    const styles = findByTemplateKey(roots, TEMPLATE_KEYS.styles);
    expect(findPath(roots, styles!.id)).toHaveLength(2);
  });
});
