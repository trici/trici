class FixedSizeQueue<T> {
  private queue: T[];
  private maxSize: number;

  constructor(maxSize: number) {
    this.queue = [];
    this.maxSize = maxSize;
  }

  enqueue(item: T): void {
    if (this.queue.length >= this.maxSize) {
      this.queue.shift();
    }
    this.queue.push(item);
  }

  dequeue(): T | undefined {
    if (this.queue.length === 0) {
      return undefined;
    }
    return this.queue.shift();
  }

  getLength(): number {
    return this.queue.length;
  }

  getQueue(): T[] {
    return this.queue;
  }

  getLastItem(): T | undefined {
    return this.queue[this.queue.length - 1];
  }
}

export type AppChangeHistoryRecord = {
  appName: string;
  appIdentifier: string;
  timestamp: number;
};

export class AppChangeHistory {
  private queue: FixedSizeQueue<AppChangeHistoryRecord>;

  constructor() {
    this.queue = new FixedSizeQueue<AppChangeHistoryRecord>(100);
  }

  add(appChangeData: AppChangeHistoryRecord): void {
    this.queue.enqueue(appChangeData);
  }

  getHistory(numberOfItems: number): AppChangeHistoryRecord[] {
    if (numberOfItems > this.queue.getLength()) {
      return this.queue.getQueue();
    }
    return this.queue.getQueue().slice(-numberOfItems);
  }

  getLatestRecord(): AppChangeHistoryRecord | undefined {
    return this.queue.getLastItem();
  }
}
