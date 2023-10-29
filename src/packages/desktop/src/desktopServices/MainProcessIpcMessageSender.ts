/**
 * This service is responsible for sending all ipc messages to the specified renderer process.
 */
import { WindowManager, WindowName } from './WindowManager';

export interface IMainProcessIpcMessageSender {
  send(windowId: string, message: any): void;
}

/**
 * This service is responsible for sending messages to a specific window.
 * It depends on the WindowManager to get the window instance.
 */
export class MainProcessIpcMessageSender implements IMainProcessIpcMessageSender {
  private windowManager: WindowManager;

  constructor(windowManager: WindowManager) {
    this.windowManager = windowManager;
  }

  /**
   * Sends a message to the specified window.
   * @param windowId The id of the window to send the message to. {'settings', 'main', 'alert', 'onboarding'}
   * @param message The message to send.
   */
  public send(windowName: WindowName, message: any): void {
    const window = this.windowManager.getWindow(windowName);
    if (window) {
      window.webContents.send('messageFromMain', message);
    }
  }
}
