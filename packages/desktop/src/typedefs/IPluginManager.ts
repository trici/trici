import { TRICI_APP_EVENT } from '@trici/models';
import { ITriciPlugin } from './ITriciPlugin';
import { ITriciEventPayloads } from './ITriciEventPayloads';

export interface IPluginManager {
  register(plugin: ITriciPlugin): void;
  on<E extends TRICI_APP_EVENT>(event: E, listener: (data: ITriciEventPayloads[E]) => void): void;
  off<E extends TRICI_APP_EVENT>(event: E, listener: (data: ITriciEventPayloads[E]) => void): void;
  emit<E extends TRICI_APP_EVENT>(event: E, data: ITriciEventPayloads[E]): void;
}
