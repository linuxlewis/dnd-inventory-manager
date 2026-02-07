import { useQuery } from '@tanstack/react-query'
import { srdApi } from './client'
import type {
  SearchEquipmentQuery,
  SearchMagicItemsQuery,
} from '../../generated/graphql'

export type SrdEquipmentResult = SearchEquipmentQuery['equipments'][number]
export type SrdMagicItemResult = SearchMagicItemsQuery['magicItems'][number]
export type SrdSearchResult =
  | (SrdEquipmentResult & { source: 'equipment' })
  | (SrdMagicItemResult & { source: 'magic-item' })

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

      return [...equipment, ...magicItems]
    },
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
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
    staleTime: 1000 * 60 * 30, // 30 minutes
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
    staleTime: 1000 * 60 * 30, // 30 minutes
  })
}
