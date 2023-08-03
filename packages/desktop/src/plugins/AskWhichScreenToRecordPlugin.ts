import { ITriciPlugin } from '../typedefs/ITriciPlugin';
import { TRICI_APP_EVENT } from '@trici/models';
import { IWindowManager } from '../desktopServices/WindowManager';
import { dispatch } from '../desktopServices/ActionDispatcher';

export class AskWhichScreenToRecordPlugin implements ITriciPlugin {
  public name: string = 'AskWhichScreenToRecordPlugin';
  public version: string = '0.0.1';
  public description: string = 'AskWhichScreenToRecordPlugin';
  private windowManager: IWindowManager;

  constructor(windowManager: IWindowManager) {
    this.windowManager = windowManager;
  }

  public handleEvent(event: TRICI_APP_EVENT, ...data: any[]): void {
    switch (event) {
      case TRICI_APP_EVENT.SESSION_STARTED_WITH_DISPLAY_TO_RECORD_NOT_SET:
        this.handleSessionStartedWithDisplayToRecordNotSet(data);
        break;
      default:
        break;
    }
  }

  private handleSessionStartedWithDisplayToRecordNotSet(data: any[]): void {
    // this.windowManager.createAndShowSettingsWindow();
    // ex: data = ['CLI'];
    const sessionStartedBy = data[0];
    if (sessionStartedBy === 'TRICI_ACTIVITY') {
      dispatch({
        type: 'SHOW_ALERT_WINDOW',
        args: { alertType: 'SCREEN_TO_RECORD_NOT_SET_AUTO_SESSION_START', quitAppOnClose: false },
      });
    } else {
      dispatch({ type: 'SHOW_ALERT_WINDOW', args: { alertType: 'SCREEN_TO_RECORD_NOT_SET', quitAppOnClose: false } });
    }
  }
}
