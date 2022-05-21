import { app, BrowserWindow } from 'electron'
import path from 'path'

app.whenReady().then(() => {
  createWindow()

  // https://www.electronjs.org/docs/latest/tutorial/quick-start#open-a-window-if-none-are-open-macos
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  window.loadFile('index.html')
  window.webContents.openDevTools()
}
