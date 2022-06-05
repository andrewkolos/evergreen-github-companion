import { Octokit } from '@octokit/rest'
import dotenv from 'dotenv'
import { isToday } from '../is-today'
import { DailyCommitStatus } from './daily-commit-status'

dotenv.config()

export const GitHubClient = (username: string) =>
  Object.freeze({
    getTodaysCommitStatus: async () => {
      const commits = await getTodaysCommits(username)

      if (commits.length > 0) {
        return DailyCommitStatus.Pushed
      }

      return DailyCommitStatus.None
    },
  })

const token = process.env.GITHUB_TOKEN
async function getTodaysCommits(username: string) {
  const client = new Octokit({
    auth: token != null ? `token ${token}` : undefined,
  })
  const events = await client.activity.listEventsForAuthenticatedUser({
    username,
  })
  return events.data.filter((event) => {
    if (event.created_at == null) {
      console.warn(`GitHub event 'created_at' was undefined.`)
      return false
    }
    return isToday(new Date(event.created_at))
  })
}
