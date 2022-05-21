import { app } from 'electron'

app.setAppUserModelId(process.execPath)

app.whenReady().then(() => {})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
