import React from 'react'
import { DailyCommitStatus } from '../../git/daily-commit-status'

export interface DailyCommitStatusDisplayProps {
  status: DailyCommitStatus
}

export const DailyCommitStatusDisplay: React.FC<DailyCommitStatusDisplayProps> = ({ status: value }) => {
  return (
    <div className={`space-x-2 justify-center ${css()}`}>
      <div className="text-sm">
        <div className="flex justify-between py-2 px-3 rounded-t-lg">
          <span className="font-bold flex-grow text-center">{titleText()}</span>
        </div>
      </div>
    </div>
  )

  function css(): string {
    switch (value) {
      case DailyCommitStatus.Pushed:
        return 'bg-green-600 text-white'
      case DailyCommitStatus.None:
        return 'bg-yellow-600 text-black'
      case DailyCommitStatus.Unknown:
        return ''
      default:
        throw Error(`Unknown status ${value}`)
    }
  }

  function titleText(): string {
    switch (value) {
      case DailyCommitStatus.Pushed:
        return 'You have pushed a commit today. Great job!'
      case DailyCommitStatus.None:
        return 'You have not pushed a commit today.'
      case DailyCommitStatus.Unknown:
        return 'Polling GitHub for any commits you have pushed...'
      default:
        throw Error(`Unknown status ${value}`)
    }
  }
}
