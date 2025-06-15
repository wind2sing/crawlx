/**
 * Retry Plugin - Handles automatic retries for failed requests
 */

import { Plugin } from '@/core/plugin';
import { TaskOptions, TaskResult, HttpRequest } from '@/types';

/**
 * Retry plugin configuration
 */
export interface RetryPluginConfig {
  enabled?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  exponentialBackoff?: boolean;
  backoffMultiplier?: number;
  maxDelay?: number;
  retryStatusCodes?: number[];
  retryCondition?: (error: Error, attempt: number) => boolean;
}

/**
 * Retry attempt information
 */
export interface RetryAttempt {
  attempt: number;
  error: Error;
  delay: number;
  timestamp: number;
}

/**
 * Retry plugin for handling failed requests
 */
export class RetryPlugin extends Plugin {
  private config: RetryPluginConfig;
  private retryAttempts = new Map<string, RetryAttempt[]>();

  constructor(config: RetryPluginConfig = {}) {
    super('retry', '1.0.0', 50); // Lower priority to run after other plugins
    
    this.config = {
      enabled: true,
      maxRetries: 3,
      retryDelay: 1000,
      exponentialBackoff: true,
      backoffMultiplier: 2,
      maxDelay: 30000,
      retryStatusCodes: [408, 429, 500, 502, 503, 504],
      ...config,
    };
  }

  protected getDescription(): string {
    return 'Automatically retries failed requests with configurable backoff strategies';
  }

  protected getAuthor(): string {
    return 'CrawlX Team';
  }

  protected getTags(): string[] {
    return ['retry', 'reliability', 'error-handling'];
  }

  /**
   * Initialize plugin
   */
  async onInit(): Promise<void> {
    if (this.context?.logger) {
      this.context.logger.info('Retry plugin initialized');
    }
  }

  /**
   * Set retry metadata on task creation
   */
  async onTaskCreate(task: TaskOptions): Promise<TaskOptions> {
    if (!this.enabled) return task;

    // Initialize retry metadata
    if (!task.metadata) {
      task.metadata = {};
    }
    
    if (typeof task.metadata.retryCount === 'undefined') {
      task.metadata.retryCount = 0;
    }

    // Override max retries if specified in task
    if (typeof task.retries === 'number') {
      task.metadata.maxRetries = task.retries;
    } else {
      task.metadata.maxRetries = this.config.maxRetries;
    }

    return task;
  }

  /**
   * Handle task errors and determine if retry is needed
   */
  async onTaskError(error: Error, task: TaskOptions): Promise<void> {
    if (!this.enabled) return;

    const retryCount = task.metadata?.retryCount || 0;
    const maxRetries = task.metadata?.maxRetries || this.config.maxRetries!;

    // Check if we should retry
    if (this.shouldRetry(error, retryCount, maxRetries, task)) {
      const attempt = retryCount + 1;
      const delay = this.calculateDelay(attempt);

      // Record retry attempt
      this.recordRetryAttempt(task.url, attempt, error, delay);

      // Update task metadata
      task.metadata = task.metadata || {};
      task.metadata.retryCount = attempt;
      task.metadata.lastRetryAt = Date.now();
      task.metadata.nextRetryAt = Date.now() + delay;

      if (this.context?.logger) {
        this.context.logger.warn(`Retrying task ${task.url} (attempt ${attempt}/${maxRetries}) after ${delay}ms`, {
          error: error.message,
          attempt,
          maxRetries,
          delay,
        });
      }

      // Schedule retry (this would be handled by the crawler/scheduler)
      // Note: Plugin doesn't have emit method, use context instead
      if (this.context?.logger) {
        this.context.logger.debug(`Retry scheduled for ${task.url}`, { attempt, delay });
      }
    } else {
      if (this.context?.logger) {
        this.context.logger.error(`Task ${task.url} failed permanently after ${retryCount} retries`, {
          error: error.message,
          retryCount,
          maxRetries,
        });
      }

      // Note: Plugin doesn't have emit method, use context instead
      if (this.context?.logger) {
        this.context.logger.warn(`Retry exhausted for ${task.url}`, { error: error.message });
      }
    }
  }

  /**
   * Handle retry notification
   */
  async onTaskRetry(task: TaskOptions, attempt: number): Promise<void> {
    if (!this.enabled) return;

    if (this.context?.logger) {
      this.context.logger.info(`Retrying task ${task.url} (attempt ${attempt})`);
    }

    // Note: Plugin doesn't have emit method, use context instead
    if (this.context?.logger) {
      this.context.logger.debug(`Retry executed for ${task.url}`, { attempt });
    }
  }

  /**
   * Determine if task should be retried
   */
  private shouldRetry(error: Error, retryCount: number, maxRetries: number, task: TaskOptions): boolean {
    // Check retry count
    if (retryCount >= maxRetries) {
      return false;
    }

    // Check custom retry condition
    if (this.config.retryCondition) {
      return this.config.retryCondition(error, retryCount + 1);
    }

    // Check for HTTP status codes (if error contains status code)
    const statusCode = this.extractStatusCode(error);
    if (statusCode && this.config.retryStatusCodes!.includes(statusCode)) {
      return true;
    }

    // Check for network errors
    if (this.isNetworkError(error)) {
      return true;
    }

    // Check for timeout errors
    if (this.isTimeoutError(error)) {
      return true;
    }

    return false;
  }

  /**
   * Calculate retry delay with optional exponential backoff
   */
  private calculateDelay(attempt: number): number {
    let delay = this.config.retryDelay!;

    if (this.config.exponentialBackoff) {
      delay = delay * Math.pow(this.config.backoffMultiplier!, attempt - 1);
    }

    // Add jitter to prevent thundering herd
    delay = delay + Math.random() * 1000;

    // Cap at max delay
    return Math.min(delay, this.config.maxDelay!);
  }

  /**
   * Extract HTTP status code from error
   */
  private extractStatusCode(error: Error): number | null {
    // Try to extract status code from error message or properties
    const statusMatch = error.message.match(/status code (\d+)/i);
    if (statusMatch) {
      return parseInt(statusMatch[1], 10);
    }

    // Check if error has statusCode property
    if ('statusCode' in error && typeof error.statusCode === 'number') {
      return error.statusCode;
    }

    return null;
  }

  /**
   * Check if error is a network error
   */
  private isNetworkError(error: Error): boolean {
    const networkErrors = [
      'ECONNRESET',
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT',
      'ECONNABORTED',
      'EHOSTUNREACH',
      'ENETUNREACH',
    ];

    return networkErrors.some(code => 
      error.message.includes(code) || 
      ('code' in error && error.code === code)
    );
  }

  /**
   * Check if error is a timeout error
   */
  private isTimeoutError(error: Error): boolean {
    return error.message.toLowerCase().includes('timeout') ||
           error.message.includes('ETIMEDOUT') ||
           ('code' in error && error.code === 'ETIMEDOUT');
  }

  /**
   * Record retry attempt
   */
  private recordRetryAttempt(url: string, attempt: number, error: Error, delay: number): void {
    if (!this.retryAttempts.has(url)) {
      this.retryAttempts.set(url, []);
    }

    const attempts = this.retryAttempts.get(url)!;
    attempts.push({
      attempt,
      error,
      delay,
      timestamp: Date.now(),
    });

    // Keep only recent attempts to prevent memory leaks
    if (attempts.length > 10) {
      attempts.splice(0, attempts.length - 10);
    }
  }

  /**
   * Get retry attempts for URL
   */
  getRetryAttempts(url: string): RetryAttempt[] {
    return this.retryAttempts.get(url) || [];
  }

  /**
   * Clear retry history
   */
  clearRetryHistory(): void {
    this.retryAttempts.clear();
  }

  /**
   * Update plugin configuration
   */
  updateConfig(config: Partial<RetryPluginConfig>): void {
    Object.assign(this.config, config);
  }

  /**
   * Get plugin configuration
   */
  getConfig(): RetryPluginConfig {
    return { ...this.config };
  }

  /**
   * Get plugin statistics
   */
  getStats() {
    const allAttempts = Array.from(this.retryAttempts.values()).flat();
    
    return {
      enabled: this.enabled,
      config: this.config,
      totalRetries: allAttempts.length,
      urlsWithRetries: this.retryAttempts.size,
      averageRetries: this.retryAttempts.size > 0 
        ? allAttempts.length / this.retryAttempts.size 
        : 0,
      retriesByAttempt: allAttempts.reduce((acc, attempt) => {
        acc[attempt.attempt] = (acc[attempt.attempt] || 0) + 1;
        return acc;
      }, {} as Record<number, number>),
    };
  }

  /**
   * Test retry condition
   */
  testRetryCondition(error: Error, attempt: number, task: TaskOptions): boolean {
    return this.shouldRetry(error, attempt - 1, this.config.maxRetries!, task);
  }
}
