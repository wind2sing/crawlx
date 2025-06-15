/**
 * Priority Queue Implementation
 */

/**
 * Priority queue item
 */
export interface PriorityQueueItem<T> {
  item: T;
  priority: number;
  timestamp: number;
  id: string;
}

/**
 * Priority queue interface
 */
export interface IPriorityQueue<T> {
  enqueue(item: T, priority?: number): string;
  dequeue(): PriorityQueueItem<T> | undefined;
  peek(): PriorityQueueItem<T> | undefined;
  remove(id: string): boolean;
  clear(): void;
  size(): number;
  isEmpty(): boolean;
  toArray(): PriorityQueueItem<T>[];
}

/**
 * Binary heap-based priority queue implementation
 * Higher priority values are dequeued first
 */
export class PriorityQueue<T> implements IPriorityQueue<T> {
  private heap: PriorityQueueItem<T>[] = [];
  private idCounter = 0;

  /**
   * Add item to queue with priority
   */
  enqueue(item: T, priority: number = 0): string {
    const id = `pq_${++this.idCounter}_${Date.now()}`;
    const queueItem: PriorityQueueItem<T> = {
      item,
      priority,
      timestamp: Date.now(),
      id,
    };

    this.heap.push(queueItem);
    this.heapifyUp(this.heap.length - 1);
    
    return id;
  }

  /**
   * Remove and return highest priority item
   */
  dequeue(): PriorityQueueItem<T> | undefined {
    if (this.heap.length === 0) return undefined;
    if (this.heap.length === 1) return this.heap.pop();

    const root = this.heap[0];
    this.heap[0] = this.heap.pop()!;
    this.heapifyDown(0);
    
    return root;
  }

  /**
   * Return highest priority item without removing
   */
  peek(): PriorityQueueItem<T> | undefined {
    return this.heap.length > 0 ? this.heap[0] : undefined;
  }

  /**
   * Remove item by ID
   */
  remove(id: string): boolean {
    const index = this.heap.findIndex(item => item.id === id);
    if (index === -1) return false;

    // Replace with last item and heapify
    const lastItem = this.heap.pop()!;
    if (index < this.heap.length) {
      this.heap[index] = lastItem;
      this.heapifyUp(index);
      this.heapifyDown(index);
    }

    return true;
  }

  /**
   * Clear all items
   */
  clear(): void {
    this.heap = [];
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.heap.length;
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  /**
   * Convert to array (sorted by priority)
   */
  toArray(): PriorityQueueItem<T>[] {
    return [...this.heap].sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority; // Higher priority first
      }
      return a.timestamp - b.timestamp; // Earlier timestamp first for same priority
    });
  }

  /**
   * Get items by priority range
   */
  getByPriorityRange(minPriority: number, maxPriority: number): PriorityQueueItem<T>[] {
    return this.heap.filter(item => 
      item.priority >= minPriority && item.priority <= maxPriority
    );
  }

  /**
   * Update item priority
   */
  updatePriority(id: string, newPriority: number): boolean {
    const index = this.heap.findIndex(item => item.id === id);
    if (index === -1) return false;

    const oldPriority = this.heap[index].priority;
    this.heap[index].priority = newPriority;

    if (newPriority > oldPriority) {
      this.heapifyUp(index);
    } else if (newPriority < oldPriority) {
      this.heapifyDown(index);
    }

    return true;
  }

  /**
   * Get statistics
   */
  getStats() {
    if (this.heap.length === 0) {
      return {
        size: 0,
        minPriority: 0,
        maxPriority: 0,
        avgPriority: 0,
        oldestTimestamp: 0,
        newestTimestamp: 0,
      };
    }

    const priorities = this.heap.map(item => item.priority);
    const timestamps = this.heap.map(item => item.timestamp);

    return {
      size: this.heap.length,
      minPriority: Math.min(...priorities),
      maxPriority: Math.max(...priorities),
      avgPriority: priorities.reduce((sum, p) => sum + p, 0) / priorities.length,
      oldestTimestamp: Math.min(...timestamps),
      newestTimestamp: Math.max(...timestamps),
    };
  }

  /**
   * Heapify up (bubble up)
   */
  private heapifyUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      
      if (this.compare(this.heap[index], this.heap[parentIndex]) <= 0) {
        break;
      }

      this.swap(index, parentIndex);
      index = parentIndex;
    }
  }

  /**
   * Heapify down (bubble down)
   */
  private heapifyDown(index: number): void {
    while (true) {
      let maxIndex = index;
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;

      if (leftChild < this.heap.length && 
          this.compare(this.heap[leftChild], this.heap[maxIndex]) > 0) {
        maxIndex = leftChild;
      }

      if (rightChild < this.heap.length && 
          this.compare(this.heap[rightChild], this.heap[maxIndex]) > 0) {
        maxIndex = rightChild;
      }

      if (maxIndex === index) break;

      this.swap(index, maxIndex);
      index = maxIndex;
    }
  }

  /**
   * Compare two queue items
   * Returns positive if a has higher priority than b
   */
  private compare(a: PriorityQueueItem<T>, b: PriorityQueueItem<T>): number {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    // For same priority, earlier timestamp has higher priority
    return b.timestamp - a.timestamp;
  }

  /**
   * Swap two items in heap
   */
  private swap(i: number, j: number): void {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }
}

/**
 * Multi-level priority queue with separate queues for different priority levels
 */
export class MultiLevelPriorityQueue<T> implements IPriorityQueue<T> {
  private queues: Map<number, PriorityQueue<T>> = new Map();
  private priorityLevels: number[] = [];

  constructor(priorityLevels: number[] = [0, 1, 2, 3, 4, 5]) {
    this.priorityLevels = [...priorityLevels].sort((a, b) => b - a); // Descending order
    
    // Initialize queues for each priority level
    for (const level of this.priorityLevels) {
      this.queues.set(level, new PriorityQueue<T>());
    }
  }

  /**
   * Add item to appropriate priority queue
   */
  enqueue(item: T, priority: number = 0): string {
    const level = this.findPriorityLevel(priority);
    const queue = this.queues.get(level)!;
    return queue.enqueue(item, priority);
  }

  /**
   * Remove highest priority item from highest priority queue
   */
  dequeue(): PriorityQueueItem<T> | undefined {
    for (const level of this.priorityLevels) {
      const queue = this.queues.get(level)!;
      if (!queue.isEmpty()) {
        return queue.dequeue();
      }
    }
    return undefined;
  }

  /**
   * Peek at highest priority item
   */
  peek(): PriorityQueueItem<T> | undefined {
    for (const level of this.priorityLevels) {
      const queue = this.queues.get(level)!;
      if (!queue.isEmpty()) {
        return queue.peek();
      }
    }
    return undefined;
  }

  /**
   * Remove item by ID from all queues
   */
  remove(id: string): boolean {
    for (const queue of this.queues.values()) {
      if (queue.remove(id)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Clear all queues
   */
  clear(): void {
    for (const queue of this.queues.values()) {
      queue.clear();
    }
  }

  /**
   * Get total size across all queues
   */
  size(): number {
    return Array.from(this.queues.values())
      .reduce((total, queue) => total + queue.size(), 0);
  }

  /**
   * Check if all queues are empty
   */
  isEmpty(): boolean {
    return Array.from(this.queues.values())
      .every(queue => queue.isEmpty());
  }

  /**
   * Convert all queues to sorted array
   */
  toArray(): PriorityQueueItem<T>[] {
    const allItems: PriorityQueueItem<T>[] = [];
    
    for (const level of this.priorityLevels) {
      const queue = this.queues.get(level)!;
      allItems.push(...queue.toArray());
    }
    
    return allItems;
  }

  /**
   * Find appropriate priority level for given priority
   */
  private findPriorityLevel(priority: number): number {
    for (const level of this.priorityLevels) {
      if (priority >= level) {
        return level;
      }
    }
    return this.priorityLevels[this.priorityLevels.length - 1];
  }

  /**
   * Get queue statistics by level
   */
  getStatsByLevel(): Map<number, any> {
    const stats = new Map();
    
    for (const [level, queue] of this.queues) {
      stats.set(level, queue.getStats());
    }
    
    return stats;
  }

  /**
   * Get overall statistics
   */
  getStats() {
    const levelStats = Array.from(this.getStatsByLevel().values());
    
    if (levelStats.length === 0) {
      return {
        size: 0,
        levels: 0,
        minPriority: 0,
        maxPriority: 0,
        avgPriority: 0,
      };
    }

    const totalSize = levelStats.reduce((sum, stats) => sum + stats.size, 0);
    const allPriorities = levelStats.flatMap(stats => 
      stats.size > 0 ? [stats.minPriority, stats.maxPriority] : []
    );

    return {
      size: totalSize,
      levels: this.priorityLevels.length,
      minPriority: allPriorities.length > 0 ? Math.min(...allPriorities) : 0,
      maxPriority: allPriorities.length > 0 ? Math.max(...allPriorities) : 0,
      avgPriority: levelStats.reduce((sum, stats) => sum + stats.avgPriority * stats.size, 0) / totalSize || 0,
    };
  }
}
