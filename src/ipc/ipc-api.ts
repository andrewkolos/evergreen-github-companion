import { ipcRenderer, IpcRendererEvent } from 'electron'
import { IpcChannelName, IpcHandler, IpcHandlerParams } from './ipc-channels'

const mainToRenderer = {
  onScheduleChanged: (
    callback: (event: IpcRendererEvent, ...args: IpcHandlerParams<IpcChannelName.ScheduleUpdated>) => void,
  ) => ipcRenderer.on(IpcChannelName.ScheduleUpdated, callback),
  onDailyCommitStatusChanged: (
    callback: (event: IpcRendererEvent, ...args: IpcHandlerParams<IpcChannelName.DailyCommitStatusChanged>) => void,
  ) => ipcRenderer.on(IpcChannelName.DailyCommitStatusChanged, callback),
  onCommitPushed: (
    callback: (event: IpcRendererEvent, ...args: IpcHandlerParams<IpcChannelName.CommitPushed>) => void,
  ) => ipcRenderer.on(IpcChannelName.CommitPushed, callback),
  onPausedChanged: (
    callback: (event: IpcRendererEvent, ...args: IpcHandlerParams<IpcChannelName.PausedChanged>) => void,
  ) => ipcRenderer.on(IpcChannelName.PausedChanged, callback),
}

const rendererToMain = {
  openDirectoryDialog: (): ReturnType<IpcHandler<IpcChannelName.DialogOpenDirectory>> =>
    ipcRenderer.invoke(IpcChannelName.DialogOpenDirectory),
  changeReposDirectory: (...args: IpcHandlerParams<IpcChannelName.ReposDirChanged>) =>
    ipcRenderer.invoke(IpcChannelName.ReposDirChanged, ...args),
  rescheduleCommits: (...args: IpcHandlerParams<IpcChannelName.ScheduleReorderedByUser>) =>
    ipcRenderer.invoke(IpcChannelName.ScheduleReorderedByUser, ...args),
  unpause: () => ipcRenderer.invoke(IpcChannelName.PausedChanged, false),
  sendUiReadySignal: () => ipcRenderer.invoke(IpcChannelName.UiReady),
  gitHubUsernameChanged: (...args: IpcHandlerParams<IpcChannelName.GitHubUsernameChanged>) =>
    ipcRenderer.invoke(IpcChannelName.GitHubUsernameChanged, ...args),
}

export const ipcApi = Object.freeze({
  ...mainToRenderer,
  ...rendererToMain,
})
