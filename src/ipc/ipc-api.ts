import { ipcRenderer, IpcRendererEvent } from 'electron'
import { IpcChannelName, IpcHandler, IpcHandlerParams } from './ipc-channels'

export const ipcApi = Object.freeze({
  openDirectoryDialog: (): ReturnType<IpcHandler<IpcChannelName.DialogOpenDirectory>> =>
    ipcRenderer.invoke(IpcChannelName.DialogOpenDirectory),
  changeReposDirectory: (...args: IpcHandlerParams<IpcChannelName.ReposDirChanged>) =>
    ipcRenderer.invoke(IpcChannelName.ReposDirChanged, ...args),
  rescheduleCommits: (...args: IpcHandlerParams<IpcChannelName.ScheduleReorderedByUser>) =>
    ipcRenderer.invoke(IpcChannelName.ScheduleReorderedByUser, ...args),
  onScheduleChanged: (
    callback: (event: IpcRendererEvent, ...args: IpcHandlerParams<IpcChannelName.ScheduleUpdated>) => void,
  ) => ipcRenderer.on(IpcChannelName.ScheduleUpdated, callback),
  onDailyCommitStatusChanged: (
    callback: (event: IpcRendererEvent, ...args: IpcHandlerParams<IpcChannelName.DailyCommitStatusChanged>) => void,
  ) => ipcRenderer.on(IpcChannelName.DailyCommitStatusChanged, callback),
  onCommitPushed: (
    callback: (event: IpcRendererEvent, ...args: IpcHandlerParams<IpcChannelName.CommitPushed>) => void,
  ) => ipcRenderer.on(IpcChannelName.CommitPushed, callback),
})
