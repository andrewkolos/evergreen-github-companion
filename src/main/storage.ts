import ElectronStore from 'electron-store'
import { inspect } from 'util'
import { Repo } from '../git/types/repo'

export enum StorageEntryKeys {
  RepositoriesDirectoryPath = 'RepositoriesDirectoryPath',
  Schedule = 'Schedule',
  Paused = 'Paused',
  GitHubUsername = 'GitHubUsername',
  GitHubToken = 'GitHubToken',
}

interface StorageEntries {
  [StorageEntryKeys.RepositoriesDirectoryPath]: string | null
  [StorageEntryKeys.Schedule]: Repo[] | null
  [StorageEntryKeys.Paused]: boolean
  [StorageEntryKeys.GitHubUsername]: string | null
  [StorageEntryKeys.GitHubToken]: string | null
}

const storageDefaults: { [key in StorageEntryKeys]: StorageEntries[key] } = {
  [StorageEntryKeys.RepositoriesDirectoryPath]: null,
  [StorageEntryKeys.Schedule]: null,
  [StorageEntryKeys.Paused]: false,
  [StorageEntryKeys.GitHubUsername]: null,
  [StorageEntryKeys.GitHubToken]: null,
}

export const storage = new ElectronStore<StorageEntries>({ defaults: storageDefaults })

export const Storage = {
  get<K extends keyof StorageEntries>(key: K): StorageEntries[K] {
    const result = storage.get(key)
    return result
  },

  set<K extends keyof StorageEntries>(key: K, value: StorageEntries[K]): void {
    storage.set(key, value)
    console.log(`Storage: set ${key} to ${inspect(value)}`)
  },
}
