/**
 * CliMessageHandlerService.ts
 *
 */
import { CLIMessageType, DisplayNotSelectedError, SessionTrigger } from '@trici/models';
import { IProcessManager } from '@trici/pm';
import { IFocusSessionService } from './FocusSessionService';

export interface ICliMessageHandlerService {
  registerCliMessageHandlers(): void;
}

export class CliMessageHandlerService implements ICliMessageHandlerService {
  processManager: IProcessManager;
  focusSessionService: IFocusSessionService;

  /**
   * Creates an instance of CliMessageHandlerService.
   * @param {IProcessManager} processManager
   * @param {IFocusSessionService} focusSessionService
   */
  constructor(processManager: IProcessManager, focusSessionService: IFocusSessionService) {
    this.processManager = processManager;
    this.focusSessionService = focusSessionService;
  }

  async handleStartFocusSession(data: any, socket: any): Promise<void> {
    /**
     * Here we are not dispatching an action to start the Focus Session but calling the FocusSessionService directly.
     * This is because to send a response to the cli, we need the socket on which the message was received.
     * This is a special case for a desktop service where the pattern of dispatching an action as well as
     * handling AppEvents is not followed.
     */
    try {
      const focusSession = await this.focusSessionService.startFocusSession(SessionTrigger.CLI, {});
      console.log('Focus session started: ', focusSession.toJS());
      const data = { success: true, message: 'Focus session started' };
      this.processManager.sendCliMessageResponse(data, socket);
    } catch (error: any) {
      let response;
      if (error instanceof DisplayNotSelectedError) {
        response = {
          success: false,
          message:
            'Error starting focus session: Multiple monitors detected. Please set the default screen to record in the settings.',
        };
      } else {
        response = { success: false, message: `Error starting focus session: ${error.message}` };
      }
      this.processManager.sendCliMessageResponse(response, socket);
    }
  }

  async handleEndFocusSession(data: any, socket: any): Promise<void> {
    try {
      const focusSession = await this.focusSessionService.endFocusSession(SessionTrigger.CLI);
      console.log('Focus session ended: ', focusSession.toJS());
      const data = { success: true, message: 'Focus session ended' };
      this.processManager.sendCliMessageResponse(data, socket);
    } catch (error: any) {
      const focusSessionEndError = new Error(error.message);
      console.log(focusSessionEndError.message);
      this.processManager.sendCliMessageResponse({ success: false, message: focusSessionEndError.message }, socket);
    }
  }

  registerCliMessageHandlers(): void {
    this.processManager.on(CLIMessageType.START_FOCUS_SESSION, (data, socket) =>
      this.handleStartFocusSession(data, socket),
    );
    this.processManager.on(CLIMessageType.STOP_FOCUS_SESSION, (data, socket) =>
      this.handleEndFocusSession(data, socket),
    );
  }
}
