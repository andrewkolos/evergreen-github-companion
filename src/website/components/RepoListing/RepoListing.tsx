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
  <div>
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
  <>
    <p>{repo.name}</p>
    {repo.branches.map((branch) => (
      <BranchListing branch={branch} />
    ))}
    <p>end Repo</p>
  </>
)
