import cronTime from 'cron-time-generator'
import { Menu, MenuItem, Notification, Tray } from 'electron'
import cron from 'node-cron'
import { MainWindow } from './main-window'
import { MyApi } from '../service/ipc/my-api'
import { DailyCommitStatus } from '../service/ipc/daily-commit-status'

export function setUpTrayIcon() {
  const tray = new Tray('./icon.png')
  const contextMenu = new Menu()

  MyApi.get().then((api) => {
    api.on('DailyCommitStatusChanged', ({ newValue }) => {
      updateIconImage(tray, newValue)
    })
    updateIconImage(tray, api.dailyCommitStatus)
  })

  contextMenu.append(
    new MenuItem({
      label: 'Push next commit now',
      click: async () => (await MyApi.get()).pushNextCommit(),
    }),
  )

  tray.addListener('click', MainWindow.show)

  cron.schedule(cronTime.everyDayAt(21), () => notifyIfNoCommitPushedToday())
}

function updateIconImage(tray: Tray, status: DailyCommitStatus) {
  if (status === DailyCommitStatus.Pushed) {
    tray.setImage('./green.png')
  }
  if (status === DailyCommitStatus.None) {
    tray.setImage('./red.png')
  }
}

async function notifyIfNoCommitPushedToday(): Promise<void> {
  if ((await MyApi.get()).dailyCommitStatus === DailyCommitStatus.Pushed) return
  // eslint-disable-next-line no-new
  new Notification({
    title: 'You have not made a commit today',
    body: 'You have not made a commit today',
  })
}
