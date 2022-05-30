import { Branch } from './branch'

export interface Repo {
  name: string
  localPath: string
  branches: Branch[]
}
