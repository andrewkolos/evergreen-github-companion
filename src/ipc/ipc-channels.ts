import { OpenDialogReturnValue } from 'electron'
import { Repo } from '../git/types/repo'
import { DailyCommitStatus } from '../git/daily-commit-status'
import { Commit } from '../git/types/commit'

export enum IpcChannelName {
  DialogOpenDirectory = 'Dialog:OpenDirectory',
  ReposDirChanged = 'ReposDirChanged',
  PausedChanged = 'PausedChanged',
  ScheduleReorderedByUser = 'ScheduleReorderedByUser',
  ScheduleUpdated = 'ScheduleUpdated',
  DailyCommitStatusChanged = 'DailyCommitStatusChanged',
  CommitPushed = 'CommitPushed',
  UiReady = 'UiReady',
  GitHubUsernameChanged = 'GitHubUsernameChanged',
}

interface IpcEvents {
  [IpcChannelName.DialogOpenDirectory]: () => Promise<OpenDialogReturnValue>
  [IpcChannelName.PausedChanged]: (value: boolean) => void
  [IpcChannelName.ReposDirChanged]: (value: string) => void
  [IpcChannelName.ScheduleReorderedByUser]: (value: Repo[]) => void
  [IpcChannelName.ScheduleUpdated]: (value: Repo[]) => void
  [IpcChannelName.DailyCommitStatusChanged]: (value: DailyCommitStatus) => void
  [IpcChannelName.CommitPushed]: (value: Commit) => void
  [IpcChannelName.UiReady]: () => void
  [IpcChannelName.GitHubUsernameChanged]: (value: string) => void
}

export type IpcHandler<E extends IpcChannelName> = IpcEvents[E]
export type IpcHandlerParams<E extends IpcChannelName> = Parameters<IpcEvents[E]>
