import fse from 'fs-extra'
import path from 'path'
import SimpleGit, { DefaultLogFields, ListLogLine } from 'simple-git'
import { inspect } from 'util'
import { Branch } from './types/branch'
import { Commit } from './types/commit'
import { Repo } from './types/repo'

const GIT_HUB_REPO_DIR_PATH = 'C:/Users/Jozz/Documents/GitHub/'

let reposWithUnpushedCommits: Repo[] | undefined

export const GitClient = Object.freeze({
  async getReposWithUnpushedCommits(): Promise<Repo[]> {
    if (reposWithUnpushedCommits) return reposWithUnpushedCommits

    const dirs = await getRepoFolders()

    const result = (
      await Promise.all(
        dirs.map(async (dir) => {
          const git = SimpleGit(dir)
          try {
            // TODO: This handles the repo not being published to GitHub.
            // Eventually, we'll want to support being able to push new repos up to GitHub
            await git.listRemote()
            return await getRepoInfo(dir)
          } catch {
            return undefined
          }
        }),
      )
    )
      .filter((repo): repo is Repo => repo != null)
      .filter((repo) => repo.branches.some((branch) => branch.unpushedCommits.length > 0))

    reposWithUnpushedCommits = result
    return result
  },

  async pushNextCommit({ repoPath, branchName }: { repoPath: string; branchName: string }): Promise<void> {
    if (reposWithUnpushedCommits == null) reposWithUnpushedCommits = await this.getReposWithUnpushedCommits()
    const repoInfo = reposWithUnpushedCommits.find((repo) => repo.localPath === repoPath)
    if (repoInfo == null) throw Error(`Repo with path '${repoPath}' doesn't exist or has no commits to push.`)
    const git = SimpleGit(repoPath)
    console.log('entered path', repoPath)
    const branch = repoInfo.branches.find((b) => b.name === branchName)
    if (branch == null) {
      console.error('but')
      throw Error(`Could not find branch '${branchName}'`)
    }
    if (branch.unpushedCommits.length === 0) {
      console.error('uhnfwe')
      throw Error(`There are no unpushed commits on branch '${branchName}'`)
    }
    console.log('checking out', branchName)
    await git.checkoutLocalBranch(branchName)

    const unstagedChangesPresent = !(await git.status(['-s'])).isClean()
    if (unstagedChangesPresent) {
      await git.stash()
    }

    console.log(`git -c sequence.editor="sed -i -re 's/^pick /e /'" -i HEAD~${branch.unpushedCommits.length}`)
    await git.addConfig('sequence.editor', `"sed -i -re 's/^pick /e /'`) // Sets every commit to 'edit' in the rebase script.
    await git.rebase(['-i', `HEAD~${branch.unpushedCommits.length}`])

    for (let i = 0; i < branch.unpushedCommits.length; i += 1) {
      const date = new Date()
      date.setMinutes(date.getMinutes() - (branch.unpushedCommits.length - i)) // TODO: Try to preserve date distances instead.
      // eslint-disable-next-line no-await-in-loop -- Intentional. We need to run these git commands in sequence.
      await git.commit(['--amend', '--no-edit', '--date', date.toISOString()])

      console.log(`git commit --amend --no-edit --date ${date.toISOString()}`)
    }

    const earliestUnPushedCommit = branch.unpushedCommits[0]

    // await git.push('origin', branchName, [`${earliestUnPushedCommit.hash}:${branchName}`])
    console.log(`git push origin ${branchName} ${earliestUnPushedCommit.hash}:${branchName}`)

    git.stash(['pop'])
  },
})

async function getRepoFolders() {
  return (await fse.readdir(GIT_HUB_REPO_DIR_PATH))
    .filter(async (file) => {
      const filePath = path.join(GIT_HUB_REPO_DIR_PATH, file)
      return (await fse.stat(filePath)).isDirectory()
    })
    .map((dir) => path.join(GIT_HUB_REPO_DIR_PATH, dir))
}

function parseRepoNameFromUrl(gitUrl: string) {
  const nameDotGit = gitUrl.split('/').slice(-1)[0]
  return nameDotGit.split('.')[0]
}

async function getRepoInfo(dir: string): Promise<Repo | undefined> {
  const git = SimpleGit(dir)

  const repoName = await getRepoName(dir)

  const branches = (await git.branchLocal()).all
  const branchesWithUnpushedCommits = (
    await Promise.all(
      branches.map(
        async (branch): Promise<Branch> => ({
          name: branch,
          repoName,
          unpushedCommits: await getUnpushedCommitsForBranch(dir, branch),
        }),
      ),
    )
  ).filter((branch) => branch.unpushedCommits.length > 0)

  return {
    name: repoName,
    localPath: dir,
    branches: branchesWithUnpushedCommits,
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

async function getUnpushedCommitsForBranch(repoDir: string, branchName: string): Promise<Commit[]> {
  const git = SimpleGit(repoDir)
  const repoName = await getRepoName(repoDir)
  const lsRemote = await git.listRemote(['--heads', 'origin', branchName])
  if (lsRemote.length <= 0) {
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

async function getRepoName(repoDir: string): Promise<string> {
  const git = SimpleGit(repoDir)
  const gitUrl = await git.remote(['get-url', 'origin'])
  if (typeof gitUrl === 'string') return parseRepoNameFromUrl(gitUrl)

  return repoDir.split('/').slice(-1)[0]
}
