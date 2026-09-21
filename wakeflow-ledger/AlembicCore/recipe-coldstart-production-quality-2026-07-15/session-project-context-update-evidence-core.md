# AlembicCore session project-context update evidence

- Task: `i1-i2-core-session-project-context-update-rootcause3-t1`
- Accepted parent: `f82bfec58e36ea71e575a23bee356623a7a28381`
- Single commit: `4a3e8bab3fc7aa05ef7b680593599634422513aa`
- Commit tree: `c7941aff9e489b65ce0b80765e26a803bfa75d76`
- Changed files: `GenerateSession.ts`, `MiningSessionStore.ts`, `GenerateSessionManager.test.ts`
- Runtime JSON: `session-project-context-update-runtime-core.json`

## Root cause and implementation

`GenerateSession` only accepted `projectContext` at construction and exposed no controlled update that could reach its existing synchronous `onChange -> GenerateSessionManager.#persist` path. Receipts produced after session creation therefore existed only in caller memory; a new manager/process reopened the original plan/recipe carrier from `active-sessions.json`.

The repair adds one `GenerateSession.replaceProjectContext()` boundary. It detaches and JSON-normalizes the replacement, swaps only the existing session authority, invokes the existing change/persist callback immediately, and restores the prior authority if persistence throws. It cannot select `dataRoot`, change session identity, or create another store.

`GenerateSession.#projectContext` is the sole mutable authority. `toSnapshot()` returns a detached copy and asks the existing `MiningSessionStore` serializer for a detached legacy metadata projection derived from that same authority. `MiningSessionStore` exposes no new mutator; its existing no-argument `toJSON()` remains compatible. Construction evaluates and detaches external context once, preventing getters or nested aliases from creating divergent authority snapshots.

## RED to GREEN

RED evidence was kept in the work turn rather than committed separately because the task requires one clean commit:

- Progressive persistence regression failed with `TypeError: session.replaceProjectContext is not a function`.
- Alias regression showed a nested update-input mutation changing the in-memory plan receipt to `mutated-input` and injecting an unpersisted module receipt.
- Independent review then reproduced constructor and nested `sessionStore.projectContext` alias paths; a side-effect getter also showed two reads could produce different top/store snapshots.

GREEN regressions prove:

- plan/recipe -> dependency -> module persists immediately on the same session id;
- a new `GenerateSessionManager(dataRoot)` sees each update without incidental later state changes;
- id, root, timestamps, dimensions, completed progress, and active lease remain stable;
- constructor input, update input, top snapshot output, and nested store snapshot output are detached;
- the constructor reads an accessor-backed input only once;
- injected `writeFileSync` failure throws, restores memory, and leaves the durable file byte-for-byte unchanged;
- existing lease, completion, expiry, recovery, and submission behavior remains covered by the focused and full suites.

## Verification

- Clean baseline: `npm run build:check` passed; focused suite 6/6 passed.
- Final `npm run build:check`: passed.
- Final focused `npx vitest run test/GenerateSessionManager.test.ts`: 8/8 passed.
- Final serial `npm run test`: 185 files / 1,804 tests passed.
- `npm run lint`, `npm run lint:naming`, `npm run lint:retired-symbols`, and `git diff --check`: passed.
- `npm run check`: build, public API boundary, layer contract, consumer imports, scope resolution, 60-entry public API smoke, output budgets, and space edges passed; it then stopped only at the unchanged pre-existing `src/infrastructure/vector/ASTChunker.ts:32` doctrine finding.
- Accepted-parent and final ASTChunker SHA-256 are both `f1d75391bd61f2d1e33b895814de35740d05b246ff1377fcba5d7e3ae8a1915c`; this task did not modify or exempt it.
- One earlier full-suite attempt was invalid because it ran concurrently with `npm run check`, whose clean-build step temporarily removed `dist`; the required serial rerun passed 1,804/1,804.
- Post-commit `npm run build`: passed and produced the runtime hashes recorded in the JSON artifact.

## Runtime receipts

The post-commit probe loaded the rebuilt `dist` and used two independent child Node processes plus the durable active-session file:

- dependency update, same-process snapshot: `dependency-graph`, `plan`, `recipe-generation`;
- dependency update, detached manager reopen: the same three receipts;
- module update in a child process: `dependency-graph`, `module-coverage`, `plan`, `recipe-generation`;
- final second child-process reopen and file record: the same four receipts.

All identity/progress/lease and isolation booleans in the runtime JSON are `true`; the lease remains `active`, and disk equals the final fresh-process snapshot.

## Two-stage self-review

Stage 1 — task and scope:

- The change supplies exactly the missing controlled producer capability within existing `GenerateSession` / `GenerateSessionManager` persistence responsibility.
- No caller-controlled data root, second store/journal/registry, Main carrier, PC-F counter, strict journal, other repository, Test, Wakeflow, or I3+ change was added.
- Only one AlembicCore commit was created.

Stage 2 — correctness and compatibility:

- Replacement is synchronous and failure-atomic with respect to in-memory authority and the existing atomic temp-write/rename persistence path.
- JSON-normalized structural copies make same-process and fresh-process snapshots equivalent and close nested mutation backdoors.
- The nested MiningSessionStore context remains a bounded legacy metadata projection, not a second carrier authority.
- The optional serializer override is additive; existing no-argument callers preserve their behavior while receiving detached output.
- Copy/serialization work is linear in the bounded session context and occurs only on construction, controlled replacement, or snapshot serialization.
- Independent correctness and scope/compatibility reviews found no remaining P0/P1/P2 issue.

Residual scope: this commit only enables Core session persistence. Main still owns wiring its actual dependency/module entrypoints to this API, and controller acceptance remains pending.
