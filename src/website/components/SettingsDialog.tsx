import type { OpenDialogReturnValue } from 'electron'
import React, { useState } from 'react'
import { DirectoryChooser } from './DirectoryChooser'

export interface UserSettings {
  gitHubUsername: string
  reposDir: string
}

export interface SettingsDialogProps {
  value: UserSettings
  onSave: (value: { gitHubUsername: string; reposDir: string }) => void
  onCancel: () => void
  nativeDirectoryDialogShower: () => Promise<OpenDialogReturnValue>
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  value,
  onSave,
  onCancel,
  nativeDirectoryDialogShower,
}) => {
  const [gitHubUsername, setGitHubUsername] = useState<string>(value.gitHubUsername)
  const [reposDir, setReposDir] = useState<string>(value.reposDir)
  const [setupMode] = useState<boolean>(!isFormValid())

  const backgroundCss = setupMode ? 'bg-gray-100' : 'bg-gray-700 bg-opacity-50'
  const titleText = setupMode ? 'Setup' : 'Settings'
  return (
    <div className="container flex justify-center mx-auto">
      <div className={`absolute inset-0 flex items-center justify-center w-full ${backgroundCss}`}>
        <div className="mx-10 p-6 bg-white w-screen max-w-2xl">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl">{titleText}</h1>
            <button type="button" onClick={onCancel}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
          </div>
          <div className="mt-4">
            <form action="">
              <div className="mb-5">
                <label htmlFor="gitHubUsername" className="block">
                  <span className="font-bold text-gray-600">GitHub Username</span>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded shadow focus:outline-none hover:ring-blue-500 hover:ring focus:ring focus:ring-blue-700 active:ring-blue-700"
                    placeholder=""
                    value={gitHubUsername}
                    onChange={(event) => setGitHubUsername(event.target.value)}
                  />
                </label>
                {!gitHubUsername && <p className="mt-1 text-sm text-red-500">GitHub username is required.</p>}
              </div>
              <div className="mb-5">
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label className="block">
                  <span className="font-bold text-gray-600">Repo Directory Root</span>
                  <DirectoryChooser
                    value={reposDir}
                    nativeDirectoryDialogShower={nativeDirectoryDialogShower}
                    onChange={(newReposDir) => setReposDir(newReposDir)}
                  />
                </label>

                {!reposDir && <p className="mt-1 text-sm text-red-500">Repo directory root is required.</p>}
              </div>
              <button type="submit" className="block w-full btn" onClick={handleSave} disabled={!isFormValid()}>
                Save
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )

  function handleSave() {
    if (!isFormValid()) {
      throw Error('Required user setting was missing.')
    }

    onSave({
      gitHubUsername,
      reposDir,
    })
  }

  function isFormValid() {
    return gitHubUsername && reposDir
  }
}
