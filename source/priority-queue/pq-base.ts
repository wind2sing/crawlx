interface cmpFunction<T> {
  (one: T, other: T): number;
}
export { cmpFunction };
export default abstract class BaseQueue<T> {
  compare: cmpFunction<T>;
  constructor(cmp: cmpFunction<T>) {
    this.compare = cmp;
  }

  abstract enqueue(item: T): Promise<void>;
  abstract dequeue(): Promise<T>;
  abstract peek(): Promise<T>;
  abstract getSize(): Promise<number>;
  abstract clear(): Promise<void>;
  abstract values(): AsyncGenerator<T>;

  [Symbol.asyncIterator]() {
    return this.values();
  }
  async initialize() {}
  async dispose() {}
  async enqueueAll(...items: Array<T>) {
    for (const item of items) {
      await this.enqueue(item);
    }
  }
}
