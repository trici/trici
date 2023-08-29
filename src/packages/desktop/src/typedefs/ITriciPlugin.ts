import { TRICI_APP_EVENT } from "@trici/models";

export interface ITriciPlugin {
  name: string;
  version: string;
  description: string;
  // initialize(pluginManager: IPluginManager): void;
  handleEvent(event: TRICI_APP_EVENT, ...data: any[]): void;
}
