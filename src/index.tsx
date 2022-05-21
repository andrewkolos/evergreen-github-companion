// src/react.tsx
import * as React from 'react'
import * as ReactDOM from 'react-dom/client'
const Index = () => {
  return <div>Hello React!</div>
}
const container = document.getElementById('app')
const root = ReactDOM.createRoot(container)
root.render(<Index />)
