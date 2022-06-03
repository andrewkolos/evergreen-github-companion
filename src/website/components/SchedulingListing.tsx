import React from 'react'
import { Scheduling } from '../../service/ipc/scheduling'

export interface RepoProps {
  scheduling: Scheduling
}

export const SchedulingListing: React.FC<RepoProps> = ({ scheduling }) => {
  const { repo, branch } = scheduling
  return (
    <div className="bg-white rounded-lg m-2 px-6 py-6 ring-1 ring-black/30 shadow-lg">
      <p className="text-slate-900 text-lg font-medium tracking-tight">{repo.name}</p>
      <p>Branch: {branch.name}</p>
      <p>Next commit: {branch.unpushedCommits[0].message}</p>
    </div>
  )
}
