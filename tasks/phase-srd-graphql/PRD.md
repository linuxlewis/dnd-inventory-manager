# Phase: SRD GraphQL Integration

## Overview
Replace the current static JSON-based SRD search with live queries to the [5e-bits D&D 5e SRD API](https://www.dnd5eapi.co/graphql) using a type-safe GraphQL client.

## Goals
1. Full-text search across equipment, magic items, and spells
2. Type-safe queries with TypeScript codegen
3. Consistent with existing TanStack Query patterns
4. Rich item details on demand

## API Analysis

### Endpoint
- **GraphQL**: `https://www.dnd5eapi.co/graphql`
- **Playground**: Available for schema exploration

### Key Queries
```graphql
# Equipment (weapons, armor, gear, tools)
equipments(name: String, limit: Int, equipment_category: [FilterFindManyEquipmentCategoryInput!])

# Magic Items
magicItems(name: String, limit: Int, rarity: StringFilterInput)

# Spells (future)
spells(name: String, limit: Int, level: Int, school: StringFilterInput)
```

### Name Filter Behavior
- **Partial matching**: `name: "sword"` matches "Longsword", "Shortsword", "Greatsword"
- **Case insensitive**: `"SWORD"` works same as `"sword"`

## Technology Choice

### Recommendation: graphql-request + TanStack Query + GraphQL Code Generator

**Why this stack:**

| Library | Purpose | Why |
|---------|---------|-----|
| `graphql-request` | Minimal GraphQL client | Lightweight (3kb), no framework lock-in, promise-based |
| `@tanstack/react-query` | Caching & state | Already in use, familiar patterns, handles loading/error states |
| `@graphql-codegen/*` | Type generation | Auto-generate TypeScript types from schema, type-safe queries |

**Alternatives considered:**

| Option | Verdict |
|--------|---------|
| Apollo Client | Overkill - adds 40kb+, own cache layer conflicts with TanStack Query |
| urql | Good but adds another caching layer, less ecosystem than Apollo |
| Bare fetch | No type safety, manual response parsing |

### Why NOT Apollo/urql?
We already have TanStack Query for REST calls. Adding Apollo/urql means:
- Two competing cache systems
- Different patterns for REST vs GraphQL
- Larger bundle size

Using `graphql-request` as a thin fetch wrapper lets TanStack Query handle all caching uniformly.

## Implementation

### 1. Dependencies
```bash
cd frontend
bun add graphql graphql-request
bun add -D @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations @graphql-codegen/typescript-graphql-request
```

### 2. Codegen Config
```yaml
# codegen.yml
schema: "https://www.dnd5eapi.co/graphql"
documents: "src/**/*.graphql"
generates:
  src/generated/graphql.ts:
    plugins:
      - typescript
      - typescript-operations
      - typescript-graphql-request
    config:
      rawRequest: false
      skipTypename: false
```

### 3. Query Definitions
```graphql
# src/api/srd/queries.graphql

query SearchEquipment($name: String!, $limit: Int = 20) {
  equipments(name: $name, limit: $limit) {
    __typename
    ... on Weapon {
      index
      name
      equipment_category { name }
      cost { quantity unit }
      weight
      damage { damage_dice damage_type { name } }
      properties { name }
    }
    ... on Armor {
      index
      name
      equipment_category { name }
      cost { quantity unit }
      weight
      armor_class { base dex_bonus max_bonus }
      stealth_disadvantage
    }
    ... on Gear {
      index
      name
      equipment_category { name }
      cost { quantity unit }
      weight
      desc
    }
  }
}

query SearchMagicItems($name: String!, $limit: Int = 20) {
  magicItems(name: $name, limit: $limit) {
    index
    name
    rarity { name }
    equipment_category { name }
    desc
  }
}

query GetEquipmentByIndex($index: String!) {
  equipment(index: $index) {
    __typename
    ... on Weapon {
      index
      name
      equipment_category { name }
      cost { quantity unit }
      weight
      damage { damage_dice damage_type { name } }
      two_handed_damage { damage_dice damage_type { name } }
      range { normal long }
      properties { name desc }
      desc
    }
    ... on Armor {
      index
      name
      equipment_category { name }
      cost { quantity unit }
      weight
      armor_class { base dex_bonus max_bonus }
      str_minimum
      stealth_disadvantage
      desc
    }
    ... on Gear {
      index
      name
      equipment_category { name }
      cost { quantity unit }
      weight
      desc
    }
  }
}

query GetMagicItemByIndex($index: String!) {
  magicItem(index: $index) {
    index
    name
    rarity { name }
    equipment_category { name }
    desc
    variants { index name }
  }
}
```

### 4. GraphQL Client Setup
```typescript
// src/api/srd/client.ts
import { GraphQLClient } from 'graphql-request'
import { getSdk } from '../../generated/graphql'

const client = new GraphQLClient('https://www.dnd5eapi.co/graphql')
export const srdApi = getSdk(client)
```

### 5. React Query Hooks
```typescript
// src/api/srd/hooks.ts
import { useQuery } from '@tanstack/react-query'
import { srdApi } from './client'

export function useSrdSearch(query: string, enabled = true) {
  return useQuery({
    queryKey: ['srd-search', query],
    queryFn: async () => {
      const [equipment, magicItems] = await Promise.all([
        srdApi.SearchEquipment({ name: query, limit: 15 }),
        srdApi.SearchMagicItems({ name: query, limit: 15 }),
      ])
      return {
        equipment: equipment.equipments ?? [],
        magicItems: magicItems.magicItems ?? [],
      }
    },
    enabled: enabled && query.length >= 2,
    staleTime: 5 * 60 * 1000, // Cache for 5 mins
  })
}

export function useSrdEquipment(index: string) {
  return useQuery({
    queryKey: ['srd-equipment', index],
    queryFn: () => srdApi.GetEquipmentByIndex({ index }),
    enabled: !!index,
    staleTime: 30 * 60 * 1000, // Cache for 30 mins (static data)
  })
}

export function useSrdMagicItem(index: string) {
  return useQuery({
    queryKey: ['srd-magic-item', index],
    queryFn: () => srdApi.GetMagicItemByIndex({ index }),
    enabled: !!index,
    staleTime: 30 * 60 * 1000,
  })
}
```

### 6. npm Scripts
```json
{
  "scripts": {
    "codegen": "graphql-codegen --config codegen.yml",
    "codegen:watch": "graphql-codegen --config codegen.yml --watch"
  }
}
```

## Stories

### FE-030: Setup GraphQL Codegen
- Install dependencies
- Create `codegen.yml` config
- Add npm scripts for codegen
- Generate initial types from schema

**Acceptance:**
- `bun run codegen` generates `src/generated/graphql.ts`
- Types include all SRD equipment/magic item types

### FE-031: Create SRD GraphQL Queries
- Define `.graphql` query files for search and detail fetches
- Regenerate types
- Create `srdApi` client with SDK

**Acceptance:**
- Query files in `src/api/srd/`
- Generated SDK exports typed query functions

### FE-032: Create SRD React Query Hooks
- `useSrdSearch(query)` — combined equipment + magic item search
- `useSrdEquipment(index)` — single equipment detail
- `useSrdMagicItem(index)` — single magic item detail

**Acceptance:**
- Hooks return typed data
- Loading/error states work
- Results cached appropriately

### FE-033: Update AddItemModal to Use Live SRD
- Replace current static SRD search with `useSrdSearch`
- Show equipment and magic items in results
- Handle loading/empty states

**Acceptance:**
- Search returns live results from 5e API
- Typing "sword" shows weapons + magic swords
- Selected item populates form correctly

### FE-034: Remove Static SRD Data
- Delete `backend/app/data/*.json` SRD files
- Remove `/api/srd` backend endpoint
- Remove old frontend SRD API code

**Acceptance:**
- No static SRD files in repo
- Backend SRD endpoint removed
- All SRD data comes from GraphQL

## File Structure
```
frontend/
├── codegen.yml
├── src/
│   ├── api/
│   │   └── srd/
│   │       ├── client.ts      # GraphQL client + SDK
│   │       ├── hooks.ts       # React Query hooks
│   │       └── queries.graphql
│   └── generated/
│       └── graphql.ts         # Auto-generated types
```

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| API rate limiting | Long staleTime caching (5-30 min) |
| API downtime | Graceful error handling, show cached results |
| Schema changes | Pin codegen version, regenerate in CI |
| Bundle size | graphql-request is ~3kb, minimal impact |

## Success Criteria
- Search returns results in <500ms (after cold start)
- TypeScript catches query/response mismatches at build time
- No runtime type errors from API responses
- Consistent UX with existing TanStack Query patterns
