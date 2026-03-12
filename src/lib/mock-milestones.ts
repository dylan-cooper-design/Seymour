import type { NavModel } from "@/types/navigation";

// ─── Seymour — Empty state (fresh project, no goal set) ───────────────────────

export const SEYMOUR_NAV_MODEL: NavModel = {
  projectName: "Seymour",
  foundationLabel: "Foundation",
  foundationDetail: {
    sections: [
      {
        label: "GOAL",
        content: "Not yet defined. Tell Seymour your goal to get started.",
      },
    ],
  },
  groups: [],
};

// ─── Simplina — In progress ───────────────────────────────────────────────────

export const SIMPLINA_NAV_MODEL: NavModel = {
  projectName: "Simplina",
  foundationLabel: "Foundation",
  foundationDetail: {
    sections: [
      {
        label: "GOAL",
        content:
          "Build an onboarding flow builder that cuts time-to-activation for B2B SaaS products — letting teams design, test, and publish in-app onboarding without engineering help.",
      },
      {
        label: "MILESTONES",
        content:
          "Valuable → Usable → Practical → Presentable → Testable → Repeatable",
      },
      {
        label: "WORKING CONTEXT",
        content:
          "Small team of two. Designer-led, shipping in two-week sprints. Backend is minimal — focus is on the visual builder and the embed SDK.",
      },
    ],
  },
  groups: [
    {
      id: "valuable",
      label: "Valuable",
      isExpanded: true,
      items: [
        {
          id: "simplina-valuable-value-prop",
          label: "Value Proposition",
          status: "complete-decision",
          objective: "Define the core problem and who we're solving it for",
          decisions: [
            {
              id: "sp-d1",
              milestoneId: "simplina-valuable-value-prop",
              title: "Primary use case",
              actionItem: "Validate with 5 customer interviews",
              status: "done",
            },
          ],
          detail: {
            sections: [
              {
                label: "CONTEXT",
                content:
                  "Most onboarding tools require engineering time to set up and maintain. Product teams want control without depending on a sprint slot.",
              },
              {
                label: "DECISION",
                content:
                  "Target product managers at B2B SaaS companies (50–500 seats) who are blocked by engineering bandwidth when iterating on onboarding.",
              },
              {
                label: "RATIONALE",
                content:
                  "This segment has budget, feels the pain acutely, and makes purchase decisions without IT sign-off. It's also a well-understood buyer persona we can reach efficiently.",
              },
              {
                label: "PROS",
                content: [
                  "Clear ICP makes messaging and outreach focused",
                  "Segment has a proven willingness to pay for no-code tools",
                  "High repeat usage once embedded — sticky product",
                ],
              },
              {
                label: "CONS",
                content: [
                  "Enterprise deals take longer to close",
                  "May need compliance features (SSO, audit logs) earlier than expected",
                ],
              },
            ],
          },
        },
        {
          id: "simplina-valuable-pricing",
          label: "Pricing Model",
          status: "complete-decision",
          objective: "Choose a pricing structure that matches how value is delivered",
          decisions: [
            {
              id: "sp-d2",
              milestoneId: "simplina-valuable-pricing",
              title: "Pricing structure",
              actionItem: "Add pricing page to marketing site",
              status: "done",
            },
          ],
          detail: {
            sections: [
              {
                label: "DECISION",
                content:
                  "Per-seat pricing with a free tier capped at 500 monthly active users. Paid plans unlock unlimited MAU, A/B testing, and analytics.",
              },
              {
                label: "RATIONALE",
                content:
                  "Free tier lowers the barrier to try the product. Revenue scales with usage, which aligns our incentives with customers growing their user base.",
              },
              {
                label: "ASSUMPTIONS",
                content: [
                  "Teams will upgrade once they hit the MAU cap",
                  "Analytics and A/B testing are strong enough upsell hooks",
                ],
              },
            ],
          },
        },
      ],
    },
    {
      id: "usable",
      label: "Usable",
      isExpanded: true,
      items: [
        {
          id: "simplina-usable-builder",
          label: "Flow Builder UI",
          status: "incomplete-action",
          objective: "Build the visual editor for creating onboarding flows",
          decisions: [
            {
              id: "sp-d3",
              milestoneId: "simplina-usable-builder",
              title: "Builder interaction model",
              actionItem: "Implement drag-and-drop canvas with step connectors",
              status: "done",
            },
            {
              id: "sp-d4",
              milestoneId: "simplina-usable-builder",
              title: "Step types",
              actionItem: "Build tooltip, modal, and hotspot step components",
              status: "todo",
            },
          ],
          detail: {
            sections: [
              {
                label: "CONTEXT",
                content:
                  "The builder is the core of the product. It needs to feel fast and direct — dragging steps onto a canvas, connecting them, and previewing the result without leaving the page.",
              },
              {
                label: "DECISION",
                content:
                  "Canvas-based builder with a left panel for step types and a right panel for step configuration. Steps connect via arrows. Live preview renders the flow in a simulated app shell.",
              },
              {
                label: "NEXT ACTIONS",
                content: [
                  "Build tooltip, modal, and hotspot step components",
                  "Wire live preview to canvas state",
                  "Add undo/redo with keyboard shortcuts",
                ],
              },
            ],
          },
        },
        {
          id: "simplina-usable-templates",
          label: "Starter Templates",
          status: "incomplete-decision",
          objective: "Reduce time-to-first-flow with ready-made templates",
          decisions: [],
          detail: {
            sections: [
              {
                label: "CONTEXT",
                content:
                  "New users staring at a blank canvas is a known drop-off point. Templates give them a starting point that they can adapt rather than build from scratch.",
              },
              {
                label: "OPEN QUESTIONS",
                content: [
                  "How many templates for launch — 3, 5, or more?",
                  "Do templates cover different use cases (feature announcement, setup checklist, empty state) or different visual styles?",
                  "Who creates and maintains templates — us or the community?",
                ],
              },
            ],
          },
        },
      ],
    },
    {
      id: "practical",
      label: "Practical",
      isExpanded: false,
      isDimmed: true,
      items: [
        {
          id: "simplina-practical-sdk",
          label: "Embed SDK",
          status: "incomplete-decision",
          objective: "Ship a lightweight JS SDK for embedding flows in any web app",
          decisions: [],
          detail: {
            sections: [
              {
                label: "OPEN QUESTIONS",
                content: [
                  "Vanilla JS or framework-specific packages (React, Vue)?",
                  "How does the SDK authenticate — API key or OAuth?",
                  "What's the bundle size budget?",
                ],
              },
            ],
          },
        },
      ],
    },
    {
      id: "presentable",
      label: "Presentable",
      isExpanded: false,
      isDimmed: true,
      items: [
        {
          id: "simplina-presentable-marketing",
          label: "Marketing Site",
          status: "incomplete-decision",
          objective: "Launch a site that converts visitors to free-tier signups",
          decisions: [],
        },
      ],
    },
    {
      id: "testable",
      label: "Testable",
      isExpanded: false,
      isDimmed: true,
      items: [
        {
          id: "simplina-testable-beta",
          label: "Beta Program",
          status: "incomplete-decision",
          objective: "Run a closed beta with 10 design teams",
          decisions: [],
        },
      ],
    },
    {
      id: "repeatable",
      label: "Repeatable",
      isExpanded: false,
      isDimmed: true,
      items: [
        {
          id: "simplina-repeatable-ci",
          label: "CI/CD & Monitoring",
          status: "incomplete-decision",
          objective: "Automate deploy and set up error alerting",
          decisions: [],
        },
      ],
    },
  ],
};

// ─── Mango Doodles — Complete ─────────────────────────────────────────────────

export const MANGO_DOODLES_NAV_MODEL: NavModel = {
  projectName: "Mango Doodles",
  foundationLabel: "Foundation",
  foundationDetail: {
    sections: [
      {
        label: "GOAL",
        content:
          "Build a brand asset library for design and marketing teams — a single source of truth for logos, illustrations, icons, color palettes, and usage guidelines.",
      },
      {
        label: "MILESTONES",
        content:
          "Valuable → Usable → Practical → Presentable → Testable → Repeatable",
      },
      {
        label: "WORKING CONTEXT",
        content:
          "Solo designer with a part-time developer. Assets already exist — this is about organisation, access, and keeping things up to date.",
      },
      {
        label: "SCOPE",
        content:
          "MVP covers upload, tagging, search, and download. Version history, approval workflows, and API access are post-launch.",
      },
    ],
  },
  groups: [
    {
      id: "valuable",
      label: "Valuable",
      isExpanded: true,
      items: [
        {
          id: "mango-valuable-asset-types",
          label: "Asset Types",
          status: "complete-decision",
          objective: "Define what goes in the library",
          decisions: [
            {
              id: "md-d1",
              milestoneId: "mango-valuable-asset-types",
              title: "Supported formats",
              actionItem: "Configure upload pipeline for SVG, PNG, and PDF",
              status: "done",
            },
          ],
          detail: {
            sections: [
              {
                label: "DECISION",
                content:
                  "Support SVG, PNG, PDF, and Lottie JSON at launch. All assets require a name, tags, and a usage note. Brand guidelines ship as PDF only.",
              },
              {
                label: "RATIONALE",
                content:
                  "These four formats cover 95% of what design and marketing actually request. Lottie support differentiates us from a plain file folder without adding engineering complexity.",
              },
              {
                label: "PROS",
                content: [
                  "Covers all current asset requests from marketing",
                  "Lottie support future-proofs for motion assets",
                  "PDF guidelines keep brand docs in one place",
                ],
              },
              {
                label: "CONS",
                content: [
                  "No Figma or Sketch source files — requestors must export",
                  "Large PDFs may slow the browser preview",
                ],
              },
            ],
          },
        },
        {
          id: "mango-valuable-taxonomy",
          label: "Taxonomy & Tagging",
          status: "complete-decision",
          objective: "Make assets findable without a folder hierarchy",
          decisions: [
            {
              id: "md-d2",
              milestoneId: "mango-valuable-taxonomy",
              title: "Tagging model",
              actionItem: "Seed the tag library with existing asset metadata",
              status: "done",
            },
          ],
          detail: {
            sections: [
              {
                label: "DECISION",
                content:
                  "Flat tag model with three fixed dimensions: Category (logo, icon, illustration, photo, document), Color (primary, secondary, neutral, white), and Usage (web, print, social, internal). Tags are required on upload.",
              },
              {
                label: "RATIONALE",
                content:
                  "A flat tag model is easier to maintain than nested folders and handles cross-cutting queries (e.g. 'all primary-color icons for web') that folder trees can't express naturally.",
              },
            ],
          },
        },
      ],
    },
    {
      id: "usable",
      label: "Usable",
      isExpanded: true,
      items: [
        {
          id: "mango-usable-browse",
          label: "Browse & Search",
          status: "complete-decision",
          objective: "Let users find assets quickly without knowing the file name",
          decisions: [
            {
              id: "md-d3",
              milestoneId: "mango-usable-browse",
              title: "Search implementation",
              actionItem: "Ship full-text + tag search with keyboard shortcut",
              status: "done",
            },
          ],
          detail: {
            sections: [
              {
                label: "DECISION",
                content:
                  "Full-text search across asset names and tags, with filter chips for each tag dimension. Results update live as the user types. Cmd+K opens search from anywhere.",
              },
              {
                label: "RATIONALE",
                content:
                  "Marketing teams search by keyword, not category. Live results with tag filters let them narrow quickly without knowing the exact file name.",
              },
            ],
          },
        },
        {
          id: "mango-usable-download",
          label: "Download & Copy",
          status: "complete-decision",
          objective: "Make grabbing an asset as frictionless as possible",
          decisions: [
            {
              id: "md-d4",
              milestoneId: "mango-usable-download",
              title: "Download UX",
              actionItem: "Implement one-click download and copy-as-SVG",
              status: "done",
            },
          ],
          detail: {
            sections: [
              {
                label: "DECISION",
                content:
                  "One-click download for PNG and PDF. SVG assets get a 'Copy SVG' button that puts the markup on the clipboard. No sign-in required to download.",
              },
              {
                label: "RATIONALE",
                content:
                  "Frictionless access was the top request in stakeholder interviews. Gating downloads behind a login would defeat the purpose of centralising assets.",
              },
            ],
          },
        },
      ],
    },
    {
      id: "practical",
      label: "Practical",
      isExpanded: false,
      items: [
        {
          id: "mango-practical-upload",
          label: "Upload & Admin",
          status: "complete-decision",
          objective: "Give the design team a simple way to add and update assets",
          decisions: [
            {
              id: "md-d5",
              milestoneId: "mango-practical-upload",
              title: "Admin access model",
              actionItem: "Ship password-protected admin panel with bulk upload",
              status: "done",
            },
          ],
          detail: {
            sections: [
              {
                label: "DECISION",
                content:
                  "Password-protected admin panel, separate from the public library. Supports single-file and bulk ZIP upload. Admins can edit metadata and archive assets.",
              },
            ],
          },
        },
      ],
    },
    {
      id: "presentable",
      label: "Presentable",
      isExpanded: false,
      items: [
        {
          id: "mango-presentable-guidelines",
          label: "Usage Guidelines",
          status: "complete-decision",
          objective: "Surface brand rules alongside assets",
          decisions: [
            {
              id: "md-d6",
              milestoneId: "mango-presentable-guidelines",
              title: "Guidelines format",
              actionItem: "Publish guidelines as embedded PDFs with a summary panel",
              status: "done",
            },
          ],
          detail: {
            sections: [
              {
                label: "DECISION",
                content:
                  "Guidelines live as downloadable PDFs with a short summary card shown inline. Each asset can link to a relevant guideline section.",
              },
            ],
          },
        },
      ],
    },
    {
      id: "testable",
      label: "Testable",
      isExpanded: false,
      items: [
        {
          id: "mango-testable-review",
          label: "Stakeholder Review",
          status: "complete-decision",
          objective: "Validate the library with the marketing and design teams",
          decisions: [
            {
              id: "md-d7",
              milestoneId: "mango-testable-review",
              title: "Review format",
              actionItem: "Run a 45-min walkthrough session with both teams",
              status: "done",
            },
          ],
          detail: {
            sections: [
              {
                label: "DECISION",
                content:
                  "Ran a 45-minute walkthrough with 4 marketing and 2 design team members. All core tasks completed without assistance. One request added: bulk-download for campaign packs.",
              },
            ],
          },
        },
      ],
    },
    {
      id: "repeatable",
      label: "Repeatable",
      isExpanded: false,
      items: [
        {
          id: "mango-repeatable-process",
          label: "Asset Update Process",
          status: "complete-decision",
          objective: "Establish a repeatable workflow for keeping the library current",
          decisions: [
            {
              id: "md-d8",
              milestoneId: "mango-repeatable-process",
              title: "Update cadence",
              actionItem: "Document the update process and send to the design team",
              status: "done",
            },
          ],
          detail: {
            sections: [
              {
                label: "DECISION",
                content:
                  "Assets are reviewed monthly. The lead designer owns the admin panel. New assets must pass a naming and tagging checklist before publishing.",
              },
              {
                label: "RATIONALE",
                content:
                  "A lightweight process beats no process. Monthly reviews are low-overhead and catch drift before it becomes a problem.",
              },
            ],
          },
        },
      ],
    },
  ],
};

// ─── Map keyed by project ID ──────────────────────────────────────────────────

export const MOCK_NAV_MODELS: Record<string, NavModel> = {
  seymour: SEYMOUR_NAV_MODEL,
  simplina: SIMPLINA_NAV_MODEL,
  "mango-doodles": MANGO_DOODLES_NAV_MODEL,
};

export const MOCK_NAV_MODEL = SIMPLINA_NAV_MODEL;
