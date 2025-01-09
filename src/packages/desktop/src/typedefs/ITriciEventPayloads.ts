import { FocusSession, TriciAppEvent } from '@trici/models';
// Maybe this should be in the @trici/models package?

export interface ITriciEventPayloads {
  [TriciAppEvent.FOCUS_SESSION_STARTED]: FocusSession;
  [TriciAppEvent.FOCUS_SESSION_ENDED]: FocusSession;
}
