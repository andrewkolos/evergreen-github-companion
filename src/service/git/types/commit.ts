import { DefaultLogFields, ListLogLine } from 'simple-git'

export type Commit = DefaultLogFields &
  ListLogLine & {
    branchName: string
    repoName: string
  }
