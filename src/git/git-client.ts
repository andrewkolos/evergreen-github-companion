import fse from 'fs-extra'
import path from 'path'
import SimpleGit, { DefaultLogFields, ListLogLine } from 'simple-git'

import { Branch } from './types/branch'
import { Commit } from './types/commit'
import { Repo } from './types/repo'
import { Scheduling } from './types/scheduling'

export class GitClient {
  #dir: string

  #reposWithUnpushedCommits: Promise<Repo[]>

  public constructor(dir: string) {
    this.#dir = dir
    this.#reposWithUnpushedCommits = getReposWithUnpushedCommits(dir)
  }

  async createSchedule(): Promise<Scheduling[]> {
    return (await this.#reposWithUnpushedCommits).flatMap((repo) =>
      repo.branches.map(
        (branch): Scheduling => ({
          branch,
          repo,
        }),
      ),
    )
  }

  async pushNextCommit({ repoPath, branchName }: { repoPath: string; branchName: string }): Promise<void> {
    const reposWithUnpushedCommits = (await this.#reposWithUnpushedCommits).slice()

    const repoInfo = reposWithUnpushedCommits.find((repo) => repo.localPath === repoPath)
    if (repoInfo == null) throw Error(`Repo with path '${repoPath}' doesn't exist or has no commits to push.`)

    const git = SimpleGit(repoPath)
    const branch = repoInfo.branches.find((b) => b.name === branchName)
    if (branch == null) {
      throw Error(`Could not find branch '${branchName}'`)
    }
    if (branch.unpushedCommits.length === 0) {
      throw Error(`There are no unpushed commits on branch '${branchName}'`)
    }

    await git.checkoutLocalBranch(branchName)

    const unstagedChangesPresent = !(await git.status(['-s'])).isClean()
    if (unstagedChangesPresent) {
      await git.stash()
    }

    await git.addConfig('sequence.editor', `"sed -i -re 's/^pick /e /'`) // Sets every commit to 'edit' in the rebase script.
    await git.rebase(['-i', `HEAD~${branch.unpushedCommits.length}`])

    for (let i = 0; i < branch.unpushedCommits.length; i += 1) {
      const date = new Date()
      date.setMinutes(date.getMinutes() - (branch.unpushedCommits.length - i)) // TODO: Try to preserve date distances instead.
      // eslint-disable-next-line no-await-in-loop -- Intentional. We need to run these git commands in sequence.
      await git.commit(['--amend', '--no-edit', '--no-verify', '--date', date.toISOString()])

      git.rebase(['--continue'])
    }

    const earliestUnPushedCommit = branch.unpushedCommits[0]

    await git.push(['origin', `${earliestUnPushedCommit.hash}:${branchName}`])

    await git.stash(['pop'])

    this.#reposWithUnpushedCommits = getReposWithUnpushedCommits(this.#dir)
  }
}

async function getReposWithUnpushedCommits(dir: string): Promise<Repo[]> {
  const dirs = await getRepoFolders()

  const result = (
    await Promise.all(
      dirs.map(async (subDir) => {
        try {
          const git = SimpleGit(subDir)
          // TODO: This handles the repo not being published to GitHub.
          // Eventually, we'll want to support being able to push new repos up to GitHub
          await git.listRemote()
          return await getRepoInfo(subDir)
        } catch {
          return undefined
        }
      }),
    )
  )
    .filter((repo): repo is Repo => repo != null)
    .filter((repo) => repo.branches.some((branch) => branch.unpushedCommits.length > 0))

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
    const git = SimpleGit(repoDir)

    const repoName = await getRepoName(repoDir)

    const branches = (await git.branchLocal()).all
    const branchesWithUnpushedCommits = (
      await Promise.all(
        branches.map(
          async (branch): Promise<Branch> => ({
            name: branch,
            repoName,
            unpushedCommits: await getUnpushedCommitsForBranch(repoDir, branch),
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

  function parseRepoNameFromUrl(url: string) {
    const nameDotGit = url.split('/').slice(-1)[0]
    return nameDotGit.split('.')[0]
  }
}
