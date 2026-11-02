# Coaching Pro implementation and acceptance plan

Scope: a dedicated pedagogical coaching constructor at `/dashboard/ai/coaching`, in RU/KK, using the existing authenticated durable generation queue. No production deployment.

1. Define typed request/result contracts with backend: educator audience, 45-minute default, 20 participants, 4 groups, explicit defaults, format/resources/experience/methods and optional AI.
2. Build an accessible responsive workspace: topic first, clear required parameters, optional details, visible summary and cost, saved user-scoped draft, feedback and recovery.
3. Render the nine requested sections in order: passport, concept, exact timeline, complete facilitator scenario, practical tasks, ready material/slide text, reflection, evaluation and conclusion. Preserve speeches, transitions, examples, alternatives and contextual values.
4. Connect generation, cancellation, reopening retained jobs, owned Word export, Markdown/copy, navigation and general material history. Distinguish slide text from a generated presentation.
5. Verify request validation, malformed saved drafts/results, exact timing, output completeness, RU/KK, history/download contracts, lint, types, tests, production build and desktop/mobile browser behavior.
6. Commit and push incremental reviewed work to `codex/coaching-pro`; keep production unchanged and leave the local application running for review.

Design direction: the UI/UX skill matched functional Minimalism & Swiss Style for professional tools. Use its clear hierarchy, spacing, low-motion feedback, contrast and keyboard guidance. Preserve the product's existing font instead of its unrelated wellness font suggestion. Use a restrained ink/teal palette, warm paper panels, readable controls and progressive disclosure; no new font requests or decorative animation.

Acceptance: defaults are visible before submission; invalid group counts are rejected; all nine timeline rows add to the requested duration; task durations fit the practice stage; every facilitator speech and participant action remains available; materials contain ready text; only real downloadable artifacts are described as files; user state never crosses accounts.
