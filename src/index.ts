// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit()
}

import CronTime from 'cron-time-generator'
import dotenv from 'dotenv'
import { app, BrowserWindow, dialog, ipcMain, Notification } from 'electron'
import cron from 'node-cron'
import dedent from 'ts-dedent'
import { DailyCommitStatus } from './git/daily-commit-status'
import { GitClient } from './git/git-client'
import { GitHubClient } from './git/github-client'
import { Branch } from './git/types/branch'
import { Repo } from './git/types/repo'
import { Scheduling } from './git/types/scheduling'
import { IpcChannelName, IpcHandlerParams } from './ipc/ipc-channels'
import { isToday } from './is-today'
import { createMainWindow } from './main/create-main-window'
import { getDailyCommitStatus } from './main/get-daily-commit-status'
import { MyTrayIcon } from './main/set-up-tray-icon'
import { Storage, StorageEntryKeys } from './storage'

dotenv.config()

app.on('ready', () => app.setAppUserModelId(process.execPath))
app.whenReady().then(async () => {
  const mainWindow = createMainWindow()
  ipcMain.handle(IpcChannelName.DialogOpenDirectory, () => handleDirectorySelect())
  ipcMain.handle(IpcChannelName.ReposDirChanged, (_event, ...args: IpcHandlerParams<IpcChannelName.ReposDirChanged>) =>
    handleReposDirChanged(...args),
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
    sendToMainWindow(IpcChannelName.ScheduleUpdated, Storage.get(StorageEntryKeys.Schedule))
    update()
  })

  const trayIcon = MyTrayIcon.initialize({
    initialPauseCheckboxValue: Storage.get(StorageEntryKeys.Paused),
  })
  trayIcon
    .on('IconClicked', () => mainWindow.show)
    .on('PauseCheckBoxClicked', (value) => handlePausedToggle(value))
    .on('PushNextCommitButtonClicked', () => {
      throw Error('Not implemented yet')
    })

  initializeSchedule().then((value) => {
    if (value) {
      Storage.set(StorageEntryKeys.Schedule, value)
      sendToMainWindow(IpcChannelName.ScheduleUpdated, value)
    }
  })

  cron.schedule(CronTime.every(5).minutes(), update)

  cron.schedule(CronTime.everyDayAt(22, 0), () => {})

  async function update() {
    console.log('Updating...')
    const schedule = Storage.get(StorageEntryKeys.Schedule)?.slice()
    if ((await getDailyCommitStatus()) === DailyCommitStatus.None) {
      if (schedule && schedule.length > 0) {
        const next = schedule.shift()
        if (!next) throw Error()
        await pushNextCommit(next.repo, next.branch)

        new Notification({
          title: 'Pushed daily commit',
          body: dedent`Pushed the next commit of: ${next.repo.name}/${next.branch.name}?.
            Commit name: ${next.branch.unpushedCommits[0]}`,
        }).show()
      }
    }

    sendToMainWindow(IpcChannelName.PausedChanged, Storage.get(StorageEntryKeys.Paused))

    const nextStatus = await GitHubClient.getTodaysCommitStatus()
    notifyOfNoCommitForToday(nextStatus)
    sendToMainWindow(IpcChannelName.DailyCommitStatusChanged, nextStatus)
    trayIcon.notifyOfEvent(IpcChannelName.DailyCommitStatusChanged, nextStatus)
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

  async function handleReposDirChanged(value: string) {
    Storage.set(StorageEntryKeys.RepositoriesDirectoryPath, value)
    const newSchedule = await new GitClient(value).createSchedule()
    const params: IpcHandlerParams<IpcChannelName.ScheduleUpdated> = [newSchedule]
    sendToMainWindow(IpcChannelName.ScheduleUpdated, ...params)
  }

  async function handleScheduleReorderedByUser(value: Scheduling[]) {
    Storage.set(StorageEntryKeys.Schedule, value)
    sendToMainWindow(IpcChannelName.ScheduleUpdated, value)
  }

  async function pushNextCommit(repo: Repo, branch: Branch) {
    const schedule = Storage.get(StorageEntryKeys.Schedule)
    const commit = schedule?.find(
      (scheduling) => scheduling.repo.name === repo.name && scheduling.branch.name === branch.name,
    )

    if (commit == null) {
      throw Error(`Tried to push the next commit for ${repo}/${branch}, but it could not be found.`)
    }

    const path = Storage.get(StorageEntryKeys.RepositoriesDirectoryPath)
    if (path == null) throw Error()

    await new GitClient(path).pushNextCommit({ repoPath: repo.localPath, branchName: branch.name })

    const newSchedule = await initializeSchedule()
    sendToMainWindow(IpcChannelName.ScheduleUpdated, newSchedule ?? [])
    sendToMainWindow(IpcChannelName.DailyCommitStatusChanged, DailyCommitStatus.Pushed)
  }

  function sendToMainWindow<C extends IpcChannelName>(channel: C, ...args: IpcHandlerParams<C>) {
    mainWindow.webContents.send(channel, ...args)
  }
})

async function initializeSchedule(): Promise<Scheduling[] | undefined> {
  const dir = Storage.get(StorageEntryKeys.RepositoriesDirectoryPath)
  if (!dir) return undefined
  return new GitClient(dir).createSchedule()
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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.