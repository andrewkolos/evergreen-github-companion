import React, { useEffect } from 'react'
import { IoMdOptions } from 'react-icons/io'
import { DailyCommitStatus } from '../git/daily-commit-status'
import { Scheduling } from '../git/types/scheduling'
import { ipcApi } from '../ipc/ipc-api'
import { DailyCommitStatusDisplay } from './components/DailyCommitStatusDisplay'
import PausedDisplay from './components/PausedDisplay'
import { Schedule } from './components/Schedule'
import { SettingsDialog, UserSettings } from './components/SettingsDialog'

export interface IndexProps {
  api: typeof ipcApi
  initialReposDir: string | null
  initialGitHubUserName: string | null
}

export const Index: React.FC<IndexProps> = ({ api, initialReposDir, initialGitHubUserName }) => {
  const [schedule, setSchedule] = React.useState<Scheduling[] | undefined | null>(undefined)
  const [paused, setPaused] = React.useState<boolean>(false)
  const [reposDir, setReposDir] = React.useState<string | null>(initialReposDir)
  const [gitHubUsername, setGitHubUsername] = React.useState<string | null>(initialGitHubUserName)
  const [dailyCommitStatus, setDailyCommitStatus] = React.useState<DailyCommitStatus>(DailyCommitStatus.Unknown)
  const [requiredConfigProvided, setRequiredConfigProvided] = React.useState<boolean>(false)

  const [showingSettings, setShowingSettings] = React.useState<boolean>(
    reposDir == null || initialGitHubUserName == null,
  )

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
  }, [])

  useEffect(() => {
    if (schedule === undefined) {
      api.sendUiReadySignal()
    }

    const requiredConfigIsNowProvided = gitHubUsername != null && reposDir != null
    if (requiredConfigIsNowProvided !== requiredConfigProvided) {
      setRequiredConfigProvided(requiredConfigIsNowProvided)
    }
  })

  return (
    <>
      {(showingSettings || !requiredConfigProvided) && (
        <SettingsDialog
          value={{ gitHubUsername: gitHubUsername ?? '', reposDir: reposDir ?? '' }}
          onSave={handleSettingsChange}
          onCancel={() => setShowingSettings(false)}
          nativeDirectoryDialogShower={() => api.openDirectoryDialog()}
        />
      )}
      {requiredConfigProvided && (
        <div className="flex flex-col bg-slate-50 h-full">
          <div className="p-2 flex flex-grow flex-col h-full">
            <button type="button" className="btn w-36 self-center" onClick={() => setShowingSettings(true)}>
              <span>
                <IoMdOptions className="inline" /> Settings
              </span>
            </button>

            <hr className="divide my-3" />
            <h1 className="text-2xl font-bold block text-center mb-2">Auto-Push Schedule</h1>
            <div className="flex-grow p-2 overflow-y-auto h-full">{renderSchedule()}</div>
          </div>
          <DailyCommitStatusDisplay status={dailyCommitStatus} />
          {paused && <PausedDisplay onUnpauseClicked={handleUnpausedClicked} />}
        </div>
      )}
    </>
  )

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

  function handleSettingsChange({ gitHubUsername: newGitHubUsername, reposDir: newReposDir }: UserSettings) {
    if (newReposDir !== reposDir) {
      setReposDir(newReposDir)
      api.changeReposDirectory(newReposDir)
    }

    if (newGitHubUsername !== gitHubUsername) {
      setGitHubUsername(newGitHubUsername)
      api.gitHubUsernameChanged(newGitHubUsername)
    }
  }
}
