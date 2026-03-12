# Flow Compass — Goal Definition & Milestone Generation

### 1. Valuable — Desired Outcome

The user wants to translate a vague idea into a structured, actionable project plan. Success means they finish this flow with a named project and a set of milestones they believe in — each one a meaningful step toward their goal. They walk away with a clear starting point instead of a blank page.

---

### 2. Usable — User Journey & Problems

> User wants to articulate their goal → Problem: they don't know how to frame it as a plan → System helps by providing an open chat where they can describe it naturally

> User wants to know if the AI understood them → Problem: a vague goal produces a vague plan → System helps by responding with a named project and a milestone list, giving the user something concrete to react to

> User wants to start working immediately → Problem: switching from "planning mode" to "doing mode" requires a deliberate transition → System helps by automatically navigating to the first milestone once the plan is generated

---

### 3. Practical — Interface Strategy

**Components in Play**

- `Nav` → renders the sidebar; reflects the project name and milestones once the AI generates them
- `ProjectSwitcher` → displays the project name, confirming the AI understood the goal
- `MilestoneTree` → populates in real time as the `nav_patch` arrives; shows the user their plan taking shape
- `PlatformMenuItem` → "Foundation" entry — the permanent home for the goal thread
- `MessageList` → shows the conversation; makes the AI's reasoning visible
- `ChatComposer` → the only input; keeps the interaction simple and focused

**Flow Mechanics**
- Foundation is the entry point; the chat thread here is the only place goal definition happens
- The AI response streams text first, then emits a `nav_patch` that sets the project name and adds milestones to the sidebar
- Once milestones exist, the active nav item automatically shifts to the first milestone — signalling the transition from planning to doing

**Non-Negotiable Rules**
- Foundation must be the entry point on every fresh session
- The sidebar must not show milestones until the AI generates them — no placeholder items
- Auto-navigation to the first milestone happens only after a `nav_patch` with milestones is received
- The user must not be forced to navigate manually after goal submission

---

### 4. Out of Scope

- Editing or renaming the goal after it's set
- Reordering or deleting milestones from the sidebar
- Multi-project support
- Saving the goal to a backend

---

### 5. Assumptions

Assumption: A single goal submission is enough to generate the full milestone plan — no multi-turn clarification required before the `nav_patch` fires.
Assumption: The Foundation thread persists and remains accessible after milestones are created.
