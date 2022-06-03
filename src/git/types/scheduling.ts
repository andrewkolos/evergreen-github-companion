import { Branch } from './branch'
import { Repo } from './repo'

export interface Scheduling {
  repo: Repo
  branch: Branch
}
