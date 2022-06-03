import { BrowserWindow, screen } from 'electron'
import path from 'path'

export const MainWindow = Object.freeze({
  async show() {
    const window = await getWindow()
    window.show()
    window.center()
  },
})

let _window: BrowserWindow | undefined

async function getWindow(): Promise<BrowserWindow> {
  if (_window != null) return _window

  _window = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // TODO: Enable. https://www.electronjs.org/docs/latest/tutorial/context-isolation
      preload: path.join(__dirname, 'preload.js'),
    },
  })
  _window.setMenuBarVisibility(false)
  _window.loadFile(`../website/index.html`)
  if (process.env.NODE_ENV === 'development') {
    _window.show()
    _window.focus()
    _window.center()
    _window.moveTop()
    if (screen.getAllDisplays().length === 3) {
      // _window.setBounds({ x: 2554, y: 0, width: 1280, height: 720 }, true)
      _window.setBounds(screen.getAllDisplays()[1].bounds)
    }
    _window.webContents.openDevTools()
  }
  return _window
}
