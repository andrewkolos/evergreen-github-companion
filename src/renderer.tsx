import React from 'react'
import { createRoot } from 'react-dom/client'
import { Index } from './website/index'
import './website/index.css'

const container = document.getElementById('app')
if (container == null) {
  throw Error(`Could not find container element to render application to.`)
}
const root = createRoot(container)

// eslint-disable-next-line import/newline-after-import
root.render(
  // Index({
  //   api: window.ipcApi,
  //   initialReposDir: window.initialReposDir,
  // }),
  <Index api={window.ipcApi} initialReposDir={window.initialReposDir} />,
)
