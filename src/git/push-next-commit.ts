import { execSync as cpExecSync } from 'child_process'
import SimpleGit from 'simple-git'
import { getUnpushedCommitsForBranch } from './get-repos-with-unpushed-commits'
import { Repo } from './types/repo'

export async function pushNextCommit(repo: Repo) {
  if (repo.unpushedCommits.length === 0) {
    throw Error(`There are no unpushed commits for ${repo.name}`)
  }
  console.log(`Pushing next commit for ${repo.name}. Next commit ${repo.unpushedCommits[0].message}`)

  const execSync = (command: string) => {
    console.log(`==> ${command}`)
    cpExecSync(command, { cwd: repo.localPath })
  }

  execSync(`git checkout ${repo.mainBranchName}`)

  const unstagedChangesPresent = !(await SimpleGit(repo.localPath).status(['-s'])).isClean()
  if (unstagedChangesPresent) {
    execSync(`git stash`)
  }

  execSync(`git -c sequence.editor="sed -i -re 's/^pick /e /'" rebase -i HEAD~${repo.unpushedCommits.length}`)

  for (let i = 0; i < repo.unpushedCommits.length; i += 1) {
    const date = new Date()
    date.setMinutes(date.getMinutes() - (repo.unpushedCommits.length - i)) // TODO: Try to preserve date distances instead.
    execSync(`git commit --amend --no-edit --no-verify --date ${date.toISOString()}`)
    execSync(`git rebase --continue`)
  }

  const newEarliestUnpushedCommit = (await getUnpushedCommitsForBranch(repo.localPath, repo.mainBranchName))[0]
  execSync(`git push origin ${newEarliestUnpushedCommit.hash}:${repo.mainBranchName}`)

  if (unstagedChangesPresent) {
    execSync(`git stash pop`)
  }
}
