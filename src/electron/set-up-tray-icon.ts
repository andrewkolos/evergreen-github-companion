import { InheritableEventEmitter } from '@akolos/event-emitter'
import { Menu, MenuItem, Tray } from 'electron'
import { DailyCommitStatus } from '../git/daily-commit-status'
import { IpcChannelName, IpcHandlerParams } from '../ipc/ipc-channels'

export interface MyTrayIconEvents {
  PauseCheckBoxClicked: (nextValue: boolean) => void
  PushNextCommitButtonClicked: () => void
  IconClicked: () => void
}

export interface InitializeTrayIconParams {
  initialPauseCheckboxValue: boolean
}

export class MyTrayIcon extends InheritableEventEmitter<MyTrayIconEvents> {
  static #instance: MyTrayIcon | undefined

  #tray: Tray

  #pausedCheckButton: MenuItem

  static initialize(params: InitializeTrayIconParams): MyTrayIcon {
    if (this.#instance != null) {
      throw Error('Cannot initialize the tray icon after it has already been initialized.')
    }
    this.#instance = new MyTrayIcon(params)
    return this.#instance
  }

  private constructor(params: InitializeTrayIconParams) {
    super()
    const tray = new Tray('./icon.png')
    const contextMenu = new Menu()

    contextMenu.append(
      new MenuItem({
        label: 'Push next commit now',
        click: () => this.emit('PushNextCommitButtonClicked'),
      }),
    )

    const pausedCheckButton = new MenuItem({
      label: 'Pause',
      type: 'checkbox',
      checked: params.initialPauseCheckboxValue,
      click: (event) => this.emit('PauseCheckBoxClicked', event.checked),
    })
    this.#pausedCheckButton = pausedCheckButton
    contextMenu.append(pausedCheckButton)

    tray.setContextMenu(contextMenu)
    tray.addListener('click', () => this.emit('IconClicked'))
    this.#tray = tray
  }

  notifyOfEvent<T extends IpcChannelName>(channelName: T, ...args: IpcHandlerParams<T>) {
    if (channelName === IpcChannelName.DailyCommitStatusChanged) {
      // I don't know why this type assertion is necessary.
      this.updateDailyCommitStatus((args as [DailyCommitStatus])[0])
    }

    if (channelName === IpcChannelName.PausedChanged) {
      // eslint-disable-next-line prefer-destructuring
      this.#pausedCheckButton.checked = (args as [boolean])[0]
    }
  }

  updateDailyCommitStatus(status: DailyCommitStatus) {
    if (status === DailyCommitStatus.Pushed) {
      this.#tray.setImage('./green.png')
    }
    if (status === DailyCommitStatus.None) {
      this.#tray.setImage('./red.png')
    }
  }
}
