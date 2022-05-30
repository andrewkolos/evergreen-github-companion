// TODO: Remove these before committing.
/* eslint-disable react/no-unused-prop-types */
/* eslint-disable react/require-default-props */
import React from 'react'
import { Repo } from '../../../service/git/types/repo'
import { Branch } from '../../../service/git/types/branch'
import { Commit } from '../../../service/git/types/commit'

interface BranchListingProps {
  branch: Branch
}
const BranchListing: React.FC<BranchListingProps> = ({ branch }) => (
  <div className="rounded-lg m-1 p-2 ring-1 ring-slate-900/5 shadow-sm">
    <p>{branch.name}</p>
    <p>next commit:</p>
    <p>{branch.unpushedCommits[0].message}</p>
    <button type="button">Schedule</button>
  </div>
)

export interface RepoProps {
  repo: Repo
  onPushCommit?: (branchName: string, commit: Commit) => void
}

export const RepoListing: React.FC<RepoProps> = ({ repo }) => (
  <div className="bg-white rounded-lg m-2 px-6 py-8 ring-1 ring-slate-900/5 shadow-xl">
    <p className="text-slate-900 mt-5 text-lg font-medium tracking-tight">{repo.name}</p>
    {repo.branches.map((branch) => (
      <BranchListing key={repo.name + branch.name} branch={branch} />
    ))}
    <p>end Repo</p>
  </div>
)
