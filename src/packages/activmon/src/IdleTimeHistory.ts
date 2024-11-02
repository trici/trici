// A queue follows the FIFO (First In First Out) principle.

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
}

export class IdleTimeHistory {
  private queue: FixedSizeQueue<number>;

  constructor() {
    this.queue = new FixedSizeQueue<number>(100);
  }

  add(idleTime: number): void {
    this.queue.enqueue(idleTime);
  }

  getHistory(): number[] {
    return this.queue.getQueue();
  }
}
