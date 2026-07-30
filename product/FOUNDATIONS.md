# Seymour — Foundations

Why this exists. Who it's for. What changes for them. This document is stable — it
should rarely need editing. For how the app actually behaves (the interaction model,
the agent's moves, what gets written where), see `APPROACH.md`.

## Who

A product designer starting or mid-way through a design project, working within a
design system they didn't create fresh for this project.

## Before

Every designer tracks project context, decisions, and actions their own ad-hoc way,
scattered across whatever tools they happen to use. There's no consistent container,
so the reasoning behind the work has no default home and the path through the work
has no shape.

## After

A designer opens one file per project that already knows what to hold — the outcome,
the user, the design system in play, and the work broken into named areas, each
carrying the decisions that have to be made before the next action can be taken.
Seymour defines that structure with them and keeps them moving through it.

## Core

Momentum during the project — there's always an identifiable next decision, so the
project never stalls in the gap between "I know what I'm doing" and "I know what to
do right now" — and defensibility after: the reasoning survives, so a designer (or
teammate) can answer "why is it a modal" months later without digging through Slack.

## Problems this project solves

1. Nothing in the app is design-specific by default. Without deliberate prompting and
   structure, an AI planner has no concept of a design system, a design decision, or
   a design artifact.
2. Work areas are named from the actual project, so both the nav structure and the
   detail schema must be generated per project, not hardcoded to fixed labels.
3. A decision must be attached to the action it unblocks — otherwise these are two
   independent, unlinked lists.
4. "Easily moving through the work" requires the app to compute what's next:
   decisions and actions need status, and something has to identify the frontier item.
5. The design system is shared 1:many across projects, but everything else
   (foundations, work areas, decisions, actions) is per-project. That's a second data
   model layered on top of a single-project shape.
6. Foundations must stay live and revisable — not a form filled once at kickoff and
   never reopened.

## Intent

Give every design project one structured home — for product designers — so the
decisions behind the work are captured as they're made and the next one is always
identifiable.
