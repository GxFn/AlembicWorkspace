---
id: <redacted>
title: Use named greeting exports for claude-code activation fixture
trigger: "@GreetingFlow"
lifecycle: staging
stagingDeadline: 1783504155225
language: javascript
dimensionId: ts-js-module
category: Utility
kind: pattern
knowledgeType: code-pattern
complexity: beginner
scope: narrow
description: The fixture greeting behavior lives behind a named ESM export so hosts can prime and search before edits.
source: p4-claude-code-realtest
moduleName: src
whenClause: When editing src/greeting.js or answering questions about the fixture greeting module.
doClause: Use named exported functions for the greeting flow.
dontClause: Avoid hiding greeting behavior in anonymous inline callbacks.
coreCode: "export function greet(name) {\n  return `Hello, ${name}!`;\n}"
createdBy: gaoxuefeng
createdAt: 1783417755
updatedAt: 1783417755
sourceFile: Alembic/candidates/ts-js-module/GreetingFlow.md
tags: ["p4-realtest","claude-code","greeting","ts-js-module","dimension:ts-js-module","bootstrap","deep-scan"]
autoApprovable: true
_content: {"pattern":"export function greet(name) {\n  return `Hello, ${name}!`;\n}","markdown":"The MiniActivationFixture project keeps greeting logic in `src/greeting.js` and calls it from `src/index.js`.\n\n✅ Correct example:\n```js\nexport function greet(name) {\n  return `Hello, ${name}!`;\n}\n```\n\n❌ Forbidden example:\n```js\nexport default (name) => `Hello, ${name}!`;\n```\n","rationale":"The project has a tiny but real ESM boundary: src/index.js imports greet from src/greeting.js. Keeping it named makes code edits and project questions easy to ground.","steps":[],"codeChanges":[],"verification":null}
_relations: {"inherits":[],"implements":[],"calls":[],"depends_on":[],"data_flow":[],"conflicts":[],"extends":[],"related":[],"alternative":[],"prerequisite":[],"deprecated_by":[],"solves":[],"enforces":[],"references":[]}
_constraints: {"guards":[],"boundaries":[],"preconditions":[],"sideEffects":[]}
_reasoning: {"whyStandard":"src/greeting.js exports greet and src/index.js imports it, so the named export is the observed local module boundary.","sources":["src/greeting.js:1-3","src/index.js:1","package.json:1"],"confidence":0.93,"qualitySignals":{},"alternatives":[]}
_quality: {"completeness":0.947125,"adaptation":0.85,"documentation":0.41124999999999995,"overall":0.738,"grade":"B"}
_stats: {"views":0,"adoptions":0,"applications":0,"guardHits":0,"searchHits":0,"authority":4,"lastHitAt":null,"lastSearchedAt":null,"lastGuardHitAt":null,"hitsLast30d":0,"hitsLast90d":0,"searchHitsLast30d":0,"version":1,"ruleFalsePositiveRate":null}
_aiInsight: "src/greeting.js exports greet and src/index.js imports it, so the named export is the observed local module boundary."
_contentHash: a75351d28e771ced
---

The MiniActivationFixture project keeps greeting logic in `src/greeting.js` and calls it from `src/index.js`.

✅ Correct example:
```js
export function greet(name) {
  return `Hello, ${name}!`;
}
```

❌ Forbidden example:
```js
export default (name) => `Hello, ${name}!`;
```
