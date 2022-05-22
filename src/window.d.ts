import { Scheduler } from './service/ipc/scheduler'
import { Storage } from './service/ipc/storage'

// eslint-disable-next-line @typescript-eslint/naming-convention
declare global {
  interface Window {
    schedulerFactory: (reposDir: string) => Promise<Scheduler>
    storage: typeof Storage
  }
}
