import React from 'react'

export interface PausedDisplayProps {
  onUnpauseClicked: () => void
}

const PausedDisplay: React.FC<PausedDisplayProps> = ({ onUnpauseClicked }) => {
  return (
    <div className="space-x-2 justify-center bg-blue-200">
      <div className="text-sm flex justify-between">
        <div className="flex-grow py-2 px-3 rounded-t-lg text-center">
          <span className="font-bold">Automatic commit pushing is paused.</span>
          <button
            type="button"
            className="ml-2 p-1 bg-blue-300 rounded hover:bg-blue-400 border-black border-solid"
            onClick={unPauseClicked}
          >
            Unpause
          </button>
        </div>
      </div>
    </div>
  )

  function unPauseClicked() {
    onUnpauseClicked()
  }
}

export default PausedDisplay
