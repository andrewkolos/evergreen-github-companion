import { EventEmitter } from '@akolos/event-emitter'
import ElectronStore from 'electron-store'

export enum StorageEntryKeys {
  RepositoriesDirectoryPath = 'RepositoriesDirectoryPath',
}

interface StorageEntries {
  [StorageEntryKeys.RepositoriesDirectoryPath]: string | undefined
}

interface SettingsEvents {
  valueChanged: <K extends StorageEntryKeys>(
    key: K,
    newValue: StorageEntries[K],
    previousValue: StorageEntries[K],
  ) => void
}

const eventEmitter = new EventEmitter<SettingsEvents>()
const storage = new ElectronStore<StorageEntries>()

export const Storage = {
  on: eventEmitter.makeDelegate('on', this),
  off: eventEmitter.makeDelegate('off', this),

  getRepositoriesDirectory(): string | undefined {
    return storage.get(StorageEntryKeys.RepositoriesDirectoryPath)
  },

  setRepositoriesDirectory(value: string) {
    const previousValue = this.getRepositoriesDirectory()
    storage.set(StorageEntryKeys.RepositoriesDirectoryPath, value)
    eventEmitter.emit('valueChanged', StorageEntryKeys.RepositoriesDirectoryPath, value, previousValue)
  },
}
