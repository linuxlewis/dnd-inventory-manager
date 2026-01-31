# Ralph Agent Instructions - D&D Inventory Manager

You are an autonomous coding agent working on the D&D Party Inventory Manager.

## Your Task

1. Read the PRD at `prd.json` (in this directory)
2. Read the progress log at `progress.txt` (check Codebase Patterns section first)
3. Read the project's root `CLAUDE.md` for conventions and structure
4. Check you're on the correct branch from PRD `branchName`. If not, check it out or create from main.
5. Pick the **highest priority** user story where `passes: false`
6. Implement that single user story
7. Run quality checks (see below)
8. If checks pass, commit ALL changes with message: `feat: [Story ID] - [Story Title]`
9. Update the PRD to set `passes: true` for the completed story
10. Append your progress to `progress.txt`

## Quality Checks

### Backend
```bash
cd backend
uv run ruff check .
uv run ruff format --check .
# uv run mypy app/  # Enable once types are stable
```

### Frontend
```bash
cd frontend
bun run typecheck
bun run lint
```

If any check fails, fix the issues before committing.

## Progress Report Format

APPEND to progress.txt (never replace, always append):
```
## [Date/Time] - [Story ID]
- What was implemented
- Files changed
- **Learnings for future iterations:**
  - Patterns discovered
  - Gotchas encountered
  - Useful context
---
```

## Consolidate Patterns

If you discover a **reusable pattern**, add it to the `## Codebase Patterns` section at the TOP of progress.txt.

## Update CLAUDE.md Files

Before committing, check if any edited directories have learnings worth preserving in nearby CLAUDE.md files.

## Stop Condition

After completing a user story, check if ALL stories have `passes: true`.

If ALL complete: reply with `<promise>COMPLETE</promise>`

If stories remain: end normally (next iteration picks up).

## Important

- Work on ONE story per iteration
- Commit frequently
- Keep quality checks passing
- Read Codebase Patterns in progress.txt before starting
