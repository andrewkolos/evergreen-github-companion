import { BrowserWindow } from 'electron'
import path from 'path'

export const MainWindow = Object.freeze({
  async show() {
    const window = await getWindow()
    window.show()
    window.center()
  },

  /** Try to avoid using this. */
  async get() {
    return getWindow()
  },
})

let window: BrowserWindow | undefined

export async function getWindow(): Promise<BrowserWindow> {
  if (window != null) return window

  window = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // TODO: Enable. https://www.electronjs.org/docs/latest/tutorial/context-isolation
      preload: path.join(__dirname, 'preload.js'),
    },
  })
  window.setMenuBarVisibility(false)
  window.loadFile(`../website/index.html`)
  if (process.env.NODE_ENV === 'development') {
    setTimeout(() => {
      window!.show()
      window!.focus()
      window!.center()
      window!.moveTop()
      window!.setBounds({ x: 2554, y: 0, width: 1280, height: 720 }, true)
      window!.webContents.openDevTools()
    }, 50)
  }
  return window
}
