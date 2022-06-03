import React from 'react'
import { Scheduling } from '../../git/types/scheduling'

export interface RepoProps {
  scheduling: Scheduling
  order: number
}

export const SchedulingListing: React.FC<RepoProps> = ({ scheduling, order }) => {
  const { repo, branch } = scheduling
  return (
    <div className="bg-white rounded-lg ring-1 ring-black/30 shadow-lg">
      <div className="relative w-100">
        <div className="text-2xl text-slate-400 text-right absolute top-3 right-10">{order.toString()}</div>
      </div>
      <div className="m-2 px-6 py-6">
        <div className="mb-2">
          <span className="text-gray-500 font-semibold block text-sm">Repo/branch</span>
          <span className="text-lg font-medium tracking-tight">
            <span className="text-slate-900">{repo.name}</span>/<span className="text-slate-700">{branch.name}</span>
          </span>
        </div>
        <span className="text-gray-500 font-semibold block text-sm">Next commit</span>
        <span className="tracking-tight">{branch.unpushedCommits[0].message}</span>
      </div>
    </div>
  )
}
