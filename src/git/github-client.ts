import { Octokit } from '@octokit/rest'
import dotenv from 'dotenv'
import { isToday } from '../is-today'
import { DailyCommitStatus } from './daily-commit-status'

dotenv.config()

export const GitHubClient = (username: string) =>
  Object.freeze({
    getTodaysCommitStatus: async () => {
      const commits = await getTodaysCommits(username)

      console.log(commits)
      if (commits.length > 0) {
        console.log('grea tjob!!!')
        return DailyCommitStatus.Pushed
      }

      return DailyCommitStatus.Pushed
    },
  })

const token = process.env.GITHUB_TOKEN
async function getTodaysCommits(username: string) {
  const client = new Octokit({
    log: console,
    auth: token != null ? `token ${token}` : undefined,
  })
  const events = await client.activity.listPublicEventsForUser({
    username,
  })
  console.log(events)
  return events.data.filter((event) => {
    if (event.created_at == null) {
      console.warn(`GitHub event 'created_at' was undefined.`)
      return false
    }
    return isToday(new Date(event.created_at))
  })
}
