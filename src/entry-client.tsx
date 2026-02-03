import { RouterProvider } from '@tanstack/react-router'
import { getRouter } from './router'
import { createRoot } from 'react-dom/client'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found')
}

const root = createRoot(rootElement)
const router = getRouter()

root.render(<RouterProvider router={router} />)
