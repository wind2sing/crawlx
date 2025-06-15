/**
 * Configuration module exports
 */

export { 
  Config, 
  type ConfigSource, 
  type ConfigEntry, 
  type ConfigChangeEvent, 
  type ConfigValidator, 
  type ConfigSchema 
} from './config';

export { 
  crawlerConfigSchema, 
  createDefaultConfig, 
  validateConfig 
} from './schema';

export { 
  ConfigFactory, 
  ConfigUtils, 
  ConfigPresets,
  type ConfigFactoryOptions 
} from './factory';

// Re-export types
export type { 
  CrawlerOptions, 
  DeepPartial 
} from '@/types';
