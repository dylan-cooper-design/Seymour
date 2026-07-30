/**
 * TEMPORARY — placeholder content for working on the UI against a populated
 * project instead of an empty template.
 *
 * Content is adapted from Dylan's "Making Great Design the Default for
 * Enterprise SaaS Products" case study (Moonshot / investor reporting). The
 * case study is itself white-labeled, so nothing confidential is reproduced.
 *
 * TO REMOVE: delete `src/lib/demo/` and the single `createDemoWorkspace`
 * import in `src/app/page.tsx`. Nothing else references this folder.
 */

import { createAction, createDecision, createId, createWorkstream } from "@/lib/tree/create";
import { findByTemplateKey, insertNodes, updateNode, type Forest } from "@/lib/tree/nodes";
import { TEMPLATE_KEYS, createProductDesignTemplate } from "@/lib/templates/product-design";
import type { ProjectNode, ProjectTree } from "@/types/project";
import type { ChatSession, SessionsByWorkstreamId, ThreadMessage } from "@/types/navigation";
import type { ProposalRecord } from "@/types/tree-patch";
import type { ProjectState } from "@/types/workspace";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// ─── session helpers ──────────────────────────────────────────────────────────

type Turn = {
  role: ThreadMessage["role"];
  text: string;
  proposals?: ProposalRecord[];
};

/**
 * Builds one seeded conversation. Messages are spaced a minute apart ending at
 * `agoMs` before now, so the History panel's relative timestamps read sensibly
 * no matter when the demo is loaded.
 */
function session(opts: {
  workstreamId: string;
  taggedNodeIds: string[];
  agoMs: number;
  turns: Turn[];
}): ChatSession {
  const end = Date.now() - opts.agoMs;
  const start = end - opts.turns.length * MINUTE;

  return {
    id: createId(),
    workstreamId: opts.workstreamId,
    messages: opts.turns.map((turn, index) => ({
      id: createId(),
      role: turn.role,
      text: turn.text,
      state: turn.role === "assistant" ? ("complete" as const) : undefined,
      timestamp: start + index * MINUTE,
      ...(turn.proposals ? { proposals: turn.proposals } : {}),
    })),
    taggedNodeIds: opts.taggedNodeIds,
    createdAt: start,
    updatedAt: end,
  };
}

function greeting(label: string, objective: string): Turn {
  return { role: "assistant", text: `**${label}**\n\n${objective}` };
}

// ─── tree ─────────────────────────────────────────────────────────────────────

/** Narrow `findByTemplateKey` to an id, since the template guarantees the node. */
function idOf(roots: Forest, templateKey: string): string {
  const node = findByTemplateKey(roots, templateKey);
  if (!node) throw new Error(`Demo seed: template key "${templateKey}" is missing`);
  return node.id;
}

function setNote(roots: Forest, id: string, note: string): Forest {
  return updateNode(roots, id, (node) => ({ ...node, note }) as ProjectNode);
}

/** Appends `child` under `parentId` and hands back the id it was given. */
function append(roots: Forest, parentId: string, child: ProjectNode): [Forest, string] {
  return [insertNodes(roots, parentId, [child]), child.id];
}

const RESOLVED_AT = new Date(Date.now() - 3 * DAY).toISOString();

export function createMoonshotProject(): ProjectState {
  const template = createProductDesignTemplate({ projectName: "Moonshot" });
  let roots = template.roots;

  // ── Foundations ───────────────────────────────────────────────────────────

  const problemId = idOf(roots, TEMPLATE_KEYS.problemStatement);
  roots = setNote(
    roots,
    problemId,
    [
      "Moonshot unifies 50+ legacy tools across a $14 trillion industry, spanning 12 product verticals.",
      "",
      "The product could not do **investor reporting**, and a major prospect told us not to come back without it. This project covers that gap: define the core experience and information architecture, and get it demo-ready in two weeks.",
      "",
      "*White-labeled — details altered to protect confidential information.*",
    ].join("\n")
  );

  const [rootsA, threeRsId] = append(
    roots,
    problemId,
    createDecision("What outcome does investor reporting organize around?", {
      status: "resolved",
      resolution: "The 3 R's — Reporting, Remittance, and Reconciliation.",
      rationale:
        "Pyramid Principle sessions with SMEs collapsed decades of tacit expertise into one unifying outcome with three branches. Every flow that followed hangs off this spine.",
      resolvedAt: RESOLVED_AT,
      options: [
        {
          label: "The 3 R's — Reporting, Remittance, Reconciliation",
          description: "Organize around the three outcomes the work actually produces.",
          recommended: true,
          pros: [
            "Matches how investor reporting actually works",
            "Gives every downstream flow one place to hang from",
          ],
          cons: ["Costs SME time upfront that a two-week sprint can barely afford"],
        },
        {
          label: "Organize by loan lifecycle stage",
          description: "Mirror the stages engineering already models.",
          pros: ["Familiar to the team already modelling loans"],
          cons: [
            "Cuts across all three outcomes — users would jump between stages to finish one task",
          ],
        },
        {
          label: "Mirror the legacy tools' menu structure",
          description: "Reproduce what switchers already know.",
          pros: ["Near-zero learning curve for switchers"],
          cons: [
            "Imports the exact complexity we're trying to remove",
            "Forfeits the differentiation needed to overcome high switching costs",
          ],
        },
      ],
    })
  );
  roots = rootsA;

  const usersId = idOf(roots, TEMPLATE_KEYS.users);
  roots = setNote(
    roots,
    usersId,
    [
      "**Investor reporting analysts** are the primary user. They reconcile servicer data against investor records, and every dollar amount must balance to the penny.",
      "",
      "They track hundreds of millions of data points across millions of loans. 99.9% clear without issue — entire departments exist to manage the 0.1% that don't. The interface has to serve both facts at once: the macro picture, and the exceptions that need a human.",
    ].join("\n")
  );

  const [rootsB, defaultViewId] = append(
    roots,
    usersId,
    createDecision("Who does the dashboard's default view serve?", {
      status: "resolved",
      resolution: "The analyst working exceptions, not the manager reading totals.",
      rationale:
        "Managers check the macro number once a day; analysts live in the 0.1% all day. Defaulting to the exception queue puts the interface where the work is, and leaves the macro view one glance away rather than the other way round.",
      resolvedAt: RESOLVED_AT,
    })
  );
  roots = rootsB;

  const goalsId = idOf(roots, TEMPLATE_KEYS.goals);
  roots = setNote(
    roots,
    goalsId,
    [
      "**Primary goal:** close the enterprise clients that investor reporting was blocking.",
      "",
      "- Investor reporting demo-ready in a two-week sprint",
      "- Dashboard and agentic AI patterns reusable across all 12 verticals",
      "- Penny-variance research collapsed from hours a day to minutes",
    ].join("\n")
  );
  roots = insertNodes(roots, goalsId, [
    createAction("Ship demo-ready investor reporting flows (2-week sprint)", { done: true }),
    createAction("Close the first enterprise clients in the project's 4-year history", {
      done: true,
    }),
    createAction("Instrument time-to-resolution on penny variances", { done: false }),
  ]);

  const constraintsId = idOf(roots, TEMPLATE_KEYS.constraints);
  roots = setNote(
    roots,
    constraintsId,
    [
      "**Fixed**",
      "",
      "- Zero tolerance for error — regulated industry, where a wrong number is liability rather than a bug",
      '- Every dollar amount balances to the penny; rounding differences ("penny variances") are a critical miss if left unresolved',
      "- Two weeks to demo",
      "",
      "**Assumed**",
      "",
      "- Switching costs are high enough that parity won't win — the solution has to remove a limitation, not match one",
      "- Analysts will trust a recommendation if every data point behind it is linked rather than generated",
    ].join("\n")
  );

  // ── Research ──────────────────────────────────────────────────────────────

  const researchId = idOf(roots, TEMPLATE_KEYS.research);

  const [rootsC, smeId] = append(
    roots,
    researchId,
    createWorkstream("SME interviews", {
      objective: "Turn decades of SME expertise into an information architecture.",
      note: [
        "Started with SMEs and a sheet of paper, using the **Pyramid Principle** to find the unifying outcome and trace how everything connects back to it.",
        "",
        "Mapping the full domain — not just the features on the roadmap — supplied the industry context needed to design against how investor reporting actually works.",
      ].join("\n"),
    })
  );
  roots = rootsC;

  const [rootsD, scaleId] = append(
    roots,
    researchId,
    createWorkstream("Data volume and the 0.1% problem", {
      objective: "Understand what real data does to the interface at scale.",
      note: [
        "Always start with real data. A design that works with 100 loans breaks at 1,000,000.",
        "",
        "Two problems stood out in the existing systems:",
        "",
        "1. A wall of text — no hierarchy, no visualizations, no way to read a workload at a glance.",
        "2. Working a single loan required time-intensive searches across systems for supporting data.",
        "",
        "Either one is a large enough problem to justify the switching cost.",
      ].join("\n"),
    })
  );
  roots = rootsD;

  // ── Best practices ────────────────────────────────────────────────────────

  const bestPracticesId = idOf(roots, TEMPLATE_KEYS.bestPractices);

  const [rootsE, hitlId] = append(
    roots,
    bestPracticesId,
    createWorkstream("Human-in-the-loop AI", {
      objective: "Settle how AI and analysts divide the work.",
      note: [
        "Simple, repetitive tasks are ripe for AI. But in an industry with zero tolerance for mistakes, an AI solution has to earn trust without taking accountability away from a human.",
        "",
        "The template this set for every AI feature that followed: **agents research, people decide.**",
      ].join("\n"),
    })
  );
  roots = rootsE;

  const [rootsF, authorityId] = append(
    roots,
    hitlId,
    createDecision("How much authority does AI get over a penny variance?", {
      status: "resolved",
      resolution:
        "AI gathers the supporting documents and recommends a resolution; the analyst confirms or rejects.",
      rationale:
        "Keeps AI's speed while keeping the human at the decision. Recommendations surface the supporting data for verification, and every data point is linked rather than generated — so the analyst reviews evidence instead of trusting a black box. This collapsed hours of daily research into minutes of decision-making.",
      resolvedAt: RESOLVED_AT,
      options: [
        {
          label: "AI recommends, analyst decides",
          recommended: true,
          pros: [
            "Automation speed with human accountability intact",
            "Analyst verifies linked evidence rather than generated prose",
          ],
          cons: ["Still requires an analyst touch on every variance"],
        },
        {
          label: "AI auto-resolves low-value variances",
          pros: ["Removes the highest-volume, lowest-stakes work entirely"],
          cons: [
            "Leaves no reviewable decision trail",
            "The threshold is a policy judgment compliance won't sign off on",
          ],
        },
        {
          label: "AI surfaces the variance only, with no recommendation",
          pros: ["No risk of anchoring the analyst"],
          cons: ["Leaves the expensive part — gathering supporting documents — undone"],
        },
      ],
    })
  );
  roots = rootsF;

  const [rootsG, aiStandardId] = append(
    roots,
    bestPracticesId,
    createWorkstream("The AI standard", {
      objective: "Settle what AI is allowed to do, product-wide.",
      note: [
        "Speed is an asset only until errors overshadow it with liability. Worked with compliance and product to define the standard: **AI only performs actions that are reviewable and reversible.**",
        "",
        "Two sanctioned use cases:",
        "",
        "- **Synthesis** — gather and summarize information already in the system",
        "- **Explanation** — explain what the system shows, and why",
        "",
        "Both keep the user in control and accountable.",
      ].join("\n"),
    })
  );
  roots = rootsG;

  // ── Patterns ──────────────────────────────────────────────────────────────

  const stylesId = idOf(roots, TEMPLATE_KEYS.styles);

  const [rootsH, dataVizId] = append(
    roots,
    stylesId,
    createWorkstream("Data visualization standards", {
      objective: "Settle how visualizations use color, and when to use one at all.",
      note: [
        "Partnered with developers to implement visualizations on **D3**, enabling charts anywhere in the product.",
        "",
        "The standards cover how visualizations use color and — more often the useful rule — when not to use one.",
      ].join("\n"),
    })
  );
  roots = rootsH;

  const [rootsI, chartEarnsId] = append(
    roots,
    dataVizId,
    createDecision("When does a chart earn its place?", {
      status: "resolved",
      resolution: "Only when it changes what the user would do next.",
      rationale:
        "Product wanted an accepted-vs-rejected chart. When 99.9% of loans are always accepted, that chart carries no information. The rule generalizes: a visualization that can't change a decision is decoration.",
      resolvedAt: RESOLVED_AT,
    })
  );
  roots = rootsI;

  const componentsId = idOf(roots, TEMPLATE_KEYS.components);

  const [rootsJ, chartsId] = append(
    roots,
    componentsId,
    createWorkstream("Dashboard charts", {
      objective: "Settle the reusable dashboard chart pattern.",
      note: [
        "Two charts side by side: **macro on the left** for the full picture, **exceptions on the right** to surface what needs action.",
        "",
        "This came out of the two-week sprint as the product's first dashboard pattern, and became the default for dashboards across the platform.",
      ].join("\n"),
    })
  );
  roots = rootsJ;

  const [rootsK, oneOrTwoId] = append(
    roots,
    chartsId,
    createDecision("One chart or two?", {
      status: "resolved",
      resolution: "Two charts side by side — a macro view and an exception view.",
      rationale:
        'A single accepted-vs-rejected chart is 99.9% one color and tells the analyst nothing. Splitting it lets the macro chart answer "how are we doing" and the exception chart answer "what do I work next", without either compromising for the other.',
      resolvedAt: RESOLVED_AT,
      options: [
        {
          label: "Two charts — macro and exceptions",
          recommended: true,
          pros: ["Each chart answers one question well"],
          cons: ["Costs horizontal space that a single chart wouldn't"],
        },
        {
          label: "One accepted-vs-rejected chart",
          cons: ["99.9% acceptance makes the comparison meaningless"],
        },
        {
          label: "Exception table only, no chart",
          pros: ["Fastest to build"],
          cons: ["Loses the at-a-glance workload read the legacy systems already fail at"],
        },
      ],
    })
  );
  roots = rootsK;

  roots = insertNodes(roots, chartsId, [
    createAction("Implement charts on D3 so any vertical can reuse them", { done: true }),
    createAction("Document the macro/exception pairing in the design system", { done: true }),
  ]);

  const [rootsL, aiCardId] = append(
    roots,
    componentsId,
    createWorkstream("AI recommendation card", {
      objective: "Settle the reusable pattern for surfacing an AI recommendation.",
      note: [
        "What an analyst sees for each rejected loan: the recommended resolution, the supporting documents the agent gathered, and confirm/reject.",
        "",
        "Every data point on the card links to its source record. Nothing on it is generated prose.",
      ].join("\n"),
    })
  );
  roots = rootsL;

  roots = insertNodes(roots, aiCardId, [
    createAction("Specify confirm / reject / needs-review states", { done: true }),
    createAction("Define the empty state when no documents are found", { done: false }),
  ]);

  const tree: ProjectTree = { ...template, roots };

  // ── conversations ─────────────────────────────────────────────────────────
  // Only sessions that actually wrote to a node carry that node in
  // `taggedNodeIds` — that is what the right panel's History filters on.

  const sessionsByWorkstreamId: SessionsByWorkstreamId = {
    [problemId]: [
      session({
        workstreamId: problemId,
        taggedNodeIds: [problemId, threeRsId],
        agoMs: 3 * DAY,
        turns: [
          greeting("Problem statement", "Settle what problem this project solves, and for whom."),
          {
            role: "user",
            text: "0→1 fintech product, 12 verticals. We just lost a deal because we can't do investor reporting, and I have two weeks to get it demo-ready.",
          },
          {
            role: "assistant",
            text: "Two weeks means you're settling the spine, not the surface — so the thing to get right is what investor reporting is *for*, before anything gets drawn.\n\nWhat do your SMEs say the work produces? Not the screens they use today, the outcomes they're accountable for.",
          },
          {
            role: "user",
            text: "Sat down with them and a sheet of paper. It keeps coming back to three things: reporting, remittance, reconciliation.",
          },
          {
            role: "assistant",
            text: "That's your architecture, then. Three outcomes is small enough to hold in your head and complete enough that every feature has an obvious home — which is what you need when the roadmap is 200+ features and the sprint is two weeks.\n\nI've filed it as a resolved decision under Problem statement.",
            proposals: [
              {
                id: createId(),
                kind: "resolveDecision",
                nodeId: threeRsId,
                resolution: "The 3 R's — Reporting, Remittance, and Reconciliation.",
                rationale:
                  "Pyramid Principle sessions with SMEs collapsed decades of tacit expertise into one unifying outcome with three branches.",
                status: "accepted",
              },
            ],
          },
        ],
      }),
    ],

    [usersId]: [
      session({
        workstreamId: usersId,
        taggedNodeIds: [usersId, defaultViewId],
        agoMs: 2 * DAY,
        turns: [
          greeting("Users", "Settle who the primary user is and what they're trying to do."),
          {
            role: "user",
            text: "Analysts track hundreds of millions of data points across millions of loans, but 99.9% clear without issue. Whole departments exist for the 0.1%.",
          },
          {
            role: "assistant",
            text: "Then the dashboard has a conflict to resolve: the number that proves the system is healthy and the queue that represents the actual job are not the same view, and one of them has to be the default.\n\nWhich one does the person opening this at 9am need first?",
          },
          {
            role: "user",
            text: "The analyst, working exceptions. Managers only check the totals once a day.",
          },
          {
            role: "assistant",
            text: "Recorded. Worth noting the consequence so it doesn't get re-litigated later: the macro view now has to be reachable in a glance rather than a click, or you've just moved the problem.",
            proposals: [
              {
                id: createId(),
                kind: "resolveDecision",
                nodeId: defaultViewId,
                resolution: "The analyst working exceptions, not the manager reading totals.",
                status: "accepted",
              },
            ],
          },
        ],
      }),
    ],

    [scaleId]: [
      session({
        workstreamId: scaleId,
        taggedNodeIds: [scaleId],
        agoMs: 2 * DAY + 4 * HOUR,
        turns: [
          greeting(
            "Data volume and the 0.1% problem",
            "Understand what real data does to the interface at scale."
          ),
          {
            role: "user",
            text: "I want to prototype against real data, not 20 rows of lorem ipsum.",
          },
          {
            role: "assistant",
            text: "Right instinct — at a million loans the failure modes are different in kind, not degree. Pagination, empty states, and any chart with a category axis all break at a different scale than they do at 100 rows.\n\nWhat did the existing systems get wrong?",
          },
          {
            role: "user",
            text: "Two things. Wall of text with no hierarchy, and you have to search other systems to get the supporting data for a single loan.",
          },
          {
            role: "assistant",
            text: "Both are large enough to justify a switching cost, which matters more than usual here — parity won't move anyone off a system they've used for a decade. I've written both up under Research.",
          },
        ],
      }),
    ],

    [hitlId]: [
      session({
        workstreamId: hitlId,
        taggedNodeIds: [hitlId, authorityId],
        agoMs: 26 * HOUR,
        turns: [
          greeting("Human-in-the-loop AI", "Settle how AI and analysts divide the work."),
          {
            role: "user",
            text: "Penny variances are mostly rounding differences, and resolving one takes hours of document hunting. Feels like the obvious place for AI. But we're regulated — zero tolerance.",
          },
          {
            role: "assistant",
            text: "Then the question isn't whether to use AI, it's where the accountability lands. Three positions worth weighing:\n\n1. AI recommends, analyst decides\n2. AI auto-resolves below a value threshold\n3. AI surfaces the variance with no recommendation\n\nOption 2 is the one compliance will push back on — a threshold is a policy judgment, and there's no reviewable trail behind it.",
          },
          {
            role: "user",
            text: "Option 1. And the recommendation has to show its work — every number linked back to the source record, nothing generated.",
          },
          {
            role: "assistant",
            text: "That's the distinction that makes it defensible: the analyst is reviewing evidence, not trusting prose. Filed as resolved.\n\nThis reads like a standard rather than a one-off — worth promoting to Best practices so the next AI feature inherits it instead of re-deciding it.",
            proposals: [
              {
                id: createId(),
                kind: "resolveDecision",
                nodeId: authorityId,
                resolution:
                  "AI gathers the supporting documents and recommends a resolution; the analyst confirms or rejects.",
                rationale:
                  "Keeps AI's speed while keeping the human at the decision. Every data point is linked, not generated.",
                status: "accepted",
              },
            ],
          },
        ],
      }),
    ],

    [aiStandardId]: [
      session({
        workstreamId: aiStandardId,
        taggedNodeIds: [aiStandardId],
        agoMs: 20 * HOUR,
        turns: [
          greeting("The AI standard", "Settle what AI is allowed to do, product-wide."),
          {
            role: "user",
            text: "Compliance wants a blanket rule for AI across all 12 verticals, not a per-feature argument.",
          },
          {
            role: "assistant",
            text: "The cleanest rule is a constraint on the *action*, not on the model: AI only performs actions that are reviewable and reversible. That's auditable, and it doesn't need updating every time the model does.\n\nIn practice it leaves you two sanctioned use cases — synthesis and explanation. Both keep the user accountable.",
          },
          {
            role: "user",
            text: "That's the one. Write it up.",
          },
        ],
      }),
    ],

    [chartsId]: [
      session({
        workstreamId: chartsId,
        taggedNodeIds: [chartsId, oneOrTwoId],
        agoMs: 5 * HOUR,
        turns: [
          greeting("Dashboard charts", "Settle the reusable dashboard chart pattern."),
          {
            role: "user",
            text: "Product wants a chart of accepted vs rejected loans on the dashboard.",
          },
          {
            role: "assistant",
            text: 'That chart is 99.9% one color every single day. It\'ll be technically accurate and completely uninformative — and it takes the most valuable space on the page to say nothing.\n\nThe analyst has two different questions: "how are we doing" and "what do I work next". One chart can\'t answer both without compromising for each.',
          },
          {
            role: "user",
            text: "So two charts. Macro on the left, exceptions on the right.",
          },
          {
            role: "assistant",
            text: "Filed. I'd generalize the underlying rule into Styles as well — a visualization earns its place only when it changes what the user does next. That gives you something to point at the next time a chart gets requested by default.",
          },
        ],
      }),
      session({
        workstreamId: chartsId,
        taggedNodeIds: [chartsId],
        agoMs: 90 * MINUTE,
        turns: [
          greeting("Dashboard charts", "Settle the reusable dashboard chart pattern."),
          {
            role: "user",
            text: "How do we make these reusable across the other verticals?",
          },
          {
            role: "assistant",
            text: "Two separate things to settle: the implementation and the rule.\n\nD3 gives every vertical the primitive. But the pattern that's actually worth propagating is the pairing — macro alongside exceptions — because that's the part someone will otherwise reinvent badly. I've added both as actions.",
          },
        ],
      }),
    ],

    [dataVizId]: [
      session({
        workstreamId: dataVizId,
        taggedNodeIds: [dataVizId, chartEarnsId],
        agoMs: 4 * HOUR,
        turns: [
          greeting(
            "Data visualization standards",
            "Settle how visualizations use color, and when to use one at all."
          ),
          {
            role: "user",
            text: "I want a standard so we stop adding charts just because the space looks empty.",
          },
          {
            role: "assistant",
            text: "Make the test behavioral rather than aesthetic: a visualization earns its place only when it changes what the user would do next. Anything that fails that is decoration, regardless of how good it looks.\n\nRecorded under Styles.",
          },
        ],
      }),
    ],

    [smeId]: [
      session({
        workstreamId: smeId,
        taggedNodeIds: [smeId],
        agoMs: 3 * DAY + 2 * HOUR,
        turns: [
          greeting(
            "SME interviews",
            "Turn decades of SME expertise into an information architecture."
          ),
          {
            role: "user",
            text: "Three SMEs, forty years of combined experience, and none of them describe the job the same way.",
          },
          {
            role: "assistant",
            text: "That's usually a sign they're describing different *levels* rather than disagreeing. Pyramid Principle is the right tool — find the single outcome they'd all agree on, then let their differences become the branches under it.",
          },
        ],
      }),
    ],
  };

  return {
    id: "demo-moonshot",
    tree,
    selectedNodeId: problemId,
    sessionsByWorkstreamId,
  };
}
