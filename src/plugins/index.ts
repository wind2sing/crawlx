/**
 * Plugins module exports
 */

// Core plugin system
export { Plugin, PluginManager, type PluginContext, type PluginMetadata } from '@/core/plugin';

// Built-in plugins
export { ParsePlugin, type ParsePluginConfig } from './parse-plugin';
export { FollowPlugin, type FollowPluginConfig } from './follow-plugin';
export { RetryPlugin, type RetryPluginConfig, type RetryAttempt } from './retry-plugin';
export { DelayPlugin, type DelayPluginConfig } from './delay-plugin';
export { DuplicateFilterPlugin, type DuplicateFilterPluginConfig, type UrlFingerprint } from './duplicate-filter-plugin';
export { RateLimitPlugin, type RateLimitPluginConfig } from './rate-limit-plugin';

// Re-export types
export type { 
  PluginInterface,
  TaskOptions,
  TaskResult,
  HttpRequest,
  HttpResponse,
  ParseContext,
  FollowContext
} from '@/types';
