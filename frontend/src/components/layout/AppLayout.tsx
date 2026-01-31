import { Outlet, Link } from 'react-router-dom'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-indigo-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="text-xl md:text-2xl font-bold hover:text-indigo-200 transition-colors">
            <span className="hidden sm:inline">D&D Inventory</span>
            <span className="sm:hidden">D&D Inv</span>
          </Link>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
