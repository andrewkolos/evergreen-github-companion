import { ipcApi } from './ipc/ipc-api'

// eslint-disable-next-line @typescript-eslint/naming-convention
declare global {
  interface Window {
    ipcApi: typeof ipcApi
    initialReposDir: string
    initialSchedule: null | Promise<Schedule[]>
  }
}
