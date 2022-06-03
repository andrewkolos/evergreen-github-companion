import { EventEmitter } from '@akolos/event-emitter'
import ElectronStore from 'electron-store'
import { Scheduling } from '../git/types/scheduling'

export enum StorageEntryKeys {
  RepositoriesDirectoryPath = 'RepositoriesDirectoryPath',
  Schedule = 'Schedule',
  Paused = 'Paused',
}

interface StorageEntries {
  [StorageEntryKeys.RepositoriesDirectoryPath]: string | null
  [StorageEntryKeys.Schedule]: Scheduling[] | null
  [StorageEntryKeys.Paused]: boolean
}

interface StorageEvents {
  valueChanged: <K extends StorageEntryKeys>(
    key: K,
    newValue: StorageEntries[K],
    previousValue: StorageEntries[K],
  ) => void
}

const storageDefaults: { [key in StorageEntryKeys]: StorageEntries[key] } = {
  [StorageEntryKeys.RepositoriesDirectoryPath]: null,
  [StorageEntryKeys.Schedule]: null,
  [StorageEntryKeys.Paused]: false,
}

const eventEmitter = new EventEmitter<StorageEvents>()
const storage = new ElectronStore<StorageEntries>({ defaults: storageDefaults })

export const Storage = {
  on: eventEmitter.makeDelegate('on', this),
  off: eventEmitter.makeDelegate('off', this),

  get<K extends keyof StorageEntries>(key: K): StorageEntries[K] {
    const result = storage.get(key)
    return result
  },

  set<K extends keyof StorageEntries>(key: K, value: StorageEntries[K]): void {
    const currentValue = storage.get(key)
    storage.set(key, value)
    eventEmitter.emit('valueChanged', key, value, currentValue)
  },
}
