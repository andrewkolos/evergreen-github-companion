import fse from 'fs-extra'
import path from 'path'
import SimpleGit from 'simple-git'
import { Branch } from './types/branch'
import { Repo } from './types/repo'

const GIT_HUB_REPO_DIR_PATH = 'C:/Users/Jozz/Documents/GitHub/'

export interface MakeAndPushCommitParams {
  repoPath: string
  branchName: string
  commitHash: string
}

export const GitClient = Object.freeze({
  async getReposWithUnpushedCommits(): Promise<Repo[]> {
    const dirs = (await fse.readdir(GIT_HUB_REPO_DIR_PATH))
      .filter(async (file) => {
        const filePath = path.join(GIT_HUB_REPO_DIR_PATH, file)
        return (await fse.stat(filePath)).isDirectory()
      })
      .map((dir) => path.join(GIT_HUB_REPO_DIR_PATH, dir))

    return Promise.all(dirs.map((dir) => getRepoInfo(dir)).filter((repo) => repo != null))
  },

  async pushNextCommit({ repoPath, branchName }: MakeAndPushCommitParams): Promise<void> {
    const git = SimpleGit(repoPath)
    const repoInfo = await getRepoInfo(repoPath)
    const branch = repoInfo.branches.find((b) => b.name === branchName)
    if (branch == null) {
      throw Error(`Could not find branch '${branchName}'`)
    }
    if (branch.unpushedCommits.length === 0) {
      throw Error(`There are no unpushed commits on branch '${branchName}'`)
    }
    const earliestUnPushedCommit = branch.unpushedCommits
      .slice()
      .sort((c1, c2) => new Date(c1.date).getTime() - new Date(c2.date).getTime())[0]

    await git.checkoutLocalBranch(branchName)
    await git.push('origin', branchName, [`${earliestUnPushedCommit.hash}:${branchName}`])
  },
})

function parseRepoNameFromUrl(gitUrl: string) {
  const nameDotGit = gitUrl.split('/').slice(-1)[0]
  return nameDotGit.split('.')[0]
}

async function getRepoInfo(dir: string): Promise<Repo> {
  const git = SimpleGit(dir)
  const branches = (await git.branchLocal()).all
  const branchesWithUnpushedCommits = await Promise.all(
    branches.map(async (branch) => {
      const logResults = (
        await git.log({
          from: `origin/${branch}`,
          to: `${branch}`,
        })
      ).all

      const result: Branch = {
        name: branch,
        unpushedCommits: logResults,
      }
      return result
    }),
  )

  const gitUrl = await git.remote(['get-url', 'origin'])
  if (typeof gitUrl !== 'string') return undefined
  if (branchesWithUnpushedCommits.length === 0) return undefined
  return {
    name: parseRepoNameFromUrl(gitUrl),
    localPath: dir,
    branches: branchesWithUnpushedCommits,
  }
}
