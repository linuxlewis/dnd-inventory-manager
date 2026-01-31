import { useParams } from 'react-router-dom'

export function Inventory() {
  const { slug } = useParams<{ slug: string }>()

  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold text-gray-900">Inventory: {slug}</h1>
      <p className="mt-4 text-gray-600">Inventory details will appear here.</p>
    </div>
  )
}
