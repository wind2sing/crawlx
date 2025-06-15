/**
 * Core module exports
 */

export { CrawlX, type CrawlXEvents } from './crawlx';
export { Plugin, PluginManager, type PluginContext, type PluginMetadata } from './plugin';

// Re-export types
export type {
  CrawlerOptions,
  TaskOptions,
  TaskResult,
  CrawlerMode,
  DeepPartial,
  PluginInterface,
} from '@/types';
