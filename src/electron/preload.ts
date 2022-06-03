import { MyApi } from '../service/ipc/my-api'

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

export const FrontEnd = Object.freeze({})
console.log('Preloading...')
;(window as any).myApi = MyApi.get()
