/**
 * Task Scheduler - Manages task execution with concurrency control and resource management
 */

import { EventEmitter } from 'events';

import { TaskOptions, TaskState, SchedulerOptions } from '@/types';
import { PriorityQueue, MultiLevelPriorityQueue } from './priority-queue';
import { ResourceManager, ResourceLimits } from './resource-manager';

/**
 * Scheduler events
 */
export interface SchedulerEvents {
  'task-queued': (task: TaskOptions) => void;
  'task-started': (task: TaskOptions) => void;
  'task-completed': (task: TaskOptions, result: any) => void;
  'task-failed': (task: TaskOptions, error: Error) => void;
  'task-cancelled': (task: TaskOptions) => void;
  'queue-empty': () => void;
  'queue-full': () => void;
  'concurrency-limit': (current: number, limit: number) => void;
  'resource-limit': (type: string, current: number, limit: number) => void;
}

/**
 * Task execution function type
 */
export type TaskExecutor<T = any> = (task: TaskOptions) => Promise<T>;

/**
 * Task Scheduler class
 */
export class TaskScheduler extends EventEmitter {
  private queue: PriorityQueue<TaskOptions> | MultiLevelPriorityQueue<TaskOptions>;
  private resourceManager: ResourceManager;
  private options: Required<SchedulerOptions>;
  private runningTasks = new Map<string, TaskState>();
  private taskExecutor?: TaskExecutor;
  private isRunning = false;
  private processingInterval?: NodeJS.Timeout;

  constructor(options: SchedulerOptions = {}) {
    super();

    this.options = {
      concurrency: options.concurrency ?? 5,
      maxQueueSize: options.maxQueueSize ?? 1000,
      priorityLevels: options.priorityLevels ?? 5,
      resourceLimits: options.resourceLimits ?? {},
    };

    // Initialize queue
    if (this.options.priorityLevels > 1) {
      const levels = Array.from({ length: this.options.priorityLevels }, (_, i) => i);
      this.queue = new MultiLevelPriorityQueue(levels);
    } else {
      this.queue = new PriorityQueue();
    }

    // Initialize resource manager
    this.resourceManager = new ResourceManager({
      maxQueueSize: this.options.maxQueueSize,
      maxActiveConnections: this.options.concurrency,
      ...this.options.resourceLimits,
    });

    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    this.resourceManager.on('limit-exceeded', (type, current, limit) => {
      this.emit('resource-limit', type, current, limit);
    });

    this.resourceManager.on('limit-warning', (type, current, limit) => {
      // Handle resource warnings
    });
  }

  /**
   * Set task executor function
   */
  setExecutor(executor: TaskExecutor): void {
    this.taskExecutor = executor;
  }

  /**
   * Add task to queue
   */
  enqueue(task: TaskOptions): string {
    if (this.queue.size() >= this.options.maxQueueSize) {
      this.emit('queue-full');
      throw new Error('Queue is full');
    }

    const priority = task.priority ?? 0;
    const taskId = this.queue.enqueue(task, priority);
    
    // Update resource manager
    this.resourceManager.updateQueueSize(this.queue.size());
    
    this.emit('task-queued', task);
    
    // Start processing if not already running
    if (!this.isRunning) {
      this.start();
    }

    return taskId;
  }

  /**
   * Remove task from queue
   */
  dequeue(taskId: string): boolean {
    const removed = this.queue.remove(taskId);
    if (removed) {
      this.resourceManager.updateQueueSize(this.queue.size());
    }
    return removed;
  }

  /**
   * Cancel running task
   */
  cancel(taskId: string): boolean {
    const taskState = this.runningTasks.get(taskId);
    if (taskState) {
      taskState.status = 'cancelled';
      this.runningTasks.delete(taskId);
      this.resourceManager.updateActiveConnections(this.runningTasks.size);
      this.emit('task-cancelled', taskState as any);
      return true;
    }
    return this.dequeue(taskId);
  }

  /**
   * Start task processing
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 100); // Check every 100ms
  }

  /**
   * Stop task processing
   */
  stop(): void {
    this.isRunning = false;
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }
  }

  /**
   * Process queue and execute tasks
   */
  private async processQueue(): Promise<void> {
    // Check if we can process more tasks
    if (!this.canProcessMoreTasks()) {
      return;
    }

    const queueItem = this.queue.dequeue();
    if (!queueItem) {
      if (this.runningTasks.size === 0) {
        this.emit('queue-empty');
      }
      return;
    }

    const task = queueItem.item;
    const taskState: TaskState = {
      id: queueItem.id,
      status: 'running',
      priority: queueItem.priority,
      retries: 0,
      createdAt: queueItem.timestamp,
      startedAt: Date.now(),
    };

    this.runningTasks.set(queueItem.id, taskState);
    this.resourceManager.updateActiveConnections(this.runningTasks.size);
    this.resourceManager.updateQueueSize(this.queue.size());

    this.emit('task-started', task);

    // Execute task
    this.executeTask(task, taskState);
  }

  /**
   * Execute a single task
   */
  private async executeTask(task: TaskOptions, taskState: TaskState): Promise<void> {
    try {
      if (!this.taskExecutor) {
        throw new Error('No task executor set');
      }

      const result = await this.taskExecutor(task);
      
      taskState.status = 'completed';
      taskState.completedAt = Date.now();
      
      this.runningTasks.delete(taskState.id);
      this.resourceManager.updateActiveConnections(this.runningTasks.size);
      
      this.emit('task-completed', task, result);
    } catch (error) {
      taskState.status = 'failed';
      taskState.error = error as Error;
      taskState.completedAt = Date.now();
      
      this.runningTasks.delete(taskState.id);
      this.resourceManager.updateActiveConnections(this.runningTasks.size);
      
      this.emit('task-failed', task, error as Error);
    }
  }

  /**
   * Check if we can process more tasks
   */
  private canProcessMoreTasks(): boolean {
    // Check concurrency limit
    if (this.runningTasks.size >= this.options.concurrency) {
      this.emit('concurrency-limit', this.runningTasks.size, this.options.concurrency);
      return false;
    }

    // Check resource limits
    if (!this.resourceManager.isWithinLimits()) {
      return false;
    }

    return true;
  }

  /**
   * Get queue statistics
   */
  getQueueStats() {
    return {
      size: this.queue.size(),
      isEmpty: this.queue.isEmpty(),
      ...this.queue.getStats(),
    };
  }

  /**
   * Get running task statistics
   */
  getRunningStats() {
    const tasks = Array.from(this.runningTasks.values());
    
    return {
      count: tasks.length,
      byStatus: tasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      averageRunTime: tasks.length > 0 
        ? tasks.reduce((sum, task) => {
            const runTime = task.startedAt ? Date.now() - task.startedAt : 0;
            return sum + runTime;
          }, 0) / tasks.length
        : 0,
    };
  }

  /**
   * Get resource statistics
   */
  getResourceStats() {
    return this.resourceManager.getCurrentUsage();
  }

  /**
   * Get overall statistics
   */
  getStats() {
    return {
      queue: this.getQueueStats(),
      running: this.getRunningStats(),
      resources: this.getResourceStats(),
      isRunning: this.isRunning,
      concurrency: this.options.concurrency,
      maxQueueSize: this.options.maxQueueSize,
    };
  }

  /**
   * Update scheduler options
   */
  updateOptions(options: Partial<SchedulerOptions>): void {
    Object.assign(this.options, options);
    
    if (options.resourceLimits) {
      this.resourceManager.updateLimits(options.resourceLimits);
    }
  }

  /**
   * Clear all tasks
   */
  clear(): void {
    this.queue.clear();
    this.runningTasks.clear();
    this.resourceManager.updateQueueSize(0);
    this.resourceManager.updateActiveConnections(0);
  }

  /**
   * Pause task processing
   */
  pause(): void {
    this.stop();
  }

  /**
   * Resume task processing
   */
  resume(): void {
    this.start();
  }

  /**
   * Destroy scheduler
   */
  destroy(): void {
    this.stop();
    this.clear();
    this.resourceManager.destroy();
    this.removeAllListeners();
  }
}
