import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'
import '@fontsource/ibm-plex-sans-condensed/500.css'
import '@fontsource/ibm-plex-sans-condensed/600.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/600.css'
import './index.css'

import { lazy, StrictMode, Suspense, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App'
import Dashboard from './pages/Dashboard'
import WorldPage from './pages/WorldPage'
import PatternFinder from './pages/PatternFinder'
import NotFound from './pages/NotFound'
import { Spinner } from './components/ui'

// The editor pages pull in Monaco (several MB); load them only when visited.
const QuestionPage = lazy(() => import('./pages/QuestionPage'))
const Playground = lazy(() => import('./pages/Playground'))
const withSpinner = (el: ReactNode) => (
  <Suspense fallback={<div className="p-8"><Spinner label="Loading the editor" /></div>}>{el}</Suspense>
)

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'world/:id', element: <WorldPage /> },
      { path: 'q/:slug', element: withSpinner(<QuestionPage />) },
      { path: 'playground', element: withSpinner(<Playground />) },
      { path: 'finder', element: <PatternFinder /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
