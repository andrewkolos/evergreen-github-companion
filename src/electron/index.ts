import CronTime from 'cron-time-generator'
import dotenv from 'dotenv'
import { app, dialog, ipcMain, Notification } from 'electron'
import cron from 'node-cron'
import { inspect } from 'util'
import { DailyCommitStatus } from '../git/daily-commit-status'
import { GitClient } from '../git/git-client'
import { GitHubClient } from '../git/github-client'
import { Branch } from '../git/types/branch'
import { Repo } from '../git/types/repo'
import { Scheduling } from '../git/types/scheduling'
import { IpcChannelName, IpcHandlerParams } from '../ipc/ipc-channels'
import { isToday } from '../is-today'
import { createMainWindow } from './create-main-window'
import { MyTrayIcon } from './set-up-tray-icon'
import { Storage, StorageEntryKeys } from './storage'

dotenv.config()

enum EventSource {
  Main = 'Main',
  Renderer = 'Renderer',
}

app.setAppUserModelId(process.execPath)

app.whenReady().then(async () => {
  if (process.env.NODE_ENV === 'development') {
    Storage.set(StorageEntryKeys.RepositoriesDirectoryPath, 'C:/Users/Jozz/Documents/GitHub/')
  }

  let commitStatus = DailyCommitStatus.Unknown

  const mainWindow = createMainWindow()
  ipcMain.handle(IpcChannelName.DialogOpenDirectory, () => handleDirectorySelect())
  ipcMain.handle(IpcChannelName.ReposDirChanged, (event, ...args: IpcHandlerParams<IpcChannelName.ReposDirChanged>) =>
    handleReposDirChanged(...args),
  )
  ipcMain.handle(
    IpcChannelName.ScheduleReorderedByUser,
    (event, ...args: IpcHandlerParams<IpcChannelName.ScheduleReorderedByUser>) =>
      handleScheduleReorderedByUser(...args),
  )

  const trayIcon = MyTrayIcon.initialize({
    initialPauseCheckboxValue: Storage.get(StorageEntryKeys.Paused),
  })
  trayIcon
    .on('IconClicked', () => mainWindow.show)
    .on('PauseCheckBoxClicked', (value) => handlePausedToggle(value, EventSource.Main))
    .on('PushNextCommitButtonClicked', () => {
      throw Error('Not implemented yet')
    })

  let schedule = await initializeSchedule()
  if (schedule) {
    sendToMainWindow(IpcChannelName.ScheduleUpdated, schedule)
  }

  cron.schedule(CronTime.every(5).minutes(), poll)
  poll()

  cron.schedule(CronTime.everyDayAt(22, 0), () => {})

  async function poll() {
    if (commitStatus === DailyCommitStatus.None) {
      if (schedule && schedule.length > 0) {
        const next = schedule.shift()
        if (!next) throw Error()
        await pushNextCommit(next.repo, next.branch)
      }
    }

    const nextStatus = await GitHubClient.getTodaysCommitStatus()
    notifyOfNoCommitForToday(commitStatus)
    commitStatus = nextStatus
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

  async function handlePausedToggle(value: boolean, source: EventSource): Promise<void> {
    Storage.set(StorageEntryKeys.Paused, value)

    if (source === EventSource.Main) {
      sendToMainWindow(IpcChannelName.PausedChanged, value)
    } else if (source === EventSource.Renderer) {
      trayIcon.notifyOfEvent(IpcChannelName.PausedChanged, value)
    } else {
      throw Error(`Unrecognized event source '${source}'`)
    }
  }

  async function handleReposDirChanged(value: string) {
    Storage.set(StorageEntryKeys.RepositoriesDirectoryPath, value)
    const newSchedule = await new GitClient(value).createSchedule()
    const params: IpcHandlerParams<IpcChannelName.ScheduleUpdated> = [newSchedule]
    sendToMainWindow(IpcChannelName.ScheduleUpdated, ...params)
  }

  async function handleScheduleReorderedByUser(value: Scheduling[]) {
    console.log(`Schedule reordered by user: ${inspect(value)}`)
    Storage.set(StorageEntryKeys.Schedule, value)
    sendToMainWindow(IpcChannelName.ScheduleUpdated, value)
  }

  async function pushNextCommit(repo: Repo, branch: Branch) {
    const commit = schedule?.find(
      (scheduling) => scheduling.repo.name === repo.name && scheduling.branch.name === branch.name,
    )

    if (commit == null) {
      throw Error(`Tried to push the next commit for ${repo}/${branch}, but it could not be found.`)
    }

    await new GitClient(repo.localPath).pushNextCommit({ repoPath: repo.localPath, branchName: branch.name })

    schedule = await initializeSchedule()
    commitStatus = DailyCommitStatus.Pushed
    sendToMainWindow(IpcChannelName.ScheduleUpdated, schedule ?? [])
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
    // eslint-disable-next-line no-new
    new Notification({
      title: 'You have not made a commit today',
    })
    lastTimeNotified = new Date()
  }
}
