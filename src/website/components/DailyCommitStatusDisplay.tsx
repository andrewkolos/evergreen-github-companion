import React from 'react'
import { DailyCommitStatus } from '../../git/daily-commit-status'
import { Commit } from '../../git/types/commit'

export interface DailyCommitStatusDisplayProps {
  status: DailyCommitStatus
  mostRecentlyPushedCommit?: Commit
}

export const DailyCommitStatusDisplay: React.FC<DailyCommitStatusDisplayProps> = ({
  status: value,
  mostRecentlyPushedCommit,
}) => {
  const message = makeMessage()
  return (
    <div className={`space-x-2 justify-center ${css()}`}>
      <div className="text-sm pointer-events-auto bg-clip-padding">
        <div className="flex justify-between py-2 px-3 bg-clip-padding rounded-t-lg">
          <span className="font-bold flex-grow text-center">{titleText()}</span>
        </div>
        {message && <div className="p-3 rounded-b-lg break-words border-t border-gray-200">{message}</div>}
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

  function makeMessage(): string {
    switch (value) {
      case DailyCommitStatus.Pushed:
        return mostRecentlyPushedCommit
          ? `${mostRecentlyPushedCommit.repoName}/${mostRecentlyPushedCommit.branchName}, ${mostRecentlyPushedCommit.message}`
          : ''
      case DailyCommitStatus.None:
        return ''
      case DailyCommitStatus.Unknown:
        return ''
      default:
        throw Error(`Unknown status ${value}`)
    }
  }
}

DailyCommitStatusDisplay.defaultProps = {
  mostRecentlyPushedCommit: undefined,
}
