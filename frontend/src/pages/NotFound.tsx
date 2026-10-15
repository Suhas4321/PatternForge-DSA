import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="font-mono text-sm text-faint">404</p>
      <h1 className="mt-2 font-plate text-3xl font-semibold text-chalk">This page isn't on the map</h1>
      <p className="mt-2 text-muted">The link may be from an older version. Head back to the journey and pick up your current trial.</p>
      <Link to="/" className="mt-6 inline-flex rounded-full bg-action px-5 py-2 text-sm font-semibold text-white hover:bg-action-hi">
        Back to the journey
      </Link>
    </div>
  )
}
