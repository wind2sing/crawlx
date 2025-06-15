/**
 * CrawlX - Advanced Web Crawler and Scraper
 *
 * A powerful, flexible, and extensible web crawling library for Node.js
 * with built-in parsing, following, rate limiting, and plugin system.
 */

// Main exports
export { CrawlX } from './core/crawlx';

// Factory functions
export {
  createCrawler,
  createLightweightCrawler,
  createHighPerformanceCrawler,
  createScraper,
  createSpider,
  createMonitor,
  createValidator,
  createCrawlerByType,
  quickCrawl,
  batchCrawl,
} from './utils/factory';

// Configuration
export {
  Config,
  ConfigFactory,
  ConfigUtils,
  ConfigPresets,
} from './config';

// Parser
export {
  Parser,
  QueryParser,
  Filters,
  parseQuery,
} from './parser';

// HTTP Client
export {
  HttpClient,
  HttpUtils,
  LightweightClient,
  HighPerformanceClient,
} from './http';

// Scheduler
export {
  TaskScheduler,
  PriorityQueue,
  ResourceManager,
} from './scheduler';

// Plugins
export {
  Plugin,
  PluginManager,
  ParsePlugin,
  FollowPlugin,
  RetryPlugin,
  DelayPlugin,
  DuplicateFilterPlugin,
  RateLimitPlugin,
} from './plugins';

// Utilities
export {
  Logger,
  ErrorManager,
  UrlUtils,
  validateUrl,
  CrawlXError,
  NetworkError,
  TimeoutError,
  HttpError,
  ParseError,
  PluginError,
  SchedulerError,
  ResourceLimitError,
  ValidationError,
} from './utils';

// Types
export type {
  CrawlerOptions,
  TaskOptions,
  TaskResult,
  HttpRequest,
  HttpResponse,
  ParseRule,
  FollowRule,
  FilterFunction,
  PluginInterface,
  CrawlerMode,
  LogLevel,
  DeepPartial,
} from './types';

// Version
export const VERSION = '2.0.0';

/**
 * Default export - CrawlX class
 */
export default CrawlX;
