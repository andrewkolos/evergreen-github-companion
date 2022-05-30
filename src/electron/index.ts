import { app } from 'electron'
import { setUpTrayIcon } from './set-up-tray-icon'

app.setAppUserModelId(process.execPath)

app.whenReady().then(() => {
  setUpTrayIcon()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
