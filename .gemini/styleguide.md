# D&D Party Inventory Manager - Code Review Style Guide

## Project Overview
This is a web application for managing shared D&D 5e party inventory. It uses:
- **Backend:** Python 3.11+ with FastAPI, Pydantic v2, SQLAlchemy 2.0 (async), SQLite
- **Frontend:** React 18 with TypeScript, Vite, Bun, Tailwind CSS, TanStack Query, Zustand

## Backend Standards

### Python Style
- Follow PEP 8 with 100 character line limit
- Use type hints on all function signatures
- Use async/await for all database operations
- Use Pydantic v2 syntax (no `class Config`, use `model_config` dict instead)

### FastAPI Conventions
- Route handlers should be async
- Use dependency injection for database sessions (`Depends(get_db)`)
- Return Pydantic models, not dicts
- Use HTTPException for errors with appropriate status codes

### Database
- Use SQLAlchemy 2.0 style (`select()`, `scalars()`)
- All models inherit from declarative base
- Use UUID for primary keys
- Include `created_at` and `updated_at` timestamps

### Security
- Never log or return password hashes
- Use bcrypt for password hashing
- Validate all input via Pydantic schemas

## Frontend Standards

### TypeScript
- Strict mode enabled
- Explicit types for function parameters and returns
- Use interfaces for object shapes, types for unions/primitives
- No `any` types

### React
- Functional components only
- Use hooks for state and effects
- Custom hooks in `src/hooks/`
- TanStack Query for server state, Zustand for client state

### Styling
- Tailwind CSS utility classes
- Mobile-first responsive design
- No inline styles

### File Organization
- Pages in `src/pages/`
- Reusable components in `src/components/`
- API functions in `src/api/`
- Stores in `src/stores/`

## Code Review Focus Areas

1. **Type Safety:** Ensure proper TypeScript/Python typing
2. **Error Handling:** Check for proper error states and user feedback
3. **Security:** Watch for exposed secrets, SQL injection, XSS
4. **Performance:** Avoid unnecessary re-renders, optimize queries
5. **Accessibility:** Semantic HTML, ARIA labels where needed
6. **Mobile:** Ensure responsive design works
