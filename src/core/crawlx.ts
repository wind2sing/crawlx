/**
 * CrawlX - Main Crawler Class
 */

import { EventEmitter } from 'events';

import { CrawlerOptions, TaskOptions, TaskResult, CrawlerMode, DeepPartial } from '@/types';
import { Config, ConfigFactory } from '@/config';
import { HttpClient } from '@/http';
import { TaskScheduler } from '@/scheduler';
import { PluginManager, ParsePlugin, FollowPlugin, RetryPlugin, DelayPlugin, DuplicateFilterPlugin, RateLimitPlugin } from '@/plugins';
import { Logger, ErrorManager, CrawlXError } from '@/utils';

/**
 * CrawlX events
 */
export interface CrawlXEvents {
  'crawl-start': (options: CrawlerOptions) => void;
  'crawl-complete': (results: TaskResult[]) => void;
  'crawl-error': (error: Error) => void;
  'task-queued': (task: TaskOptions) => void;
  'task-start': (task: TaskOptions) => void;
  'task-complete': (result: TaskResult) => void;
  'task-error': (error: Error, task: TaskOptions) => void;
  'url-discovered': (url: string, source: string) => void;
  'data-extracted': (data: any, url: string) => void;
}

/**
 * Main CrawlX crawler class
 */
export class CrawlX extends EventEmitter {
  private config: Config;
  private httpClient: HttpClient;
  private scheduler: TaskScheduler;
  private pluginManager: PluginManager;
  private logger: Logger;
  private errorManager: ErrorManager;
  private isRunning = false;
  private results: TaskResult[] = [];

  constructor(options: DeepPartial<CrawlerOptions> = {}) {
    super();

    // Initialize configuration
    this.config = ConfigFactory.create(options, {
      useDefaults: true,
      loadFromEnv: true,
      validateSchema: true,
    });

    // Initialize logger
    this.logger = Logger.createCombined(
      './logs/crawlx.log',
      this.config.get('logLevel', 'info')
    );

    // Initialize error manager
    this.errorManager = ErrorManager.createDefault(this.logger);

    // Initialize HTTP client
    const mode = this.config.get('mode', 'lightweight') as CrawlerMode;
    this.httpClient = HttpClient.create(mode, {
      timeout: this.config.get('timeout'),
      userAgent: this.config.get('userAgent'),
      headers: this.config.get('headers'),
      proxy: this.config.get('proxy'),
      followRedirects: this.config.get('followRedirects'),
      maxRedirects: this.config.get('maxRedirects'),
      cookies: this.config.get('cookies'),
      keepAlive: this.config.get('http.keepAlive'),
      maxSockets: this.config.get('http.maxSockets'),
    });

    // Initialize scheduler
    this.scheduler = new TaskScheduler({
      concurrency: this.config.get('concurrency'),
      maxQueueSize: this.config.get('scheduler.maxQueueSize'),
      priorityLevels: this.config.get('scheduler.priorityLevels'),
      resourceLimits: this.config.get('scheduler.resourceLimits'),
    });

    // Initialize plugin manager
    this.pluginManager = new PluginManager();
    this.setupPlugins();

    // Setup event listeners
    this.setupEventListeners();

    this.logger.info('CrawlX initialized', {
      mode,
      concurrency: this.config.get('concurrency'),
      plugins: this.pluginManager.getStats(),
    });
  }

  /**
   * Setup built-in plugins
   */
  private setupPlugins(): void {
    const pluginContext = {
      crawler: this,
      config: this.config,
      logger: this.logger,
    };

    this.pluginManager.setContext(pluginContext);

    // Register built-in plugins based on configuration
    if (this.config.get('plugins.duplicateFilter.enabled', true)) {
      this.pluginManager.register(new DuplicateFilterPlugin(
        this.config.get('plugins.duplicateFilter', {})
      ));
    }

    if (this.config.get('plugins.rateLimit.enabled', true)) {
      this.pluginManager.register(new RateLimitPlugin(
        this.config.get('plugins.rateLimit', {})
      ));
    }

    if (this.config.get('plugins.delay.enabled', true)) {
      this.pluginManager.register(new DelayPlugin(
        this.config.get('plugins.delay', {})
      ));
    }

    if (this.config.get('plugins.retry.enabled', true)) {
      this.pluginManager.register(new RetryPlugin(
        this.config.get('plugins.retry', {})
      ));
    }

    if (this.config.get('plugins.parse.enabled', true)) {
      this.pluginManager.register(new ParsePlugin(
        this.config.get('plugins.parse', {})
      ));
    }

    if (this.config.get('plugins.follow.enabled', true)) {
      this.pluginManager.register(new FollowPlugin(
        this.config.get('plugins.follow', {})
      ));
    }

    this.logger.debug('Plugins registered', {
      count: this.pluginManager.count(),
      enabled: this.pluginManager.getEnabled().map(p => p.name),
    });
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Scheduler events
    this.scheduler.on('task-queued', (task) => {
      this.emit('task-queued', task);
    });

    this.scheduler.on('task-started', (task) => {
      this.emit('task-start', task);
    });

    this.scheduler.on('task-completed', (task, result) => {
      this.results.push(result);
      this.emit('task-complete', result);
    });

    this.scheduler.on('task-failed', (task, error) => {
      this.emit('task-error', error, task);
    });

    // HTTP client events
    this.httpClient.on('request', (request) => {
      this.logger.debug('HTTP request', { url: request.url, method: request.method });
    });

    this.httpClient.on('response', (response) => {
      this.logger.debug('HTTP response', { 
        url: response.url, 
        statusCode: response.statusCode,
        size: response.body.length,
      });
    });

    this.httpClient.on('error', (error) => {
      this.logger.error('HTTP error', error);
    });

    // Plugin manager events
    this.pluginManager.on('plugin-error', (plugin, hook, error) => {
      this.logger.error(`Plugin error in ${plugin.name}:${hook}`, error);
    });
  }

  /**
   * Crawl a single URL
   */
  async crawl(url: string, options: Partial<TaskOptions> = {}): Promise<TaskResult> {
    const task: TaskOptions = {
      url,
      method: 'GET',
      headers: {},
      timeout: this.config.get('timeout'),
      priority: 0,
      metadata: {},
      ...options,
    };

    this.logger.info('Starting single URL crawl', { url });

    try {
      // Process task through plugins
      const processedTask = await this.pluginManager.executeTransformHook('onTaskCreate', task);
      
      // Execute the task
      const result = await this.executeTask(processedTask);
      
      this.logger.info('Single URL crawl completed', { url, success: true });
      return result;
    } catch (error) {
      this.logger.error('Single URL crawl failed', error as Error, { url });
      throw error;
    }
  }

  /**
   * Crawl multiple URLs
   */
  async crawlMany(urls: string[], options: Partial<TaskOptions> = {}): Promise<TaskResult[]> {
    this.logger.info('Starting multi-URL crawl', { count: urls.length });

    try {
      this.isRunning = true;
      this.results = [];
      
      this.emit('crawl-start', this.config.getAllNested());

      // Set task executor
      this.scheduler.setExecutor(async (task) => {
        return await this.executeTask(task);
      });

      // Queue all tasks
      for (const url of urls) {
        const task: TaskOptions = {
          url,
          method: 'GET',
          headers: {},
          timeout: this.config.get('timeout'),
          priority: 0,
          metadata: {},
          ...options,
        };

        try {
          const processedTask = await this.pluginManager.executeTransformHook('onTaskCreate', task);
          this.scheduler.enqueue(processedTask);
        } catch (error) {
          this.logger.warn('Task creation failed', error as Error, { url });
        }
      }

      // Start processing
      this.scheduler.start();

      // Wait for completion
      await this.waitForCompletion();

      this.emit('crawl-complete', this.results);
      this.logger.info('Multi-URL crawl completed', { 
        total: urls.length,
        successful: this.results.length,
      });

      return this.results;
    } catch (error) {
      this.emit('crawl-error', error as Error);
      this.logger.error('Multi-URL crawl failed', error as Error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Execute a single task
   */
  private async executeTask(task: TaskOptions): Promise<TaskResult> {
    try {
      // Execute onTaskStart hooks
      await this.pluginManager.executeHook('onTaskStart', task);

      // Make HTTP request
      let request = {
        url: task.url,
        method: task.method || 'GET',
        headers: task.headers || {},
        body: task.body,
        timeout: task.timeout || this.config.get('timeout'),
      };

      // Process request through plugins
      request = await this.pluginManager.executeTransformHook('onRequest', request);

      // Execute request
      let response = await this.httpClient.requestWithCheerio(request);

      // Process response through plugins
      response = await this.pluginManager.executeTransformHook('onResponse', response);

      // Create initial result
      let result: TaskResult = {
        task,
        response,
        parsed: null,
        followed: [],
        metadata: {},
      };

      // Process result through plugins (parsing, following, etc.)
      result = await this.pluginManager.executeTransformHook('onTaskComplete', result);

      // Handle followed URLs
      if (result.followed && result.followed.length > 0) {
        for (const followedTask of result.followed) {
          try {
            const processedFollowTask = await this.pluginManager.executeTransformHook('onTaskCreate', followedTask);
            this.scheduler.enqueue(processedFollowTask);
            this.emit('url-discovered', followedTask.url, task.url);
          } catch (error) {
            this.logger.warn('Failed to queue followed URL', error as Error, { 
              url: followedTask.url,
              source: task.url,
            });
          }
        }
      }

      // Emit data extraction event
      if (result.parsed) {
        this.emit('data-extracted', result.parsed, task.url);
      }

      return result;
    } catch (error) {
      // Handle error through plugins
      await this.pluginManager.executeHook('onTaskError', error, task);
      
      // Handle error through error manager
      await this.errorManager.handleError(error as Error, { task });
      
      throw error;
    }
  }

  /**
   * Wait for all tasks to complete
   */
  private async waitForCompletion(): Promise<void> {
    return new Promise((resolve) => {
      const checkCompletion = () => {
        const stats = this.scheduler.getStats();
        if (stats.queue.isEmpty && stats.running.count === 0) {
          resolve();
        } else {
          setTimeout(checkCompletion, 100);
        }
      };
      
      checkCompletion();
    });
  }

  /**
   * Stop crawling
   */
  async stop(): Promise<void> {
    this.logger.info('Stopping crawler');
    this.isRunning = false;
    this.scheduler.stop();
  }

  /**
   * Get crawler statistics
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      results: this.results.length,
      scheduler: this.scheduler.getStats(),
      httpClient: this.httpClient.getStats(),
      plugins: this.pluginManager.getStats(),
    };
  }

  /**
   * Get configuration
   */
  getConfig(): Config {
    return this.config;
  }

  /**
   * Update configuration
   */
  updateConfig(updates: DeepPartial<CrawlerOptions>): void {
    this.config.setMany(updates);
    this.logger.info('Configuration updated', updates);
  }

  /**
   * Add custom plugin
   */
  addPlugin(plugin: any): void {
    this.pluginManager.register(plugin);
    this.logger.info('Plugin added', { name: plugin.name });
  }

  /**
   * Remove plugin
   */
  removePlugin(name: string): boolean {
    const removed = this.pluginManager.unregister(name);
    if (removed) {
      this.logger.info('Plugin removed', { name });
    }
    return removed;
  }

  /**
   * Destroy crawler and cleanup resources
   */
  async destroy(): Promise<void> {
    this.logger.info('Destroying crawler');
    
    await this.stop();
    this.httpClient.destroy();
    this.scheduler.destroy();
    this.pluginManager.clear();
    await this.logger.close();
    
    this.removeAllListeners();
  }
}
