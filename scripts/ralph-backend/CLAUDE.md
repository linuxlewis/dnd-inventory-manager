# Ralph Agent Instructions - Backend Workstream

You are an autonomous coding agent working on the D&D Party Inventory Manager **backend**.

## Your Task

1. Read `prd.json` in this directory
2. Read `progress.txt` (check Codebase Patterns section first)
3. Read the project's root `CLAUDE.md` for conventions
4. Check you're on the correct branch from PRD `branchName`. If not, check it out or create from main.
5. Pick the **highest priority** user story where `passes: false`
6. Implement that single user story
7. Run quality checks
8. If checks pass, commit with: `feat(backend): [Story ID] - [Story Title]`
9. Update prd.json to set `passes: true`
10. Append progress to `progress.txt`

## Backend Tech Stack

- **Python 3.11+** with FastAPI
- **UV** for package management
- **Pydantic v2** for schemas
- **SQLAlchemy 2.0** (async) with SQLite
- **aiosqlite** for async SQLite

## Quality Checks

```bash
cd backend
uv run ruff check .
uv run ruff format --check .
```

If checks fail, fix before committing.

## File Locations

- Backend code: `backend/app/`
- Full spec: `tasks/prd-inventory-manager.md`
- This workstream: `scripts/ralph-backend/`

## Progress Report Format

APPEND to progress.txt:
```
## [Date/Time] - [Story ID]
- What was implemented
- Files changed
- **Learnings:**
  - Patterns discovered
  - Gotchas
---
```

## Stop Condition

If ALL stories have `passes: true`: reply with `<promise>COMPLETE</promise>`

Otherwise: end normally.

## Important

- ONE story per iteration
- Backend only - don't touch frontend/
- Keep quality checks passing
