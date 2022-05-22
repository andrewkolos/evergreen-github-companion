import React from 'react'

import { createRoot } from 'react-dom/client'
import { Index } from '.'
console.log('hello from renderer')

const container = document.getElementById('app')
const root = createRoot(container)
// root.render(<Index />)
root.render(<span>hello from react</span>)
