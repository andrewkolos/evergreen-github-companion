import { Branch } from './branch'
import { Repo } from './repo'

export interface Scheduling {
  repo: Repo
  branch: Branch
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Scheduling {
  export function toId(scheduling: Scheduling) {
    return `${scheduling.repo.name}/${scheduling.branch.name}`
  }
}
