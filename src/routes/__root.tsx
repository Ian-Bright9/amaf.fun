import { createRootRoute, Outlet } from '@tanstack/react-router'

import '../styles.css'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <div>
      <h1 style={{ color: 'white', padding: '20px', background: '#0f0f1a' }}>App is loading!</h1>
      <Outlet />
    </div>
  )
}
