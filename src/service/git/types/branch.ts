import { Commit } from './commit'

export interface Branch {
  name: string
  unpushedCommits: readonly Commit[]
}
