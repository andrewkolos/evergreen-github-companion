import { DailyCommitStatus } from '../git/daily-commit-status'
import { Commit } from '../git/types/commit'
import { Scheduling } from '../git/types/scheduling'

export enum IpcChannelName {
  DialogOpenDirectory = 'Dialog:OpenDirectory',
  ReposDirChanged = 'ReposDirChanged',
  PausedChanged = 'PausedChanged',
  ScheduleReorderedByUser = 'ScheduleReorderedByUser',
  ScheduleUpdated = 'ScheduleUpdated',
  DailyCommitStatusChanged = 'DailyCommitStatusChanged',
  CommitPushed = 'CommitPushed',
}

interface IpcEvents {
  [IpcChannelName.DialogOpenDirectory]: () => Promise<string | undefined>
  [IpcChannelName.PausedChanged]: (value: boolean) => void
  [IpcChannelName.ReposDirChanged]: (value: string) => void
  [IpcChannelName.ScheduleReorderedByUser]: (value: Scheduling[]) => void
  [IpcChannelName.ScheduleUpdated]: (value: Scheduling[]) => void
  [IpcChannelName.DailyCommitStatusChanged]: (value: DailyCommitStatus) => void
  [IpcChannelName.CommitPushed]: (value: Commit) => void
}

export type IpcHandler<E extends IpcChannelName> = IpcEvents[E]
export type IpcHandlerParams<E extends IpcChannelName> = Parameters<IpcEvents[E]>
