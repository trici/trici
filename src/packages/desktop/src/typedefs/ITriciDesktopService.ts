/**
 * Interface that every Desktop Service implements
 */
export interface ITriciDesktopService {
  /**
   * Initializes the service by registering action handlers and event handlers
   */
  initService(): void;
}
