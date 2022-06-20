import { Octokit, RestEndpointMethodTypes } from '@octokit/rest'
import { isToday } from '../is-today'
import { DailyCommitStatus } from './daily-commit-status'

type ElementOf<T extends Omit<ArrayLike<unknown>, 'length'>> = T extends ArrayLike<infer R> ? R : never
type ActivityItem = ElementOf<RestEndpointMethodTypes['activity']['listEventsForAuthenticatedUser']['response']['data']>
type Repo = RestEndpointMethodTypes['repos']['get']['response']['data']

export class GitHubClient {
  #client = new Octokit({
    auth: `token ${this.token}`,
  })

  #repoCache = new Map<string, Repo>()

  constructor(public readonly username: string, public readonly token: string) {}

  async getTodaysCommitStatus() {
    const commits = await this.getTodaysEligibleCommits()

    if (commits.length > 0) {
      return DailyCommitStatus.Pushed
    }

    return DailyCommitStatus.None
  }

  private async getTodaysEligibleCommits(): Promise<ActivityItem[]> {
    const isEligibleCommitEvent = async (event: ActivityItem) => {
      if (event.type !== 'PushEvent') return false

      const createdToday = (() => {
        if (event.created_at == null) {
          console.warn(`GitHub event 'created_at' was undefined.`)
          return false
        }
        return isToday(new Date(event.created_at))
      })()

      if (!createdToday) return false

      const contributionEligible = async () => {
        const { owner } = parseRepoName(event.repo.name)
        const repo = await (async () => {
          const cachedRepo = this.#repoCache.get(event.repo.name)
          if (cachedRepo != null) return cachedRepo
          const result = (
            await this.#client.repos.get({
              owner,
              repo: event.repo.name,
            })
          ).data
          this.#repoCache.set(event.repo.name, result)
          return result
        })()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { ref } = event.payload as any

        if (typeof ref !== 'string') {
          throw Error('Expected payload.ref to be a string.')
        }
        return ref === repo.default_branch
      }

      return contributionEligible
    }

    const events = await this.#client.activity.listEventsForAuthenticatedUser({
      username: this.username,
    })

    return (await Promise.all(events.data.map(async (e) => ({ event: e, eligible: await isEligibleCommitEvent(e) }))))
      .filter((a) => a.eligible)
      .map((a) => a.event)
  }
}

function parseRepoName(name: string) {
  const matchArr = name.match('(.*)/(.*)')
  if (matchArr == null || matchArr.length < 3) throw Error('no match')
  return {
    owner: matchArr[1],
    name: matchArr[2],
  }
}
