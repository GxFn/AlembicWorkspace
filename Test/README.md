# Internal Test Coordination Workspace

Use this directory when the user does not have an external Test repository.

- Test boundary machine cards: `<state-root>/test-cards/*.json`
- Test exchange projection: `.workspace-active/workspace/current/test-exchange.md`
- Local rules: `AGENTS.md`
- Documentation index: `docs/README.md`
- Current Test work: `docs/current/`
- Default config: `config/defaults.json`
- Test-owned scripts: `scripts/`
- Script wrappers: `package.json`
- Test-local skill notes: `skills/`
- Testing operation policy: `docs/testing-operation-policy.md`
- Legacy AlembicTest map: `docs/legacy-alembic-test-map.md`
- Test handoff template: `templates/test-handoff-template.md`
- Rule: only run real test work when a controller state root assigns a matching task package and test card.
