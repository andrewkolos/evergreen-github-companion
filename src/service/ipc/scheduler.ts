import { EventEmitter } from '@akolos/event-emitter'
import cron from 'node-cron'
import CronTime from 'cron-time-generator'
import { GitClient } from '../git/git-client'
import { Scheduling } from './scheduling'
import { isToday } from '../../is-today'
import { GitHubClient } from '../git/github-client'
import { DailyCommitStatus } from './daily-commit-status'
import { Storage, StorageEntryKeys } from './storage'

interface SchedulerEvents {
  DailyCommitStatusChanged: (event: { previousValue: DailyCommitStatus; newValue: DailyCommitStatus }) => void
  ScheduleUpdated: (event: { newSchedule: Scheduling[]; previousSchedule: Scheduling[] }) => void
}

const eventEmitter = new EventEmitter<SchedulerEvents>()

export class Scheduler {
  static #instance: Scheduler | undefined

  static readonly on = eventEmitter.makeDelegate('on', this)

  static readonly off = eventEmitter.makeDelegate('off', this)

  static readonly #emit = eventEmitter.makeDelegate('emit', this)

  static async get(reposDir: string): Promise<Scheduler> {
    if (this.#instance != null) return this.#instance
    const instance = await this.#create(reposDir)
    Storage.on('valueChanged', async (key: StorageEntryKeys) => {
      if (key !== StorageEntryKeys.RepositoriesDirectoryPath) return
      instance.#schedule = await createSchedule(reposDir)
    })
    this.#instance = instance
    return instance
  }

  static async #create(reposDir: string) {
    return new Scheduler(reposDir, await createSchedule(reposDir))
  }

  #reposDir: string

  #schedule: Scheduling[]

  #paused = false

  #dailyCommitStatus: DailyCommitStatus = DailyCommitStatus.Unknown

  public get reposDir(): string {
    return this.#reposDir
  }

  async setReposDir(value: string) {
    this.#reposDir = value
    this.#setSchedule(await createSchedule(value))
  }

  public get paused() {
    return this.#paused
  }

  public set paused(value) {
    this.#paused = value
  }

  public get schedule(): Scheduling[] {
    return this.#schedule.slice()
  }

  #setSchedule(schedule: Scheduling[]) {
    const previousSchedule = this.#schedule.slice()
    this.#schedule = schedule
    Scheduler.#emit('ScheduleUpdated', { previousSchedule, newSchedule: this.#schedule })
  }

  public get dailyCommitStatus() {
    return this.#dailyCommitStatus
  }

  private constructor(reposDir: string, initialSchedule: Scheduling[]) {
    if (Scheduler.#instance != null) {
      throw Error('Attempted to re-instantiate Scheduler singleton.')
    }

    cron.schedule(CronTime.every(1).minutes(), async () => {
      const dailyCommitPushed = await determineDailyCommitStatus()
      if (dailyCommitPushed === DailyCommitStatus.None && this.schedule.length > 0) {
        await this.pushNextCommit()
      }
    })

    this.#reposDir = reposDir

    this.#schedule = initialSchedule
  }

  async pushNextCommit(): Promise<void> {
    await this.#pushCommit(this.schedule[0])
  }

  #setDailyCommitStatus(value: DailyCommitStatus) {
    const previousValue = this.#dailyCommitStatus
    this.#dailyCommitStatus = value
    Scheduler.#emit('DailyCommitStatusChanged', { previousValue, newValue: this.#dailyCommitStatus })
  }

  async #pushCommit(scheduling: Scheduling): Promise<void> {
    await new GitClient(this.#reposDir).pushNextCommit({
      repoPath: scheduling.repo.localPath,
      branchName: scheduling.branch.name,
    })
    this.#setSchedule(
      this.#schedule.filter((o) => !(o.repo.name === scheduling.repo.name && o.branch.name === scheduling.branch.name)),
    )
    this.#setDailyCommitStatus(DailyCommitStatus.Pushed)
  }
}

async function createSchedule(reposDir: string): Promise<Scheduling[]> {
  return (await new GitClient(reposDir).getReposWithUnpushedCommits()).flatMap((repo) =>
    repo.branches.map(
      (branch): Scheduling => ({
        branch,
        repo,
      }),
    ),
  )
}

let lastKnownCommitDate: Date | undefined

async function determineDailyCommitStatus(): Promise<DailyCommitStatus> {
  if (lastKnownCommitDate != null && isToday(lastKnownCommitDate)) return DailyCommitStatus.Pushed

  const commits = await GitHubClient.getTodaysCommits()

  if (commits.length > 0) {
    lastKnownCommitDate = new Date()
    return DailyCommitStatus.Pushed
  }

  return DailyCommitStatus.None
}
