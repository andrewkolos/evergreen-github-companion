import { Branch } from '../git/types/branch'
import { Repo } from '../git/types/repo'

export interface Scheduling {
  repo: Repo
  branch: Branch
}
