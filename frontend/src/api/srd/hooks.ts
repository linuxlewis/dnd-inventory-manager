import { useQuery } from '@tanstack/react-query'
import { GraphQLClient } from 'graphql-request'

const client = new GraphQLClient('https://www.dnd5eapi.co/graphql')

// Direct queries without codegen SDK for reliability
const SEARCH_EQUIPMENT = `
  query SearchEquipment($name: String!) {
    equipments(name: $name) {
      __typename
      ... on IEquipment {
        index
        name
        cost { quantity unit }
        weight
        desc
      }
      ... on Weapon {
        weapon_category
        damage { damage_dice damage_type { name } }
        properties { name }
      }
      ... on Armor {
        armor_category
        armor_class { base dex_bonus }
      }
      ... on Gear {
        equipment_category { name }
      }
    }
  }
`

const SEARCH_MAGIC_ITEMS = `
  query SearchMagicItems($name: String!) {
    magicItems(name: $name) {
      index
      name
      desc
      rarity { name }
      equipment_category { name }
    }
  }
`

// Types
export interface SrdEquipmentResult {
  __typename?: string
  index: string
  name: string
  cost?: { quantity: number; unit: string }
  weight?: number | null
  desc?: string[] | null
  weapon_category?: string
  damage?: { damage_dice: string; damage_type?: { name: string } | null } | null
  properties?: { name: string }[] | null
  armor_category?: string
  armor_class?: { base: number; dex_bonus: boolean } | null
  equipment_category?: { name: string }
  source: 'equipment'
}

export interface SrdMagicItemResult {
  index: string
  name: string
  desc: string[]
  rarity: { name: string }
  equipment_category: { name: string }
  source: 'magic-item'
}

export type SrdSearchResult = SrdEquipmentResult | SrdMagicItemResult

export function useSrdSearch(query: string) {
  return useQuery({
    queryKey: ['srd-search', query],
    queryFn: async (): Promise<SrdSearchResult[]> => {
      const [equipmentData, magicItemsData] = await Promise.all([
        client.request<{ equipments: Omit<SrdEquipmentResult, 'source'>[] }>(
          SEARCH_EQUIPMENT,
          { name: query }
        ),
        client.request<{ magicItems: Omit<SrdMagicItemResult, 'source'>[] }>(
          SEARCH_MAGIC_ITEMS,
          { name: query }
        ),
      ])

      const equipment: SrdSearchResult[] = equipmentData.equipments.map(
        (item) => ({ ...item, source: 'equipment' as const })
      )
      const magicItems: SrdSearchResult[] = magicItemsData.magicItems.map(
        (item) => ({ ...item, source: 'magic-item' as const })
      )

      const combined = [...equipment, ...magicItems]

      // Deduplicate: if same name appears with "Varies" rarity and a specific rarity, keep the specific one
      const byName = new Map<string, SrdSearchResult[]>()
      for (const item of combined) {
        const list = byName.get(item.name) || []
        list.push(item)
        byName.set(item.name, list)
      }

      const deduped: SrdSearchResult[] = []
      for (const [, items] of byName) {
        if (items.length > 1) {
          // Prefer items without "Varies" rarity
          const specific = items.filter(
            (i) => i.source !== 'magic-item' || (i as SrdMagicItemResult).rarity?.name !== 'Varies'
          )
          deduped.push(...(specific.length > 0 ? specific : [items[0]]))
        } else {
          deduped.push(items[0])
        }
      }

      return deduped
    },
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5,
  })
}

export function useSrdEquipment(index: string | undefined) {
  return useQuery({
    queryKey: ['srd-equipment', index],
    queryFn: async () => {
      const data = await client.request<{ equipment: SrdEquipmentResult }>(
        `query ($index: String!) {
          equipment(index: $index) {
            ... on IEquipment { index name cost { quantity unit } weight desc }
            ... on Weapon { weapon_category damage { damage_dice damage_type { name } } properties { name } }
            ... on Armor { armor_category armor_class { base dex_bonus } }
            ... on Gear { equipment_category { name } }
          }
        }`,
        { index: index! }
      )
      return data.equipment ?? null
    },
    enabled: !!index,
    staleTime: 1000 * 60 * 30,
  })
}

export function useSrdMagicItem(index: string | undefined) {
  return useQuery({
    queryKey: ['srd-magic-item', index],
    queryFn: async () => {
      const data = await client.request<{ magicItem: SrdMagicItemResult }>(
        `query ($index: String!) {
          magicItem(index: $index) {
            index name desc
            rarity { name }
            equipment_category { name }
          }
        }`,
        { index: index! }
      )
      return data.magicItem ?? null
    },
    enabled: !!index,
    staleTime: 1000 * 60 * 30,
  })
}
