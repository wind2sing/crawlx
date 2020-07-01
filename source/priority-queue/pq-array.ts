import BaseQueue, { cmpFunction } from "./pq-base";

export default class PriorityQueueArray<T> extends BaseQueue<T> {
  data: Array<T>;
  private length: number;
  constructor(compare: cmpFunction<T> = defaultCompare, data = []) {
    super(compare);
    this.data = data;
    this.length = this.data.length;
    if (this.length > 0) {
      for (let i = (this.length >> 1) - 1; i >= 0; i--) this._down(i);
    }
  }
  async getSize() {
    return this.length;
  }
  async clear() {
    this.data = [];
    this.length = 0;
  }
  async *values() {
    // Clone this because we don't want to mutate the original priority queue by
    // iterating over its elements.
    const priorityQueue = await this.clone();
    while (await priorityQueue.getSize()) {
      yield await priorityQueue.dequeue();
    }
  }
  async clone() {
    let newInstance = new PriorityQueueArray<T>(this.compare, this.data);
    return newInstance;
  }

  async enqueue(item: T) {
    this.data.push(item);
    this.length++;
    this._up(this.length - 1);
  }

  async dequeue() {
    if (this.length === 0) return undefined;
    const top = this.data[0];
    const bottom = this.data.pop();
    this.length--;

    if (this.length > 0) {
      this.data[0] = bottom;
      this._down(0);
    }
    return top;
  }

  async peek() {
    return this.data[0];
  }

  _up(pos: number) {
    const { data, compare } = this;
    const item = data[pos];

    while (pos > 0) {
      const parent = (pos - 1) >> 1;
      const current = data[parent];
      if (compare(item, current) >= 0) break;
      data[pos] = current;
      pos = parent;
    }

    data[pos] = item;
  }

  _down(pos: number) {
    const { data, compare } = this;
    const halfLength = this.length >> 1;
    const item = data[pos];

    while (pos < halfLength) {
      let left = (pos << 1) + 1;
      let best = data[left];
      const right = left + 1;

      if (right < this.length && compare(data[right], best) < 0) {
        left = right;
        best = data[right];
      }
      if (compare(best, item) >= 0) break;

      data[pos] = best;
      pos = left;
    }

    data[pos] = item;
  }
}

function defaultCompare<T>(a: T, b: T): number {
  return a < b ? 1 : a > b ? -1 : 0;
}
