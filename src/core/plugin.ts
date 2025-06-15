/**
 * Plugin System - Base plugin class and plugin manager
 */

import { EventEmitter } from 'events';

import { PluginInterface, TaskOptions, TaskResult, HttpRequest, HttpResponse, ParseContext, FollowContext } from '@/types';

/**
 * Plugin execution context
 */
export interface PluginContext {
  crawler: any;
  config: any;
  logger: any;
}

/**
 * Plugin metadata
 */
export interface PluginMetadata {
  name: string;
  version: string;
  description?: string;
  author?: string;
  dependencies?: string[];
  tags?: string[];
}

/**
 * Abstract base plugin class
 */
export abstract class Plugin implements PluginInterface {
  public readonly name: string;
  public readonly version: string;
  public readonly priority: number;
  protected context?: PluginContext;
  protected enabled = true;

  constructor(name: string, version: string = '1.0.0', priority: number = 100) {
    this.name = name;
    this.version = version;
    this.priority = priority;
  }

  /**
   * Get plugin metadata
   */
  getMetadata(): PluginMetadata {
    return {
      name: this.name,
      version: this.version,
      description: this.getDescription?.(),
      author: this.getAuthor?.(),
      dependencies: this.getDependencies?.(),
      tags: this.getTags?.(),
    };
  }

  /**
   * Set plugin context
   */
  setContext(context: PluginContext): void {
    this.context = context;
  }

  /**
   * Enable plugin
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * Disable plugin
   */
  disable(): void {
    this.enabled = false;
  }

  /**
   * Check if plugin is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  // Optional metadata methods
  protected getDescription?(): string;
  protected getAuthor?(): string;
  protected getDependencies?(): string[];
  protected getTags?(): string[];

  // Lifecycle hooks (all optional)
  onInit?(crawler: any): void | Promise<void>;
  onStart?(crawler: any): void | Promise<void>;
  onStop?(crawler: any): void | Promise<void>;
  onDestroy?(crawler: any): void | Promise<void>;

  // Task hooks (all optional)
  onTaskCreate?(task: TaskOptions): TaskOptions | Promise<TaskOptions>;
  onTaskStart?(task: TaskOptions): void | Promise<void>;
  onTaskComplete?(result: TaskResult): TaskResult | Promise<TaskResult>;
  onTaskError?(error: Error, task: TaskOptions): void | Promise<void>;
  onTaskRetry?(task: TaskOptions, attempt: number): void | Promise<void>;

  // Request/Response hooks (all optional)
  onRequest?(request: HttpRequest): HttpRequest | Promise<HttpRequest>;
  onResponse?(response: HttpResponse): HttpResponse | Promise<HttpResponse>;

  // Parse hooks (all optional)
  onParse?(context: ParseContext): any | Promise<any>;
  onFollow?(context: FollowContext): TaskOptions[] | Promise<TaskOptions[]>;
}

/**
 * Plugin manager for registering and managing plugins
 */
export class PluginManager extends EventEmitter {
  private plugins = new Map<string, Plugin>();
  private pluginOrder: string[] = [];
  private context?: PluginContext;

  /**
   * Set plugin context
   */
  setContext(context: PluginContext): void {
    this.context = context;
  }

  /**
   * Register a plugin
   */
  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin '${plugin.name}' is already registered`);
    }

    // Check dependencies
    this.checkDependencies(plugin);

    // Set context if available
    if (this.context) {
      plugin.setContext(this.context);
    }

    this.plugins.set(plugin.name, plugin);
    this.updatePluginOrder();

    this.emit('plugin-registered', plugin);
  }

  /**
   * Unregister a plugin
   */
  unregister(name: string): boolean {
    const plugin = this.plugins.get(name);
    if (!plugin) return false;

    // Check if other plugins depend on this one
    this.checkDependents(name);

    this.plugins.delete(name);
    this.updatePluginOrder();

    this.emit('plugin-unregistered', plugin);
    return true;
  }

  /**
   * Get plugin by name
   */
  get(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Get all plugins
   */
  getAll(): Plugin[] {
    return this.pluginOrder.map(name => this.plugins.get(name)!);
  }

  /**
   * Get enabled plugins
   */
  getEnabled(): Plugin[] {
    return this.getAll().filter(plugin => plugin.isEnabled());
  }

  /**
   * Enable plugin
   */
  enable(name: string): boolean {
    const plugin = this.plugins.get(name);
    if (plugin) {
      plugin.enable();
      this.emit('plugin-enabled', plugin);
      return true;
    }
    return false;
  }

  /**
   * Disable plugin
   */
  disable(name: string): boolean {
    const plugin = this.plugins.get(name);
    if (plugin) {
      plugin.disable();
      this.emit('plugin-disabled', plugin);
      return true;
    }
    return false;
  }

  /**
   * Check if plugin exists
   */
  has(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * Get plugin count
   */
  count(): number {
    return this.plugins.size;
  }

  /**
   * Clear all plugins
   */
  clear(): void {
    this.plugins.clear();
    this.pluginOrder = [];
    this.emit('plugins-cleared');
  }

  /**
   * Execute lifecycle hook on all enabled plugins
   */
  async executeHook<T extends keyof PluginInterface>(
    hook: T,
    ...args: Parameters<NonNullable<PluginInterface[T]>>
  ): Promise<any[]> {
    const results: any[] = [];
    const enabledPlugins = this.getEnabled();

    for (const plugin of enabledPlugins) {
      const hookFn = plugin[hook] as Function;
      if (typeof hookFn === 'function') {
        try {
          const result = await hookFn.apply(plugin, args);
          results.push(result);
        } catch (error) {
          this.emit('plugin-error', plugin, hook, error);
          throw error;
        }
      }
    }

    return results;
  }

  /**
   * Execute hook with transformation (for request/response/task modification)
   */
  async executeTransformHook<T>(
    hook: keyof PluginInterface,
    initialValue: T,
    ...additionalArgs: any[]
  ): Promise<T> {
    let currentValue = initialValue;
    const enabledPlugins = this.getEnabled();

    for (const plugin of enabledPlugins) {
      const hookFn = plugin[hook] as Function;
      if (typeof hookFn === 'function') {
        try {
          const result = await hookFn.apply(plugin, [currentValue, ...additionalArgs]);
          if (result !== undefined) {
            currentValue = result;
          }
        } catch (error) {
          this.emit('plugin-error', plugin, hook, error);
          throw error;
        }
      }
    }

    return currentValue;
  }

  /**
   * Get plugin statistics
   */
  getStats() {
    const plugins = this.getAll();
    const enabled = plugins.filter(p => p.isEnabled());
    const disabled = plugins.filter(p => !p.isEnabled());

    return {
      total: plugins.length,
      enabled: enabled.length,
      disabled: disabled.length,
      byPriority: plugins.reduce((acc, plugin) => {
        const priority = plugin.priority;
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
      }, {} as Record<number, number>),
    };
  }

  /**
   * Update plugin execution order based on priority
   */
  private updatePluginOrder(): void {
    this.pluginOrder = Array.from(this.plugins.keys()).sort((a, b) => {
      const pluginA = this.plugins.get(a)!;
      const pluginB = this.plugins.get(b)!;
      return pluginB.priority - pluginA.priority; // Higher priority first
    });
  }

  /**
   * Check plugin dependencies
   */
  private checkDependencies(plugin: Plugin): void {
    const dependencies = plugin.getMetadata().dependencies || [];
    
    for (const dep of dependencies) {
      if (!this.plugins.has(dep)) {
        throw new Error(`Plugin '${plugin.name}' depends on '${dep}' which is not registered`);
      }
    }
  }

  /**
   * Check if other plugins depend on this plugin
   */
  private checkDependents(name: string): void {
    for (const plugin of this.plugins.values()) {
      const dependencies = plugin.getMetadata().dependencies || [];
      if (dependencies.includes(name)) {
        throw new Error(`Cannot unregister '${name}' because '${plugin.name}' depends on it`);
      }
    }
  }
}
