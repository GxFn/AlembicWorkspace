# PCF public route consumer migration — execution plan

Task: `i3-i9-alembic-pcf-public-route-consumer-migration-rootcause13-t1`

## Fixed baseline

- Alembic Main parent: `602be24027a06284d0622e4d0d72fdbcd0831cc8`
- Accepted AlembicCore producer: `f6e3f1956d67fa1d7a0a3440c2931196d9549d06`
- Authorized product scope: Alembic Main only.
- Required consumer: `lib/service/semantic-review/StrictSemanticReviewRuntimeFactory.ts`.

## Ordered execution

1. Prove the current factory is the only Main consumer that imports
   `createProjectContextFileRef` from the frozen
   `@alembic/core/project-context-foundation` facade.
2. Build the accepted Core package and prove the built public interface:
   `@alembic/core/project-context` exports the helper while the foundation
   facade does not.
3. Capture the pre-fix Main build failure at the real TypeScript consumer.
4. Add a narrow source-contract regression that rejects the legacy route and
   requires the public `project-context` route.
5. Change only the helper's import route. Keep legitimate foundation imports
   on foundation and add no fallback, duplicate helper, or second trust path.
6. Run focused semantic-review/trust/recovery tests, build/typecheck, full
   `npm run check`, repository boundary checks, `git diff --check`, and Alembic
   Guard.
7. Perform two-stage review: first against producer/consumer scope and evidence
   contract, then for correctness, compatibility, fail-closed behavior, and
   unrelated edits.
8. Commit one clean Main change and return a `TargetResultEnvelope`.

## Completion boundary

This target proves only the Main consumer migration and preserves the accepted
durable trust and V5 15-receipt/8-group behavior. Final multi-package PC-F
artifact reconstruction and acceptance remain controller-owned.
