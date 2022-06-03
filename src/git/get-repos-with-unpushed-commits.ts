import fse from 'fs-extra'
import { execSync as cpExecSync } from 'child_process'
import path from 'path'
import SimpleGit, { DefaultLogFields, ListLogLine } from 'simple-git'
import { Repo } from './types/repo'
import { Commit } from './types/commit'

export async function getReposWithUnpushedCommits(dir: string): Promise<Repo[]> {
  const dirs = await getRepoFolders()

  const result = (
    await Promise.all(
      dirs.map(async (d) => {
        try {
          const git = SimpleGit(d)
          // TODO: This handles the repo not being published to GitHub.
          // Eventually, we'll want to support being able to push new repos up to GitHub
          await git.listRemote()
          return await getRepoInfo(d)
        } catch {
          return undefined
        }
      }),
    )
  )
    .filter((repo): repo is Repo => repo != null)
    .filter((repo) => repo.unpushedCommits.length > 0)

  return result

  async function getRepoFolders() {
    return (await fse.readdir(dir))
      .filter(async (file) => {
        const filePath = path.join(dir, file)
        return (await fse.stat(filePath)).isDirectory()
      })
      .map((repoDir) => path.join(dir, repoDir))
  }

  async function getRepoInfo(repoDir: string): Promise<Repo | undefined> {
    const mainBranchName = cpExecSync(`git remote show origin | sed -n '/HEAD branch/s/.*: //p`, {
      cwd: repoDir,
    }).toString('utf-8')

    if (mainBranchName == null) {
      throw Error(`Could not find main branch name for ${repoDir}`)
    }

    const repoName = await getRepoName(repoDir)

    return {
      name: repoName,
      localPath: repoDir,
      mainBranchName,
      unpushedCommits: await getUnpushedCommitsForBranch(repoDir, mainBranchName),
    }
  }
}

export async function getUnpushedCommitsForBranch(repoDir: string, branchName: string): Promise<Commit[]> {
  const git = SimpleGit(repoDir)
  const repoName = await getRepoName(repoDir)
  const lsRemote = await git.listRemote(['--heads', 'origin', branchName])
  if (lsRemote.length <= 0) {
    console.log(`No remote was found for branch ${branchName} at ${repoDir}`)
    return []
  }

  const allUnpushedCommits = (
    await git.log({
      from: `origin/${branchName}`,
      to: `${branchName}`,
    })
  ).all

  return logResultsToCommits(allUnpushedCommits, repoName, branchName).reverse()
}

export async function getRepoName(repoDir: string): Promise<string> {
  const git = SimpleGit(repoDir)
  const gitUrl = await git.remote(['get-url', 'origin'])
  if (typeof gitUrl === 'string') return parseRepoNameFromUrl(gitUrl)

  return repoDir.split('/').slice(-1)[0]

  function parseRepoNameFromUrl(url: string) {
    const nameDotGit = url.split('/').slice(-1)[0]
    return nameDotGit.split('.')[0]
  }
}

function logResultsToCommits(
  logResults: Array<DefaultLogFields & ListLogLine> | ReadonlyArray<DefaultLogFields & ListLogLine>,
  repoName: string,
  branchName: string,
): Commit[] {
  return logResults.map((lr) => ({
    ...lr,
    repoName,
    branchName,
  }))
}
