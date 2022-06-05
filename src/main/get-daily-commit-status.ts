import { DailyCommitStatus } from '../git/daily-commit-status'
import { GitHubClient } from '../git/github-client'
import { isToday } from '../is-today'

let lastCheckResult:
  | {
      status: DailyCommitStatus
      checkedTime: Date
    }
  | undefined

export async function getDailyCommitStatus(gitHubUsername: string): Promise<DailyCommitStatus> {
  const result = await impl(gitHubUsername)
  lastCheckResult = {
    status: result,
    checkedTime: new Date(),
  }
  return result
}

async function impl(gitHubUsername: string) {
  if (lastCheckResult != null) {
    const { status, checkedTime } = lastCheckResult
    if (status === DailyCommitStatus.Pushed && isToday(checkedTime)) {
      return DailyCommitStatus.Pushed
    }
  }

  return GitHubClient(gitHubUsername).getTodaysCommitStatus()
}
