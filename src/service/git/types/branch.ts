import { Commit } from './commit'

export interface Branch {
  name: string
  repoName: string
  unpushedCommits: readonly Commit[]
}
