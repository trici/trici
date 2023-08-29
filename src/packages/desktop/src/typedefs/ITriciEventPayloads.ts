import { FocusSession, TRICI_APP_EVENT } from '@trici/models';
// Maybe this should be in the @trici/models package?


export interface ITriciEventPayloads {
  [TRICI_APP_EVENT.FOCUS_SESSION_STARTED]: FocusSession;
  [TRICI_APP_EVENT.FOCUS_SESSION_ENDED]: FocusSession;
}
