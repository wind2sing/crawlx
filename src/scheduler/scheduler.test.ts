/**
 * Scheduler tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TaskScheduler } from './scheduler';
import { PriorityQueue } from './priority-queue';

describe('TaskScheduler', () => {
  let scheduler: TaskScheduler;

  beforeEach(() => {
    scheduler = new TaskScheduler({
      concurrency: 2,
      maxQueueSize: 10,
    });
  });

  afterEach(() => {
    scheduler.destroy();
  });

  describe('Task queueing', () => {
    it('should enqueue tasks', () => {
      const task = { url: 'https://example.com' };
      const taskId = scheduler.enqueue(task);
      
      expect(taskId).toBeDefined();
      expect(scheduler.getQueueStats().size).toBe(1);
    });

    it('should respect queue size limit', () => {
      const smallScheduler = new TaskScheduler({ maxQueueSize: 1 });
      
      smallScheduler.enqueue({ url: 'https://example.com/1' });
      
      expect(() => {
        smallScheduler.enqueue({ url: 'https://example.com/2' });
      }).toThrow('Queue is full');
      
      smallScheduler.destroy();
    });

    it('should handle task priorities', () => {
      const task1 = { url: 'https://example.com/1', priority: 1 };
      const task2 = { url: 'https://example.com/2', priority: 5 };
      const task3 = { url: 'https://example.com/3', priority: 3 };
      
      scheduler.enqueue(task1);
      scheduler.enqueue(task2);
      scheduler.enqueue(task3);
      
      expect(scheduler.getQueueStats().size).toBe(3);
    });
  });

  describe('Task execution', () => {
    it('should execute tasks with executor', async () => {
      const executedTasks: any[] = [];
      
      scheduler.setExecutor(async (task) => {
        executedTasks.push(task);
        return { success: true };
      });

      const task = { url: 'https://example.com' };
      scheduler.enqueue(task);
      
      // Wait a bit for task to be processed
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(executedTasks).toHaveLength(1);
      expect(executedTasks[0]).toEqual(task);
    });

    it('should handle task failures', async () => {
      const failedTasks: any[] = [];
      
      scheduler.on('task-failed', (task, error) => {
        failedTasks.push({ task, error });
      });

      scheduler.setExecutor(async () => {
        throw new Error('Task failed');
      });

      const task = { url: 'https://example.com' };
      scheduler.enqueue(task);
      
      // Wait a bit for task to be processed
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(failedTasks).toHaveLength(1);
      expect(failedTasks[0].error.message).toBe('Task failed');
    });

    it('should respect concurrency limits', async () => {
      let concurrentTasks = 0;
      let maxConcurrent = 0;
      
      scheduler.setExecutor(async () => {
        concurrentTasks++;
        maxConcurrent = Math.max(maxConcurrent, concurrentTasks);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        concurrentTasks--;
        return { success: true };
      });

      // Enqueue more tasks than concurrency limit
      for (let i = 0; i < 5; i++) {
        scheduler.enqueue({ url: `https://example.com/${i}` });
      }
      
      // Wait for all tasks to complete
      await new Promise(resolve => setTimeout(resolve, 300));
      
      expect(maxConcurrent).toBeLessThanOrEqual(2); // Concurrency limit is 2
    });
  });

  describe('Task management', () => {
    it('should cancel queued tasks', () => {
      const task = { url: 'https://example.com' };
      const taskId = scheduler.enqueue(task);
      
      const cancelled = scheduler.cancel(taskId);
      
      expect(cancelled).toBe(true);
      expect(scheduler.getQueueStats().size).toBe(0);
    });

    it('should clear all tasks', () => {
      scheduler.enqueue({ url: 'https://example.com/1' });
      scheduler.enqueue({ url: 'https://example.com/2' });
      
      scheduler.clear();
      
      expect(scheduler.getQueueStats().size).toBe(0);
    });
  });

  describe('Scheduler control', () => {
    it('should start and stop processing', () => {
      expect(scheduler.getStats().isRunning).toBe(false);
      
      scheduler.start();
      expect(scheduler.getStats().isRunning).toBe(true);
      
      scheduler.stop();
      expect(scheduler.getStats().isRunning).toBe(false);
    });

    it('should pause and resume processing', () => {
      scheduler.start();
      expect(scheduler.getStats().isRunning).toBe(true);
      
      scheduler.pause();
      expect(scheduler.getStats().isRunning).toBe(false);
      
      scheduler.resume();
      expect(scheduler.getStats().isRunning).toBe(true);
    });
  });

  describe('Statistics', () => {
    it('should provide queue statistics', () => {
      scheduler.enqueue({ url: 'https://example.com/1' });
      scheduler.enqueue({ url: 'https://example.com/2' });
      
      const stats = scheduler.getQueueStats();
      
      expect(stats.size).toBe(2);
      expect(stats.isEmpty).toBe(false);
    });

    it('should provide running task statistics', () => {
      const stats = scheduler.getRunningStats();
      
      expect(stats.count).toBe(0);
      expect(stats.byStatus).toEqual({});
      expect(stats.averageRunTime).toBe(0);
    });

    it('should provide overall statistics', () => {
      const stats = scheduler.getStats();
      
      expect(stats).toHaveProperty('queue');
      expect(stats).toHaveProperty('running');
      expect(stats).toHaveProperty('resources');
      expect(stats).toHaveProperty('isRunning');
      expect(stats).toHaveProperty('concurrency');
      expect(stats).toHaveProperty('maxQueueSize');
    });
  });

  describe('Events', () => {
    it('should emit task-queued event', () => {
      const queuedTasks: any[] = [];
      
      scheduler.on('task-queued', (task) => {
        queuedTasks.push(task);
      });

      const task = { url: 'https://example.com' };
      scheduler.enqueue(task);
      
      expect(queuedTasks).toHaveLength(1);
      expect(queuedTasks[0]).toEqual(task);
    });

    it('should emit queue-empty event', async () => {
      const events: string[] = [];
      
      scheduler.on('queue-empty', () => {
        events.push('queue-empty');
      });

      scheduler.setExecutor(async () => ({ success: true }));
      
      const task = { url: 'https://example.com' };
      scheduler.enqueue(task);
      
      // Wait for task to be processed
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(events).toContain('queue-empty');
    });
  });
});

describe('PriorityQueue', () => {
  let queue: PriorityQueue<string>;

  beforeEach(() => {
    queue = new PriorityQueue<string>();
  });

  describe('Basic operations', () => {
    it('should enqueue and dequeue items', () => {
      const id = queue.enqueue('item1', 5);
      expect(id).toBeDefined();
      expect(queue.size()).toBe(1);
      
      const item = queue.dequeue();
      expect(item?.item).toBe('item1');
      expect(item?.priority).toBe(5);
      expect(queue.size()).toBe(0);
    });

    it('should maintain priority order', () => {
      queue.enqueue('low', 1);
      queue.enqueue('high', 10);
      queue.enqueue('medium', 5);
      
      expect(queue.dequeue()?.item).toBe('high');
      expect(queue.dequeue()?.item).toBe('medium');
      expect(queue.dequeue()?.item).toBe('low');
    });

    it('should handle same priority with FIFO order', () => {
      queue.enqueue('first', 5);
      queue.enqueue('second', 5);
      
      expect(queue.dequeue()?.item).toBe('first');
      expect(queue.dequeue()?.item).toBe('second');
    });
  });

  describe('Advanced operations', () => {
    it('should remove items by ID', () => {
      const id1 = queue.enqueue('item1', 5);
      const id2 = queue.enqueue('item2', 3);
      
      const removed = queue.remove(id1);
      expect(removed).toBe(true);
      expect(queue.size()).toBe(1);
      
      const item = queue.dequeue();
      expect(item?.item).toBe('item2');
    });

    it('should update item priority', () => {
      const id1 = queue.enqueue('item1', 1);
      const id2 = queue.enqueue('item2', 5);
      
      queue.updatePriority(id1, 10);
      
      expect(queue.dequeue()?.item).toBe('item1');
      expect(queue.dequeue()?.item).toBe('item2');
    });

    it('should provide statistics', () => {
      queue.enqueue('item1', 1);
      queue.enqueue('item2', 5);
      queue.enqueue('item3', 3);
      
      const stats = queue.getStats();
      expect(stats.size).toBe(3);
      expect(stats.minPriority).toBe(1);
      expect(stats.maxPriority).toBe(5);
      expect(stats.avgPriority).toBe(3);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty queue', () => {
      expect(queue.dequeue()).toBeUndefined();
      expect(queue.peek()).toBeUndefined();
      expect(queue.isEmpty()).toBe(true);
    });

    it('should clear all items', () => {
      queue.enqueue('item1', 1);
      queue.enqueue('item2', 2);
      
      queue.clear();
      
      expect(queue.size()).toBe(0);
      expect(queue.isEmpty()).toBe(true);
    });
  });
});
