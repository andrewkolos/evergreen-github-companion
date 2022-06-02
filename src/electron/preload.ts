// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

export class MyApi {
  static async create() {}

  private constructor() {}
}
const myApi = {
  async getScheduling() {
    return Promise.resolve()
  },
}

export interface Scheduling {
  repoName: string
  branchName: string
  commitName: string
}

;(window as any).myApi = { loadRepos: () => Promise.resolve([]) }
