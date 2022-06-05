import type { OpenDialogReturnValue } from 'electron'
import React from 'react'
import { Key } from 'ts-key-enum'
import { z } from 'zod'

export interface DirectoryChooserProps {
  value: string
  onChange: (value: string) => void
  nativeDirectoryDialogShower: () => Promise<OpenDialogReturnValue>
}

export const DirectoryChooser: React.FC<DirectoryChooserProps> = ({ value, onChange, nativeDirectoryDialogShower }) => {
  return (
    <div
      className="flex hover:ring-blue-500 hover:ring focus:ring focus:ring-blue-700 active:ring-blue-700 cursor-pointer rounded focus:outline-none"
      aria-controls="chooseRepositoryFolder"
      role="button"
      aria-roledescription="Opens a dialog for GitHub Repository Folder selection."
      onClick={handleClick}
      tabIndex={0}
      onKeyDown={(event) => handleKeyDown(event)}
    >
      <span
        className="form-control
              p-2
              flex-grow
              text-gray-700
              bg-white bg-clip-padding
              border border-solid border-gray-300
              rounded
              transition
              ease-in-out
              focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none
              w-full shadow"
        id="formFile"
      >
        {value}
      </span>
      <span id="chooseRepositoryFolder" className="btn btn-square w-30 border p-2 rounded-l-0">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </span>
    </div>
  )

  async function handleClick() {
    await showDirOpenDialog()
  }

  async function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== Key.Enter) return
    await showDirOpenDialog()
  }

  async function showDirOpenDialog() {
    const dialogResult = await nativeDirectoryDialogShower()
    if (dialogResult.canceled) {
      return
    }
    const newRepoDir = z.string().min(1).parse(dialogResult.filePaths[0])
    onChange(newRepoDir)
  }
}
