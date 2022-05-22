import cronTime from 'cron-time-generator'
import { Menu, MenuItem, Notification, Tray } from 'electron'
import cron from 'node-cron'
import { Scheduler } from '../../service/ipc/scheduler'
import { DailyCommitStatus } from '../../service/ipc/daily-commit-status'
import { MainWindow } from './main-window'

export const TrayIcon = Object.freeze({
  initialize() {
    const tray = new Tray('./icon.png')

    Scheduler.get().then((api) => {
      api.on('DailyCommitStatusChanged', ({ newValue }) => {
        updateIconImage(tray, newValue)
        setTooltipStatusText(newValue, tray)
      })
      updateIconImage(tray, api.dailyCommitStatus)
      const contextMenu = new Menu()
      contextMenu.append(
        new MenuItem({
          label: 'Push next commit now',
          click: async () => api.pushNextCommit(),
        }),
      )
      contextMenu.append(
        new MenuItem({
          label: 'Disable automatic daily pushes',
          type: 'checkbox',
          checked: api.paused,
        }),
      )
      contextMenu.append(
        new MenuItem({
          label: '(Not implemented yet) Set repositories directory',
          click: () => console.log('Set repositories directory was clicked'),
        }),
      )
      tray.setContextMenu(contextMenu)
    })

    tray.addListener('click', MainWindow.show)

    cron.schedule(cronTime.everyDayAt(21), () => notifyIfNoCommitPushedToday())
  },
})

function updateIconImage(tray: Tray, status: DailyCommitStatus) {
  if (status === DailyCommitStatus.Pushed) {
    tray.setImage('./green.png')
  }
  if (status === DailyCommitStatus.None) {
    tray.setImage('./red.png')
  }
}

async function notifyIfNoCommitPushedToday(): Promise<void> {
  if ((await Scheduler.get()).dailyCommitStatus === DailyCommitStatus.Pushed) return
  // eslint-disable-next-line no-new
  new Notification({
    title: 'You have not made a commit today',
    body: 'You have not made a commit today',
  })
}

function setTooltipStatusText(text: string, tray: Tray) {
  tray.setToolTip(`Evergreen Git: ${text}`)
}
