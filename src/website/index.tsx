import React, { useEffect } from 'react'
import { GitClient } from '../service/git/git-client'
import { Repo } from '../service/git/types/repo'
import { RepoListing } from './components/RepoListing/RepoListing'

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
        <RepoListing
          key={repo.name}
          repo={repo}
          onPushCommit={(branch, commit) => pushCommit(repo.localPath, branch, commit.hash)}
        />
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
