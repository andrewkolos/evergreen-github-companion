import { Octokit } from '@octokit/rest'
import dotenv from 'dotenv'
import { isToday } from '../is-today'
import { DailyCommitStatus } from './daily-commit-status'

dotenv.config()

export const GitHubClient = Object.freeze({
  getTodaysCommitStatus: async () => {
    const commits = await getTodaysCommits()

    if (commits.length > 0) {
      return DailyCommitStatus.Pushed
    }

    return DailyCommitStatus.None
  },
})

const token = process.env.GITHUB_TOKEN
async function getTodaysCommits() {
  const client = new Octokit({
    log: console,
    auth: token ? `token ${token}` : undefined,
  })
  const events = await client.activity.listEventsForAuthenticatedUser({
    username: 'andrewkolos',
  })
  return events.data.filter((event) => {
    if (event.created_at == null) {
      console.warn(`GitHub event 'created_at' was undefined.`)
      return false
    }
    return isToday(new Date(event.created_at))
  })
}
