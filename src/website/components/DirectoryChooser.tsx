import React, { useState } from 'react'
import { Key } from 'ts-key-enum'

export interface DirectoryChooserProps {
  value: string
  onSelectionIntent: () => void
}

export const DirectoryChooser: React.FC<DirectoryChooserProps> = ({ value, onSelectionIntent }) => {
  return (
    <div className="flex justify-center">
      <div className="w-96">
        <label htmlFor="formFile" className="form-label inline-block mb-2 text-gray-700">
          GitHub Repository Folder
        </label>
        <div
          className="flex hover:ring-blue-500 hover:ring focus:ring focus:ring-blue-700 active:ring-blue-700 cursor-pointer rounded"
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
              border-r-0
              rounded-l
              transition
              ease-in-out
              focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
            id="formFile"
          >
            {value}
          </span>
          <button
            type="button"
            id="chooseRepositoryFolder"
            className="btn btn-square w-30 border p-2 rounded-r bg-gray-100"
          >
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
          </button>
        </div>
      </div>
    </div>
  )

  function handleClick() {
    onSelectionIntent()
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
    if (event.key !== Key.Enter) return
    onSelectionIntent()
  }
}
