import { useQuery } from '@tanstack/react-query'
import { srdApi } from './client'
import type {
  SearchEquipmentQuery,
  SearchMagicItemsQuery,
  GetEquipmentByIndexQuery,
  GetMagicItemByIndexQuery,
} from '../../generated/graphql'

// Derive types from generated query types — always in sync with queries.graphql
export type SrdEquipmentResult = SearchEquipmentQuery['equipments'][number] & { source: 'equipment' }
export type SrdMagicItemResult = SearchMagicItemsQuery['magicItems'][number] & { source: 'magic-item' }
export type SrdSearchResult = SrdEquipmentResult | SrdMagicItemResult

export type SrdEquipmentDetail = NonNullable<GetEquipmentByIndexQuery['equipment']>
export type SrdMagicItemDetail = NonNullable<GetMagicItemByIndexQuery['magicItem']>

export function useSrdSearch(query: string) {
  return useQuery({
    queryKey: ['srd-search', query],
    queryFn: async (): Promise<SrdSearchResult[]> => {
      const [equipmentData, magicItemsData] = await Promise.all([
        srdApi.SearchEquipment({ name: query }),
        srdApi.SearchMagicItems({ name: query }),
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
      const data = await srdApi.GetEquipmentByIndex({ index: index! })
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
      const data = await srdApi.GetMagicItemByIndex({ index: index! })
      return data.magicItem ?? null
    },
    enabled: !!index,
    staleTime: 1000 * 60 * 30,
  })
}
