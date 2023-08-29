import { ITrayService } from '../desktopServices/TrayService';
import { ITriciPlugin } from '../typedefs/ITriciPlugin';
import { FocusSession, TRICI_APP_EVENT, TrayState } from '@trici/models';

export class ChangeTrayStatePlugin implements ITriciPlugin {
  public name: string = 'ChangeTrayStatePlugin';
  public version: string = '1.0.0';
  public description: string = 'Change tray state plugin for Trici';

  private trayService: ITrayService;

  constructor(trayService: ITrayService) {
    this.trayService = trayService;
  }

  public handleEvent(event: TRICI_APP_EVENT, data: any): void {
    switch (event) {
      case TRICI_APP_EVENT.FOCUS_SESSION_STARTED:
        this.handleFocusSessionStarted(data as FocusSession);
        break;
      case TRICI_APP_EVENT.FOCUS_SESSION_ENDED:
        this.handleFocusSessionEnded(data as FocusSession);
        break;
      default:
        break;
    }
  }

  private handleFocusSessionStarted(data: FocusSession): void {
    console.log('ChangeTrayStatePlugin: Focus session started');
    this.trayService.changeTrayState(TrayState.SESSION_IN_PROGRESS);
  }

  private handleFocusSessionEnded(data: FocusSession): void {
    console.log('ChangeTrayStatePlugin: Focus session ended');
    this.trayService.changeTrayState(TrayState.DEFAULT);
  }
}
