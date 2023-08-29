

/**
 * Error thrown when there are multiple displays connected to the system
 * and the user has not specified which display to record.
 */
export class DisplayNotSelectedError extends Error {
  constructor(message: string = "Default display to record not set") {
    super();
    this.name = "DisplayNotSelectedError";
    this.message = message;
  }
}

export class FocusSessionInProgressError extends Error {
  constructor(message: string = "Focus session already in progress") {
    super();
    this.name = "FocusSessionInProgressError";
    this.message = message;
  }
}

