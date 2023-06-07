

/**
 * Error thrown when there are multiple displays connected to the system
 * and the user has not specified which display to record.
 */
export class DisplayNotSelectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DisplayNotSelectedError";
  }
}

