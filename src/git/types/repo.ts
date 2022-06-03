import { Commit } from './commit'

export interface Repo {
  /**
   * The name of the repo. Matches the name of the .git file on the origin remote.
   * If the origin remote is not defined, this matches the local name.
   */
  name: string
  localPath: string
  mainBranchName: string
  /** The unpushed commits, in order of date committed, ascending. */
  unpushedCommits: readonly Commit[]
}
