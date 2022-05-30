import cronTime from 'cron-time-generator'
import { BrowserWindow, Notification, Tray, screen } from 'electron'
import cron from 'node-cron'
import { GitHubClient } from '../service/git/github-client'
import { isToday } from '../is-today'

export function setUpTrayIcon() {
  const tray = new Tray('./icon.png')
  // const contextMenu = Menu.buildFromTemplate([{ label: 'About', type: 'normal', click: () => createWindow() }])
  // tray.setContextMenu(contextMenu)

  tray.addListener('click', createWindow)
  createWindow()

  cron.schedule(cronTime.every(5).minutes(), () => checkForDailyCommit(tray))
}

let lastKnownCommitDate: Date | undefined
let lastShownNotificationDate: Date | undefined

async function checkForDailyCommit(tray: Tray): Promise<void> {
  if (lastKnownCommitDate != null && isToday(lastKnownCommitDate)) return

  const commits = await GitHubClient.getTodaysCommits()
  if (commits.length > 0) {
    tray.setImage('./green.png')
    lastKnownCommitDate = new Date()
  } else {
    if (lastShownNotificationDate != null && isToday(lastShownNotificationDate)) return
    const now = new Date()
    // eslint-disable-next-line no-new
    new Notification({
      title: 'You have not made a commit today',
      body: 'You have not made a commit today',
    })
    lastShownNotificationDate = now
    tray.setImage('./red.png')
  }
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: './preload.js',
    },
  })
  window.setMenuBarVisibility(false)
  window.loadFile(`../website/index.html`)
  if (process.env.NODE_ENV === 'development') {
    const testDisplay = screen.getAllDisplays()[1]
    setTimeout(() => {
      window.show()
      window.focus()
      window.center()
      window.moveTop()
      window.setBounds(
        {
          height: testDisplay.bounds.height / 2,
          width: testDisplay.bounds.width / 2,
          x: testDisplay.bounds.x / 2,
          y: testDisplay.bounds.y / 2,
        },
        true,
      )
      window.webContents.openDevTools()
    }, 1000)
  }
}
