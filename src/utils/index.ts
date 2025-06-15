/**
 * Utilities module exports
 */

// Logger
export { 
  Logger, 
  ConsoleTransport, 
  FileTransport, 
  MemoryTransport,
  type LogEntry,
  type LogTransport,
  type LoggerConfig 
} from './logger';

// Error handling
export {
  CrawlXError,
  ConfigurationError,
  NetworkError,
  TimeoutError,
  HttpError,
  ParseError,
  PluginError,
  SchedulerError,
  ResourceLimitError,
  ValidationError,
  ErrorManager,
  RetryErrorHandler,
  LoggingErrorHandler,
  CircuitBreakerErrorHandler,
  ErrorUtils,
  type ErrorHandler
} from './errors';

// URL utilities
export { UrlUtils, validateUrl } from './url-utils';

// Configuration utilities
export {
  mergeConfig,
  deepClone,
  getNestedValue,
  setNestedValue,
  deleteNestedValue,
  flattenObject,
  unflattenObject,
  hasNestedProperty,
  getAllPaths,
  filterByPaths,
  excludePaths,
  transformValues,
  validateStructure,
  createDiff,
  deepEqual
} from './config-utils';

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
  registerCrawlerFactory,
  getAvailableCrawlerTypes,
  quickCrawl,
  batchCrawl,
  createCrawlerFromConfig,
  createCrawlerFromEnv,
  CrawlerFactories,
  type CrawlerFactory
} from './factory';

// Re-export types
export type { 
  LogLevel,
  DeepPartial 
} from '@/types';
