import React, { useEffect } from 'react'
import { DailyCommitStatus } from '../git/daily-commit-status'
import { Scheduling } from '../git/types/scheduling'
import { ipcApi } from '../ipc/ipc-api'
import { DailyCommitStatusDisplay } from './components/DailyCommitStatusDisplay'
import { DirectoryChooser } from './components/DirectoryChooser'
import PausedDisplay from './components/PausedDisplay'
import { Schedule } from './components/Schedule'

export interface IndexProps {
  api: typeof ipcApi
  initialReposDir: string | null
}

export const Index: React.FC<IndexProps> = ({ api, initialReposDir }) => {
  const [schedule, setSchedule] = React.useState<Scheduling[] | undefined | null>(undefined)
  const [paused, setPaused] = React.useState<boolean>(false)
  const [reposDir, setReposDir] = React.useState<string | null>(initialReposDir)
  const [dailyCommitStatus, setDailyCommitStatus] = React.useState<DailyCommitStatus>(DailyCommitStatus.Unknown)

  useEffect(() => {
    api.onScheduleChanged((_event, value) => {
      setSchedule(value)
    })

    api.onDailyCommitStatusChanged((_event, value) => {
      setDailyCommitStatus(value)
    })

    api.onPausedChanged((_event, value) => {
      setPaused(value)
    })

    api.sendUiReadySignal()
  })

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="p-2 flex flex-grow flex-col">
        <DirectoryChooser value={reposDir ?? ''} onSelectionIntent={handleDirSelectIntent} />
        <hr className="divide my-3" />
        <h1 className="text-2xl font-bold block text-center mb-2">Auto-Push Schedule</h1>
        <div className="flex-grow">{renderSchedule()}</div>
      </div>
      <DailyCommitStatusDisplay status={dailyCommitStatus} />
      {paused && <PausedDisplay onUnpauseClicked={handleUnpausedClicked} />}
    </div>
  )

  async function handleDirSelectIntent() {
    const result = await api.openDirectoryDialog()
    if (!result) return
    setSchedule(null)
    setReposDir(result)
    await api.changeReposDirectory(result)
  }

  function renderSchedule() {
    if (reposDir == null) {
      return (
        <div className="w-full text-lg text-center">
          Select the folder where you keep your GitHub repos. You will then see your commits here, scheduled for daily
          automatic pushing.
        </div>
      )
    }

    if (schedule == null) {
      return <div className="w-full text-lg text-center">Loading...</div>
    }

    if (schedule.length === 0) {
      return <div className="w-full text-lg text-center">There are no unpushed commits available.</div>
    }

    return <Schedule initialSchedule={schedule} onReorder={handleReorder} />
  }

  function handleReorder(newSchedule: Scheduling[]) {
    setSchedule(newSchedule)
    api.rescheduleCommits(newSchedule)
  }

  function handleUnpausedClicked() {
    api.unpause()
  }
}
