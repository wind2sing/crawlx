/**
 * Scheduler tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TaskScheduler } from './scheduler';
import { PriorityQueue } from './priority-queue';
import { ResourceManager } from './resource-manager';

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

      // Start processing
      scheduler.start();

      const task = { url: 'https://example.com' };
      scheduler.enqueue(task);

      // Wait for task to be processed and queue to become empty
      await new Promise(resolve => setTimeout(resolve, 500));

      expect(events).toContain('queue-empty');

      scheduler.stop();
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

describe('ResourceManager', () => {
  let resourceManager: ResourceManager;

  beforeEach(() => {
    resourceManager = new ResourceManager({
      maxMemoryUsage: 100 * 1024 * 1024, // 100MB for testing
      maxCpuUsage: 50,
      maxActiveConnections: 10,
      maxQueueSize: 20,
      checkInterval: 100, // Fast interval for testing
    });
  });

  afterEach(() => {
    resourceManager.destroy();
  });

  describe('Initialization', () => {
    it('should initialize with default limits', () => {
      const defaultManager = new ResourceManager();
      const limits = defaultManager.getLimits();

      expect(limits.maxMemoryUsage).toBe(1024 * 1024 * 1024); // 1GB
      expect(limits.maxCpuUsage).toBe(80);
      expect(limits.maxActiveConnections).toBe(100);
      expect(limits.maxQueueSize).toBe(1000);
      expect(limits.checkInterval).toBe(5000);

      defaultManager.destroy();
    });

    it('should initialize with custom limits', () => {
      const limits = resourceManager.getLimits();

      expect(limits.maxMemoryUsage).toBe(100 * 1024 * 1024);
      expect(limits.maxCpuUsage).toBe(50);
      expect(limits.maxActiveConnections).toBe(10);
      expect(limits.maxQueueSize).toBe(20);
      expect(limits.checkInterval).toBe(100);
    });

    it('should provide initial resource usage', () => {
      const usage = resourceManager.getCurrentUsage();

      expect(usage).toHaveProperty('memory');
      expect(usage).toHaveProperty('cpu');
      expect(usage).toHaveProperty('activeConnections');
      expect(usage).toHaveProperty('queueSize');

      expect(usage.memory.used).toBeGreaterThan(0);
      expect(usage.memory.total).toBeGreaterThan(0);
      expect(usage.memory.percentage).toBeGreaterThan(0);
      expect(usage.activeConnections).toBe(0);
      expect(usage.queueSize).toBe(0);
    });
  });

  describe('Resource monitoring', () => {
    it('should emit resource-update events', async () => {
      const updates: any[] = [];

      resourceManager.on('resource-update', (usage) => {
        updates.push(usage);
      });

      // Wait for at least one update
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(updates.length).toBeGreaterThan(0);
      expect(updates[0]).toHaveProperty('memory');
      expect(updates[0]).toHaveProperty('cpu');
    });

    it('should stop monitoring when destroyed', async () => {
      const updates: any[] = [];

      resourceManager.on('resource-update', (usage) => {
        updates.push(usage);
      });

      // Wait for initial updates
      await new Promise(resolve => setTimeout(resolve, 150));
      const initialCount = updates.length;

      resourceManager.stopMonitoring();

      // Wait more time
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should not have received more updates
      expect(updates.length).toBe(initialCount);
    });
  });

  describe('Resource limits checking', () => {
    it('should check if resources are within limits', () => {
      expect(resourceManager.isWithinLimits()).toBe(true);

      // Simulate high resource usage
      resourceManager.updateActiveConnections(15); // Above limit of 10
      expect(resourceManager.isWithinLimits()).toBe(false);
    });

    it('should check specific resource availability', () => {
      expect(resourceManager.isResourceAvailable('connections')).toBe(true);
      expect(resourceManager.isResourceAvailable('queue')).toBe(true);
      expect(resourceManager.isResourceAvailable('memory')).toBe(true);
      expect(resourceManager.isResourceAvailable('cpu')).toBe(true);

      resourceManager.updateActiveConnections(10); // At limit
      expect(resourceManager.isResourceAvailable('connections')).toBe(false);

      resourceManager.updateQueueSize(20); // At limit
      expect(resourceManager.isResourceAvailable('queue')).toBe(false);
    });

    it('should emit limit warning events', async () => {
      const warnings: any[] = [];

      resourceManager.on('limit-warning', (type, current, limit) => {
        warnings.push({ type, current, limit });
      });

      // Set connections to warning threshold (80% of 10 = 8)
      resourceManager.updateActiveConnections(9);

      // Wait for monitoring cycle
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0].type).toBe('connections');
    });

    it('should emit limit exceeded events', async () => {
      const exceeded: any[] = [];

      resourceManager.on('limit-exceeded', (type, current, limit) => {
        exceeded.push({ type, current, limit });
      });

      // Set connections above limit
      resourceManager.updateActiveConnections(15);

      // Wait for monitoring cycle
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(exceeded.length).toBeGreaterThan(0);
      expect(exceeded[0].type).toBe('connections');
      expect(exceeded[0].current).toBe(15);
      expect(exceeded[0].limit).toBe(10);
    });
  });

  describe('Resource utilization', () => {
    it('should calculate resource utilization percentages', () => {
      resourceManager.updateActiveConnections(5); // 50% of 10
      resourceManager.updateQueueSize(10); // 50% of 20

      const utilization = resourceManager.getUtilization();

      expect(utilization.connections).toBe(50);
      expect(utilization.queue).toBe(50);
      expect(utilization.memory).toBeGreaterThan(0);
      expect(utilization.cpu).toBeGreaterThanOrEqual(0);
    });

    it('should calculate available capacity', () => {
      resourceManager.updateActiveConnections(3);
      resourceManager.updateQueueSize(5);

      const capacity = resourceManager.getAvailableCapacity();

      expect(capacity.connections).toBe(7); // 10 - 3
      expect(capacity.queue).toBe(15); // 20 - 5
      expect(capacity.memory).toBeGreaterThan(0);
      expect(capacity.cpu).toBeGreaterThan(0);
    });

    it('should determine memory pressure level', () => {
      // Mock utilization to test different pressure levels
      const originalGetUtilization = resourceManager.getUtilization;

      resourceManager.getUtilization = vi.fn().mockReturnValue({ memory: 30 });
      expect(resourceManager.getMemoryPressure()).toBe('low');

      resourceManager.getUtilization = vi.fn().mockReturnValue({ memory: 60 });
      expect(resourceManager.getMemoryPressure()).toBe('medium');

      resourceManager.getUtilization = vi.fn().mockReturnValue({ memory: 80 });
      expect(resourceManager.getMemoryPressure()).toBe('high');

      resourceManager.getUtilization = vi.fn().mockReturnValue({ memory: 95 });
      expect(resourceManager.getMemoryPressure()).toBe('critical');

      // Restore original method
      resourceManager.getUtilization = originalGetUtilization;
    });
  });

  describe('Configuration management', () => {
    it('should update resource limits', () => {
      resourceManager.updateLimits({
        maxActiveConnections: 20,
        maxQueueSize: 50,
      });

      const limits = resourceManager.getLimits();
      expect(limits.maxActiveConnections).toBe(20);
      expect(limits.maxQueueSize).toBe(50);
      // Other limits should remain unchanged
      expect(limits.maxMemoryUsage).toBe(100 * 1024 * 1024);
      expect(limits.maxCpuUsage).toBe(50);
    });

    it('should update external resource counters', () => {
      resourceManager.updateActiveConnections(5);
      resourceManager.updateQueueSize(10);

      const usage = resourceManager.getCurrentUsage();
      expect(usage.activeConnections).toBe(5);
      expect(usage.queueSize).toBe(10);
    });
  });

  describe('Memory management', () => {
    it('should attempt garbage collection if available', () => {
      // Mock global.gc
      const originalGc = global.gc;
      global.gc = vi.fn();

      const result = resourceManager.forceGarbageCollection();
      expect(result).toBe(true);
      expect(global.gc).toHaveBeenCalled();

      // Restore
      global.gc = originalGc;
    });

    it('should handle missing garbage collection', () => {
      const originalGc = global.gc;
      delete (global as any).gc;

      const result = resourceManager.forceGarbageCollection();
      expect(result).toBe(false);

      // Restore
      global.gc = originalGc;
    });
  });

  describe('Edge cases', () => {
    it('should handle resource manager destruction', () => {
      const spy = vi.spyOn(resourceManager, 'stopMonitoring');
      const removeListenersSpy = vi.spyOn(resourceManager, 'removeAllListeners');

      resourceManager.destroy();

      expect(spy).toHaveBeenCalled();
      expect(removeListenersSpy).toHaveBeenCalled();
    });

    it('should handle invalid resource type checks', () => {
      expect(resourceManager.isResourceAvailable('invalid' as any)).toBe(false);
    });

    it('should provide consistent resource snapshots', () => {
      const usage1 = resourceManager.getCurrentUsage();
      const usage2 = resourceManager.getCurrentUsage();

      // Should be different objects (deep copy)
      expect(usage1).not.toBe(usage2);
      expect(usage1).toEqual(usage2);
    });
  });
});
