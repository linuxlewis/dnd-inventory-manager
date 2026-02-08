# Project Status — D&D Party Inventory Manager

*Last updated: 2026-01-31 17:08 CST*

## Worktrees

| Worktree | Location | Current Branch | Assigned PRD | Status |
|----------|----------|----------------|--------------|--------|
| wt-1 | `../dnd-inventory-manager-wt-1` | — | — | 🔲 Available |
| wt-2 | `../dnd-inventory-manager-wt-2` | — | — | 🔲 Available |
| wt-3 | `../dnd-inventory-manager-wt-3` | — | — | 🔲 Available |

---

## Phase 1: Foundation ✅

### Backend (`tasks/phase1/backend.json`) — Merged
| ID | Story | Status |
|----|-------|--------|
| BE-001 | Backend project scaffolding | ✅ |
| BE-002 | SQLAlchemy async database setup | ✅ |
| BE-003 | Inventory SQLAlchemy model | ✅ |
| BE-004 | Inventory Pydantic schemas | ✅ |
| BE-005 | Create inventory endpoint | ✅ |
| BE-006 | Auth and get inventory endpoints | ✅ |

### Frontend (`tasks/phase1/frontend.json`) — Merged
| ID | Story | Status |
|----|-------|--------|
| FE-001 | Frontend project scaffolding | ✅ |
| FE-002 | App layout and routing | ✅ |
| FE-003 | API client setup | ✅ |
| FE-004 | Auth store with session persistence | ✅ |
| FE-005 | Home page with create inventory form | ✅ |
| FE-006 | Home page access existing inventory | ✅ |

---

## Infra Phase (Current)

### API Tests (`tasks/infra/api-tests.json`)
| ID | Story | Status |
|----|-------|--------|
| TEST-001 | Pytest project setup | 🔲 |
| TEST-002 | Test fixtures for database and client | 🔲 |
| TEST-003 | Health endpoint test | 🔲 |
| TEST-004 | Create inventory endpoint tests | 🔲 |
| TEST-005 | Auth and get inventory endpoint tests | 🔲 |

### Dev Tooling (`tasks/infra/dev-tooling.json`)
| ID | Story | Status |
|----|-------|--------|
| DEV-001 | Port discovery script | 🔲 |
| DEV-002 | Local environment setup script | 🔲 |
| DEV-003 | Unified dev runner | 🔲 |
| DEV-004 | CLAUDE.md documentation update | 🔲 |

### Docker Deployment (`tasks/infra/docker-local.json`)
| ID | Story | Status |
|----|-------|--------|
| DOCKER-001 | Backend Dockerfile | 🔲 |
| DOCKER-002 | Frontend Dockerfile | 🔲 |
| DOCKER-003 | Docker Compose configuration | 🔲 |
| DOCKER-004 | Tailnet access documentation | 🔲 |
| DOCKER-005 | Environment configuration for Docker | 🔲 |
| DOCKER-006 | Production start/stop scripts | 🔲 |

---

## Backlog

### SRD Data (`tasks/phase1/srd.json`)
| ID | Story | Status |
|----|-------|--------|
| SRD-001 | Weapons database | 🔲 |
| SRD-002 | Armor database | 🔲 |
| SRD-003 | Potions database | 🔲 |
| SRD-004 | Adventuring gear database | 🔲 |
| SRD-005 | Combined SRD index | 🔲 |

### Phase 2: Items Management
*Stories to be detailed after Infra phase. See IMPLEMENTATION.md.*

---

## Port Configuration

**Development (dynamic):** Ports assigned by `scripts/dev-setup.sh`
- Backend: 8000-8099 range
- Frontend: 5173-5199 range

**Production (Docker):**
- Backend: 9000
- Frontend: 9080
- Access via Tailscale IP: `http://<tailscale-ip>:9080`

---

## Legend

- 🔲 Not started
- 🔄 In progress
- ✅ Complete
- 🔀 PR open
- ⏸️ Blocked

---

## Next Steps

1. Kick off API tests (wt-1)
2. Kick off Dev tooling (wt-2)
3. Kick off Docker deployment (wt-3)
4. All three can run in parallel
