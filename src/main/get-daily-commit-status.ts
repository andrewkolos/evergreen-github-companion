import { DailyCommitStatus } from '../git/daily-commit-status'
import { GitHubClient } from '../git/github-client'
import { isToday } from '../is-today'

let lastCheckResult:
  | {
      status: DailyCommitStatus
      checkedTime: Date
    }
  | undefined

export async function getDailyCommitStatus(gitHubUsername: string, gitHubToken: string): Promise<DailyCommitStatus> {
  const result = await impl(gitHubUsername, gitHubToken)
  lastCheckResult = {
    status: result,
    checkedTime: new Date(),
  }
  return result
}

async function impl(gitHubUsername: string, gitHubToken: string) {
  if (lastCheckResult != null) {
    const { status, checkedTime } = lastCheckResult
    if (status === DailyCommitStatus.Pushed && isToday(checkedTime)) {
      return DailyCommitStatus.Pushed
    }
  }

  return new GitHubClient(gitHubUsername, gitHubToken).getTodaysCommitStatus()
}
