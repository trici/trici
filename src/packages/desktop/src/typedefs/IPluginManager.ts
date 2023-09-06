import { ITriciPlugin } from './ITriciPlugin';
import { ITriciEventPayloads } from './ITriciEventPayloads';

export interface IPluginManager {
  register(plugin: ITriciPlugin): void;
  emit<E extends keyof ITriciEventPayloads>(event: E, data: ITriciEventPayloads[E]): void;
}
