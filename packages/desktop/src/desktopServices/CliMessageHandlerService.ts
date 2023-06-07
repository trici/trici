import { CLI_MESSAGE_TYPE, FocusSession, SESSION_STARTED_BY } from "@trici/models";
import { IProcessManager } from "@trici/pm";
import { IFocusSessionService } from "./FocusSessionService";
import { ErrorMessages } from "packages/models/src/Constants";


export interface ICliMessageHandlerService {
  registerCliMessageHandlers(): void;
}

export class CliMessageHandlerService implements ICliMessageHandlerService{
  processManager: IProcessManager;
  focusSessionService: IFocusSessionService;

  constructor(processManager: IProcessManager, focusSessionService: IFocusSessionService) {
    this.processManager = processManager;
    this.focusSessionService = focusSessionService;
  }

  async handleStartFocusSession(data, socket): Promise<void> {
    try {
      const focusSession = await this.focusSessionService.startFocusSession(SESSION_STARTED_BY.CLI);
      console.log("Focus session started: ", focusSession.toJS());
      const data = {success: true, message: "Focus session started" };
      this.processManager.sendCliMessageResponse(data, socket);
    } catch (error: any) {
      let response;
      if (error.message === ErrorMessages.DEFAULT_SCREEN_TO_RECORD_NOT_SET) {
        response = {success: false, message: "Error starting focus session: Multiple monitors detected. Please set the default screen to record in the settings."};
      } else {
        response = {success: false, message: `Error starting focus session: ${error.message}`};
      }
      this.processManager.sendCliMessageResponse(response, socket);
    }
  }

  async handleEndFocusSession(data, socket): Promise<void> {
    try {
      const focusSession = await this.focusSessionService.endFocusSession();
      console.log("Focus session ended: ", focusSession.toJS());
      const data = {success: true, message: "Focus session ended" };
      this.processManager.sendCliMessageResponse(data, socket);
    } catch (error: any) {
      const focusSessionEndError = new Error(error.message);
      console.log(focusSessionEndError.message);
      this.processManager.sendCliMessageResponse({success: false, message: focusSessionEndError.message}, socket);
    }
  }

  registerCliMessageHandlers(): void {
    this.processManager.on(CLI_MESSAGE_TYPE.START_FOCUS_SESSION, (data, socket) => this.handleStartFocusSession(data, socket));
    this.processManager.on(CLI_MESSAGE_TYPE.STOP_FOCUS_SESSION, (data, socket) =>  this.handleEndFocusSession(data, socket));
  }

}
