import { TriciAppEvent } from '@trici/models';

export interface ITriciPlugin {
  name: string;
  version: string;
  description: string;
  // initialize(pluginManager: IPluginManager): void;
  handleEvent(event: TriciAppEvent, ...data: any[]): void;
}
