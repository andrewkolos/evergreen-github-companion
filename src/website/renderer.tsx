import React from 'react'
import { createRoot } from 'react-dom/client'
import { Index } from './index'
import './index.css'

const container = document.getElementById('app')
if (container == null) {
  throw Error(`Could not find container element to render application to.`)
}
const root = createRoot(container)
root.render(<Index api={window.myApi} />)
