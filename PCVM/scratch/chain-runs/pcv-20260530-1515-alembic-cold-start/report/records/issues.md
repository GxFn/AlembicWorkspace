# PCVM Issue Records: LLM Token Efficiency

Run ID: `pcv-20260530-1515-alembic-cold-start`
Owner: `PCVM`
Status: `current`

## Current LLM Token Efficiency Work

Current blocker:

- Package E requires AlembicTest / live AI on the BiliDili same-input route.
- This route sends project content to the configured external provider; explicit approval is required before starting.

Next metric work:

- Run AlembicTest same-input BiliDili `design-patterns` one-dimension / no-delivery route after approval.
- Record analyze input/output tokens, producer input/output tokens, route total input/output tokens, and `pcvAnalyzeGroundingInvalidNoEvidence`.
- Compare only against the same-input route; do not promote live route to final product acceptance.
- Do not modify BiliDili or any real test project source.
