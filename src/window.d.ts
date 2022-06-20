import { ipcApi } from './ipc/ipc-api'

// eslint-disable-next-line @typescript-eslint/naming-convention
declare global {
  interface Window {
    ipcApi: typeof ipcApi
    initialReposDir: string | null
    initialGitHubUsername: string | null
    initialGitHubToken: string | null
    initialSchedule: null | Promise<Schedule[]>
  }
}
