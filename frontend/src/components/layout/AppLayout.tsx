import { Outlet, Link } from 'react-router-dom'
import { RecentInventorySelector } from './RecentInventorySelector'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <header className="bg-gray-800 border-b border-gray-700 text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl md:text-2xl font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
            <span className="hidden sm:inline">D&D Inventory</span>
            <span className="sm:hidden">D&D Inv</span>
          </Link>
          <RecentInventorySelector />
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
