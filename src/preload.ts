import { contextBridge } from 'electron'
import { ipcApi } from './ipc/ipc-api'
import { Storage, StorageEntryKeys } from './main/storage'

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

const reposDir = Storage.get(StorageEntryKeys.RepositoriesDirectoryPath)
const gitHubUsername = Storage.get(StorageEntryKeys.GitHubUsername)
const gitHubToken = Storage.get(StorageEntryKeys.GitHubToken)

contextBridge.exposeInMainWorld(`ipcApi`, ipcApi)
contextBridge.exposeInMainWorld('initialReposDir', reposDir)
contextBridge.exposeInMainWorld('initialGitHubUsername', gitHubUsername)
contextBridge.exposeInMainWorld('initialGitHubToken', gitHubToken)
