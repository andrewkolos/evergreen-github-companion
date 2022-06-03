import { DefaultLogFields, ListLogLine } from 'simple-git'

export type Commit = DefaultLogFields &
  ListLogLine & {
    repoName: string
  }
