import { MyApi } from './preload'

declare global {
  export interface Window {
    myApi: MyApi
  }
}
