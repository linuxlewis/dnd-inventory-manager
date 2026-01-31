import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900">404 - Page Not Found</h1>
      <p className="mt-4 text-gray-600">The page you're looking for doesn't exist.</p>
      <Link 
        to="/" 
        className="mt-6 inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Go Home
      </Link>
    </div>
  )
}
