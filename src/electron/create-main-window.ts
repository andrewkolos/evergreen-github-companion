import { BrowserWindow } from 'electron'
import path from 'path'

export function createMainWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  window.setMenuBarVisibility(false)
  window.loadFile(`../website/index.html`)
  if (process.env.NODE_ENV === 'development') {
    setTimeout(() => {
      window.show()
      window.focus()
      window.center()
      window.moveTop()
      window.setBounds({ x: 2554, y: 0, width: 1280, height: 720 }, true)
      window.webContents.openDevTools()
    }, 50)
  }

  return window
}
