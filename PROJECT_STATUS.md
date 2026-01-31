# Project Status — D&D Party Inventory Manager

*Last updated: 2026-01-31 16:45 CST*

## Worktrees

| Worktree | Location | Current Branch | Assigned PRD | Status |
|----------|----------|----------------|--------------|--------|
| wt-1 | `../dnd-helper-wt-1` | feat/backend-phase-1 | Backend Phase 1 | 🔀 PR #1 open |
| wt-2 | `../dnd-helper-wt-2` | feat/frontend-phase-1 | Frontend Phase 1 | 🔀 PR #2 open |
| wt-3 | `../dnd-helper-wt-3` | wt-3 | — | 🔲 Available |

---

## Phase 1: Foundation

### Backend (`tasks/phase1/backend.json`) — PR #1
| ID | Story | Status |
|----|-------|--------|
| BE-001 | Backend project scaffolding | ✅ |
| BE-002 | SQLAlchemy async database setup | ✅ |
| BE-003 | Inventory SQLAlchemy model | ✅ |
| BE-004 | Inventory Pydantic schemas | ✅ |
| BE-005 | Create inventory endpoint | ✅ |
| BE-006 | Auth and get inventory endpoints | ✅ |

### Frontend (`tasks/phase1/frontend.json`) — PR #2
| ID | Story | Status |
|----|-------|--------|
| FE-001 | Frontend project scaffolding | ✅ |
| FE-002 | App layout and routing | ✅ |
| FE-003 | API client setup | ✅ |
| FE-004 | Auth store with session persistence | ✅ |
| FE-005 | Home page with create inventory form | ✅ |
| FE-006 | Home page access existing inventory | ✅ |

### SRD Data (`tasks/phase1/srd.json`)
| ID | Story | Status |
|----|-------|--------|
| SRD-001 | Weapons database | 🔲 |
| SRD-002 | Armor database | 🔲 |
| SRD-003 | Potions database | 🔲 |
| SRD-004 | Adventuring gear database | 🔲 |
| SRD-005 | Combined SRD index | 🔲 |

---

## Open PRs

| PR | Branch | Stories | Status |
|----|--------|---------|--------|
| [#1](https://github.com/linuxlewis/dnd-helper/pull/1) | feat/backend-phase-1 | BE-001 → BE-006 | 🔀 Awaiting review |
| [#2](https://github.com/linuxlewis/dnd-helper/pull/2) | feat/frontend-phase-1 | FE-001 → FE-006 | 🔀 Awaiting review |

---

## Legend

- 🔲 Not started
- 🔄 In progress
- ✅ Complete
- 🔀 PR open
- ⏸️ Blocked

---

## Next Steps

1. Review and merge PR #1 (Backend Phase 1)
2. Review and merge PR #2 (Frontend Phase 1)
3. Optionally kick off SRD data (wt-3 available)
4. Plan Phase 2: Items Management
