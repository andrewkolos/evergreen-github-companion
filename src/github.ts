import { Octokit } from '@octokit/rest'
import { isToday } from './is-today'

export const GitHub = Object.freeze({
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
