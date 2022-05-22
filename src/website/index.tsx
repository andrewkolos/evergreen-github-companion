// src/react.tsx

import React, { useEffect } from 'react'
import { RepoListing } from './components/RepoListing/RepoListing'
import { GitClient } from '../service/git-client'
import { Repo } from '../service/types/repo'

export const Index: React.FC = () => {
  const [repos, setRepos] = React.useState<Repo[] | undefined>(undefined)

  useEffect(() => {
    refreshRepos()
  })

  return repos == null ? (
    <span>Loading...</span>
  ) : (
    <>
      {repos.map((repo) => (
        <RepoListing repo={repo} onPushCommit={(branch, commit) => pushCommit(repo.localPath, branch, commit.hash)} />
      ))}
    </>
  )

  async function refreshRepos() {
    const refreshedRepos = await GitClient.getReposWithUnpushedCommits()
    setRepos(refreshedRepos)
  }

  async function pushCommit(repoPath: string, branchName: string, commitHash: string) {
    await GitClient.pushNextCommit({
      repoPath,
      branchName,
      commitHash,
    })
    await refreshRepos()
  }
}
