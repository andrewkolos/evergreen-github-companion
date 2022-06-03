/* eslint-disable import/first -- Need to be able to quit ASAP if we are running from Squirrel setup. */
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
import { app, BrowserWindow, dialog, ipcMain, Notification } from 'electron'

// eslint-disable-next-line
const isSquirrel = require('electron-squirrel-startup') as boolean

if (isSquirrel || process.cwd().toLowerCase().includes('squirrel')) {
  app.quit()
}

import unhandled from 'electron-unhandled'

unhandled()

import CronTime from 'cron-time-generator'
import dotenv from 'dotenv'

import cron from 'node-cron'
import dedent from 'ts-dedent'
import { inspect } from 'util'
import { DailyCommitStatus } from './git/daily-commit-status'
import { Repo } from './git/types/repo'
import { IpcChannelName, IpcHandlerParams } from './ipc/ipc-channels'
import { isToday } from './is-today'
import { createMainWindow } from './main/create-main-window'
import { getDailyCommitStatus } from './main/get-daily-commit-status'
import { MyTrayIcon } from './main/set-up-tray-icon'
import { Storage, StorageEntryKeys } from './main/storage'
import { getReposWithUnpushedCommits } from './git/get-repos-with-unpushed-commits'
import { pushNextCommit } from './git/push-next-commit'

dotenv.config()

app.on('ready', () => app.setAppUserModelId(process.execPath))

void app.whenReady().then(async () => {
  new Notification({
    body: process.cwd(),
  }).show()
  const mainWindow = createMainWindow()
  wireRendererIpc()

  const trayIcon = MyTrayIcon.initialize({
    initialPauseCheckboxValue: Storage.get(StorageEntryKeys.Paused),
  })
  trayIcon
    .on('IconClicked', () => mainWindow.show)
    .on('PauseCheckBoxClicked', (value) => {
      void handlePausedToggle(value)
    })
    .on('PushNextCommitButtonClicked', () => {
      throw Error('Not implemented yet')
    })

  cron.schedule(CronTime.every(5).minutes(), () => update())
  sendToMainWindow(IpcChannelName.PausedChanged, Storage.get(StorageEntryKeys.Paused))

  function wireRendererIpc() {
    ipcMain.handle(IpcChannelName.DialogOpenDirectory, () => handleDirectorySelect())
    ipcMain.handle(
      IpcChannelName.ReposDirChanged,
      (_event, ...args: IpcHandlerParams<IpcChannelName.ReposDirChanged>) => handleReposDirChanged(...args),
    )
    ipcMain.handle(
      IpcChannelName.ScheduleReorderedByUser,
      (_event, ...args: IpcHandlerParams<IpcChannelName.ScheduleReorderedByUser>) =>
        handleScheduleReorderedByUser(...args),
    )
    ipcMain.handle(IpcChannelName.PausedChanged, (_event, ...args: IpcHandlerParams<IpcChannelName.PausedChanged>) =>
      handlePausedToggle(...args),
    )
    ipcMain.handle(IpcChannelName.UiReady, () => {
      sendToMainWindow(IpcChannelName.ScheduleUpdated, Storage.get(StorageEntryKeys.Schedule) ?? [])
      void update()
    })
    ipcMain.handle(
      IpcChannelName.GitHubUsernameChanged,
      (_event, ...args: IpcHandlerParams<IpcChannelName.GitHubUsernameChanged>) => {
        Storage.set(StorageEntryKeys.GitHubUsername, args[0])
      },
    )
  }

  async function update() {
    console.log('Updating...')

    const gitHubUsername = Storage.get(StorageEntryKeys.GitHubUsername)
    if (gitHubUsername == null) {
      console.log('update: No GitHub username has been set. Stopping update.')
      return
    }

    const currentStatus = await getDailyCommitStatus(gitHubUsername)
    const schedule = Storage.get(StorageEntryKeys.Schedule)?.slice()

    if (currentStatus === DailyCommitStatus.None) {
      if (schedule && schedule.length > 0) {
        const next = schedule.shift()
        if (!next) throw Error()
        await pushNextCommitAndUpdateSchedule(next)

        new Notification({
          title: 'Pushed daily commit',
          body: dedent`Pushed the next commit of: ${next.name}/${next.mainBranchName},
            ${next.unpushedCommits[0].message}`,
        }).show()
      }
    } else {
      console.log(`No scheduled items to commit.`)
    }

    const nextStatus = await getDailyCommitStatus(gitHubUsername)
    if (nextStatus === DailyCommitStatus.None && currentStatus === nextStatus) {
      await notifyOfNoCommitForToday(nextStatus)
      sendToMainWindow(IpcChannelName.DailyCommitStatusChanged, nextStatus)
      trayIcon.notifyOfEvent(IpcChannelName.DailyCommitStatusChanged, nextStatus)
    }
  }

  async function handleDirectorySelect(): Promise<string | undefined> {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
    })
    if (canceled) return undefined
    return filePaths[0]
  }

  async function handlePausedToggle(value: boolean): Promise<void> {
    Storage.set(StorageEntryKeys.Paused, value)

    sendToMainWindow(IpcChannelName.PausedChanged, value)
    trayIcon.notifyOfEvent(IpcChannelName.PausedChanged, value)
  }

  async function handleReposDirChanged(newReposDir: string) {
    Storage.set(StorageEntryKeys.RepositoriesDirectoryPath, newReposDir)
    const newSchedule = await getReposWithUnpushedCommits(newReposDir)
    const params: IpcHandlerParams<IpcChannelName.ScheduleUpdated> = [newSchedule]
    sendToMainWindow(IpcChannelName.ScheduleUpdated, ...params)
  }

  async function handleScheduleReorderedByUser(value: Repo[]) {
    Storage.set(StorageEntryKeys.Schedule, value)
    sendToMainWindow(IpcChannelName.ScheduleUpdated, value)
  }

  async function pushNextCommitAndUpdateSchedule(repo: Repo) {
    const path = Storage.get(StorageEntryKeys.RepositoriesDirectoryPath)

    if (path == null) {
      throw Error()
    }

    await pushNextCommit(repo)

    const newSchedule = await initializeSchedule()
    sendToMainWindow(IpcChannelName.ScheduleUpdated, newSchedule ?? [])
    sendToMainWindow(IpcChannelName.DailyCommitStatusChanged, DailyCommitStatus.Pushed)
  }

  function sendToMainWindow<C extends IpcChannelName>(channel: C, ...args: IpcHandlerParams<C>) {
    console.log(`Sending message to main window: ${channel}, ${args}`)
    mainWindow.webContents.send(channel, ...args)
  }
})

async function initializeSchedule(): Promise<Repo[] | undefined> {
  const dir = Storage.get(StorageEntryKeys.RepositoriesDirectoryPath)
  if (dir == null) return undefined
  const result = await getReposWithUnpushedCommits(dir)
  console.log(`Initialized schedule: ${inspect(result)}`)
  return result
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

let lastTimeNotified = new Date()
async function notifyOfNoCommitForToday(commitStatus: DailyCommitStatus): Promise<void> {
  if (commitStatus !== DailyCommitStatus.None) return

  if (new Date().getHours() > 20 && !isToday(lastTimeNotified)) {
    new Notification({
      title: 'You have not made a commit today',
    }).show()
    lastTimeNotified = new Date()
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow()
  }
})
