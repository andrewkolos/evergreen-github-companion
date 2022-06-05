/* eslint-disable react/jsx-props-no-spreading */
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import React from 'react'
import { MdOutlineReorder } from 'react-icons/md'
import { Repo } from '../../git/types/repo'

export interface RepoProps {
  repo: Repo & { id: string }
  order: number
}

export const RepoListing: React.FC<RepoProps> = ({ repo, order }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: repo.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-md shadow-md mb-4 ring-1 ring-gray-400"
    >
      <div className="relative w-100">
        <div className="text-2xl text-slate-400 text-right absolute top-3 right-10">{order.toString()}</div>
      </div>
      <div className="m-2 px-6 py-6 flex">
        <div className="flex justify-center items-center mr-8">
          <MdOutlineReorder className="h-7 w-7" />
        </div>
        <div>
          <div className="mb-2">
            <span className="text-gray-500 font-semibold block text-sm">Repo/branch</span>
            <span className="text-lg font-medium tracking-tight">
              <span className="text-slate-900">{repo.name}</span>/
              <span className="text-slate-700">{repo.mainBranchName}</span>
            </span>
          </div>
          <span className="text-gray-500 font-semibold block text-sm">Next commit</span>
          <span className="tracking-tight">{repo.unpushedCommits[0].message}</span>
        </div>
      </div>
    </div>
  )
}
