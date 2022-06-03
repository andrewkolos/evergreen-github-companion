import { InheritableEventEmitter } from '@akolos/event-emitter'
import cron from 'node-cron'
import CronTime from 'cron-time-generator'
import { GitClient } from '../git/git-client'
import { Scheduling } from './scheduling'
import { isToday } from '../../is-today'
import { GitHubClient } from '../git/github-client'
import { DailyCommitStatus } from './daily-commit-status'

interface MyApiEvents {
  DailyCommitStatusChanged: [event: { previousValue: DailyCommitStatus; newValue: DailyCommitStatus }]
  ScheduleUpdated: [event: { newSchedule: Scheduling[]; previousSchedule: Scheduling[] }]
}

export class MyApi extends InheritableEventEmitter<MyApiEvents> {
  static #instance: MyApi | undefined

  static async get() {
    return MyApi.#instance ?? (await this.#create())
  }

  static async #create() {
    return new MyApi(await createSchedule(), await determineDailyCommitStatus())
  }

  #schedule: Scheduling[]

  #paused = false

  #dailyCommitStatus: DailyCommitStatus = DailyCommitStatus.Unknown

  public get paused() {
    return this.#paused
  }

  public set paused(value) {
    this.#paused = value
  }

  public get schedule(): Scheduling[] {
    return this.#schedule.slice()
  }

  setSchedule(schedule: Scheduling[]) {
    const previousSchedule = this.#schedule.slice()
    this.#schedule = schedule
    this.emit('ScheduleUpdated', { previousSchedule, newSchedule: this.#schedule })
  }

  public get dailyCommitStatus() {
    return this.#dailyCommitStatus
  }

  #setDailyCommitStatus(value: DailyCommitStatus) {
    const previousValue = this.#dailyCommitStatus
    this.#dailyCommitStatus = value
    this.emit('DailyCommitStatusChanged', { previousValue, newValue: this.#dailyCommitStatus })
  }

  private constructor(initialSchedule: Scheduling[], initialCommitStatus: DailyCommitStatus) {
    super()
    this.#setDailyCommitStatus(initialCommitStatus)
    cron.schedule(CronTime.every(1).minutes(), async () => {
      const dailyCommitPushed = await determineDailyCommitStatus()
      if (dailyCommitPushed === DailyCommitStatus.None && this.schedule.length > 0) {
        await this.pushNextCommit()
      }
    })

    this.#schedule = initialSchedule
  }

  async pushNextCommit(): Promise<void> {
    await this.#pushCommit(this.schedule[0])
  }

  async #pushCommit(scheduling: Scheduling): Promise<void> {
    await GitClient.pushNextCommit({ repoPath: scheduling.repo.localPath, branchName: scheduling.branch.name })
    this.setSchedule(
      this.#schedule.filter((o) => !(o.repo.name === scheduling.repo.name && o.branch.name === scheduling.branch.name)),
    )
    this.#setDailyCommitStatus(DailyCommitStatus.Pushed)
  }
}

async function createSchedule(): Promise<Scheduling[]> {
  return (await GitClient.getReposWithUnpushedCommits()).flatMap((repo) =>
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
