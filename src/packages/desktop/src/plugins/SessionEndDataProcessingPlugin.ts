import { ITriciPlugin } from 'src/typedefs/ITriciPlugin';
import { Constants, FocusSession, TriciAppEvent } from '@trici/models';
import { IAppEventRepository } from '@trici/dal';
import * as fs from 'fs';
import { Logger, IConsoleLogger } from '@trici/logger';

export class SessionEndDataProcessingPlugin implements ITriciPlugin {
  public name: string = 'SessionEndDataProcessingPlugin';
  public version: string = '1.0.0';
  public description: string = 'Session end data processing plugin for Trici';
  appEventRepository: IAppEventRepository;
  getLogger: () => Logger | IConsoleLogger;

  constructor(appEventRepository: IAppEventRepository, getLogger: () => Logger | IConsoleLogger) {
    this.appEventRepository = appEventRepository;
    this.getLogger = getLogger;
  }

  public handleEvent(event: TriciAppEvent, ...data: any[]): void {
    const [focusSession] = data;
    if (event === TriciAppEvent.FOCUS_SESSION_ENDED) {
      this.handleFocusSessionEnded(focusSession as FocusSession);
    }
  }

  private async handleFocusSessionEnded(focusSession: FocusSession): Promise<void> {
    try {
      // get the app events for the focus session
      const startTime = focusSession.get('startTime');
      const endTime = focusSession.get('endTime');
      const appEvents = await this.appEventRepository.getAllAppEvents(startTime, endTime);
      this.getLogger().info('App events: ', appEvents);

      // write the app events to a file in the same directory as the focus session
      let filePath;
      let storageLocation = focusSession.get('storageLocation');
      if (storageLocation === Constants.EMPTY_STRING) {
        filePath = `${global.userDataDirectoryCheckResult.recordingsDir.path}/${focusSession.get('startTime')}/${focusSession.get('startTime')}.csv`;
      } else {
        filePath = `${storageLocation}/${focusSession.get('startTime')}.csv`;
      }

      const fileContent = appEvents
        .map(event => `${event.id},${event.type},${event.timestamp},${JSON.stringify(event.data)}`)
        .join('\n');
      fs.writeFileSync(filePath, fileContent);
    } catch (error) {
      this.getLogger().error('Error writing app events to file: ', error);
    }
  }
}
