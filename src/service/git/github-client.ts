import { Octokit } from '@octokit/rest'
import dotenv from 'dotenv'
import { isToday } from '../../is-today'

dotenv.config()

export const GitHubClient = Object.freeze({
  getTodaysCommits: async () => {
    const client = new Octokit({
      log: console,
    })
    const events = await client.activity.listEventsForAuthenticatedUser({
      username: 'andrewkolos',
    })
    return events.data.filter((event) => isToday(new Date(event.created_at)))
  },
})
