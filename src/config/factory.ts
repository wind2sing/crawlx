/**
 * Configuration Factory and Utilities
 */

import { Config } from './config';
import { crawlerConfigSchema, createDefaultConfig } from './schema';
import { CrawlerOptions, DeepPartial } from '@/types';

/**
 * Configuration factory options
 */
export interface ConfigFactoryOptions {
  useDefaults?: boolean;
  loadFromEnv?: boolean;
  envPrefix?: string;
  configFile?: string;
  validateSchema?: boolean;
  strict?: boolean;
}

/**
 * Configuration factory class
 */
export class ConfigFactory {
  /**
   * Create configuration instance with various sources
   */
  static create(
    initialConfig?: DeepPartial<CrawlerOptions>,
    options: ConfigFactoryOptions = {}
  ): Config {
    const {
      useDefaults = true,
      loadFromEnv = true,
      envPrefix = 'CRAWLX_',
      configFile,
      validateSchema = true,
      strict = false,
    } = options;

    // Create config instance with schema
    const config = new Config(undefined, validateSchema ? crawlerConfigSchema : undefined);

    try {
      // 1. Load defaults from schema
      if (useDefaults) {
        const defaults = createDefaultConfig();
        config.setMany(defaults, 'default');
      }

      // 2. Load from config file if specified
      if (configFile) {
        try {
          config.loadFromFile(configFile);
        } catch (error) {
          if (strict) {
            throw error;
          } else {
            console.warn(`Warning: Could not load config file ${configFile}: ${error}`);
          }
        }
      }

      // 3. Load from environment variables
      if (loadFromEnv) {
        try {
          config.loadFromEnv(envPrefix);
        } catch (error) {
          if (strict) {
            throw error;
          } else {
            console.warn(`Warning: Could not load environment config: ${error}`);
          }
        }
      }

      // 4. Apply initial config (highest priority)
      if (initialConfig) {
        config.setMany(initialConfig, 'runtime');
      }

      // 5. Validate final configuration
      if (validateSchema) {
        const validation = config.validate();
        if (!validation.valid) {
          const errorMessage = `Configuration validation failed:\n${validation.errors.join('\n')}`;
          if (strict) {
            throw new Error(errorMessage);
          } else {
            console.warn(`Warning: ${errorMessage}`);
          }
        }
      }

      return config;
    } catch (error) {
      throw new Error(`Failed to create configuration: ${error}`);
    }
  }

  /**
   * Create lightweight configuration (minimal features)
   */
  static createLightweight(overrides?: DeepPartial<CrawlerOptions>): Config {
    const lightweightConfig: DeepPartial<CrawlerOptions> = {
      mode: 'lightweight',
      concurrency: 2,
      maxRetries: 1,
      timeout: 10000,
      plugins: {
        parse: { enabled: true },
        follow: { enabled: false },
        retry: { enabled: true },
        delay: { enabled: false },
        duplicateFilter: { enabled: true },
        rateLimit: { enabled: false },
      },
      ...overrides,
    };

    return this.create(lightweightConfig, {
      useDefaults: true,
      loadFromEnv: false,
      validateSchema: true,
    });
  }

  /**
   * Create high-performance configuration (all features enabled)
   */
  static createHighPerformance(overrides?: DeepPartial<CrawlerOptions>): Config {
    const highPerfConfig: DeepPartial<CrawlerOptions> = {
      mode: 'high-performance',
      concurrency: 20,
      maxRetries: 3,
      timeout: 30000,
      http: {
        keepAlive: true,
        maxSockets: 100,
      },
      scheduler: {
        maxQueueSize: 5000,
        priorityLevels: 5,
      },
      plugins: {
        parse: { enabled: true },
        follow: { enabled: true, maxDepth: 5 },
        retry: { enabled: true, exponentialBackoff: true },
        delay: { enabled: true, defaultDelay: 500 },
        duplicateFilter: { enabled: true, maxCacheSize: 50000 },
        rateLimit: { enabled: true },
      },
      ...overrides,
    };

    return this.create(highPerfConfig, {
      useDefaults: true,
      loadFromEnv: true,
      validateSchema: true,
    });
  }

  /**
   * Create configuration from file
   */
  static fromFile(filePath: string, overrides?: DeepPartial<CrawlerOptions>): Config {
    return this.create(overrides, {
      useDefaults: true,
      loadFromEnv: false,
      configFile: filePath,
      validateSchema: true,
      strict: true,
    });
  }

  /**
   * Create configuration from environment only
   */
  static fromEnv(prefix?: string, overrides?: DeepPartial<CrawlerOptions>): Config {
    return this.create(overrides, {
      useDefaults: true,
      loadFromEnv: true,
      envPrefix: prefix,
      validateSchema: true,
    });
  }
}

/**
 * Configuration utilities
 */
export class ConfigUtils {
  /**
   * Merge configurations with deep merge
   */
  static merge(...configs: Array<DeepPartial<CrawlerOptions>>): DeepPartial<CrawlerOptions> {
    return configs.reduce((merged, config) => {
      return this.deepMerge(merged, config);
    }, {});
  }

  /**
   * Deep merge two objects
   */
  static deepMerge<T extends Record<string, any>>(target: T, source: DeepPartial<T>): T {
    const result = { ...target };

    for (const key in source) {
      const sourceValue = source[key];
      const targetValue = result[key];

      if (this.isObject(sourceValue) && this.isObject(targetValue)) {
        result[key] = this.deepMerge(targetValue, sourceValue);
      } else if (sourceValue !== undefined) {
        result[key] = sourceValue as any;
      }
    }

    return result;
  }

  /**
   * Check if value is a plain object
   */
  private static isObject(value: any): value is Record<string, any> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  /**
   * Convert configuration to environment variables format
   */
  static toEnvFormat(config: Record<string, any>, prefix: string = 'CRAWLX_'): Record<string, string> {
    const envVars: Record<string, string> = {};
    
    function flatten(obj: any, currentPrefix: string = ''): void {
      for (const [key, value] of Object.entries(obj)) {
        const envKey = currentPrefix + key.toUpperCase().replace(/\./g, '_');
        
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          flatten(value, `${envKey}_`);
        } else {
          envVars[prefix + envKey] = JSON.stringify(value);
        }
      }
    }
    
    flatten(config);
    return envVars;
  }

  /**
   * Generate configuration documentation
   */
  static generateDocs(schema: any, level: number = 0): string {
    const indent = '  '.repeat(level);
    let docs = '';
    
    for (const [key, value] of Object.entries(schema)) {
      if (typeof value === 'object' && value.type) {
        // Leaf node
        const entry = value as any;
        docs += `${indent}${key}: ${entry.type}`;
        if (entry.default !== undefined) {
          docs += ` (default: ${JSON.stringify(entry.default)})`;
        }
        if (entry.description) {
          docs += ` - ${entry.description}`;
        }
        docs += '\n';
      } else if (typeof value === 'object') {
        // Nested object
        docs += `${indent}${key}:\n`;
        docs += this.generateDocs(value, level + 1);
      }
    }
    
    return docs;
  }

  /**
   * Validate configuration path
   */
  static isValidPath(path: string): boolean {
    return /^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)*$/.test(path);
  }

  /**
   * Get configuration value by path with type safety
   */
  static getTypedValue<T>(config: Config, path: string, defaultValue: T): T {
    return config.get(path, defaultValue);
  }

  /**
   * Set configuration value by path with validation
   */
  static setTypedValue<T>(config: Config, path: string, value: T): void {
    if (!this.isValidPath(path)) {
      throw new Error(`Invalid configuration path: ${path}`);
    }
    config.set(path, value);
  }

  /**
   * Create configuration preset
   */
  static createPreset(name: string, config: DeepPartial<CrawlerOptions>): () => Config {
    return () => ConfigFactory.create(config, {
      useDefaults: true,
      loadFromEnv: false,
      validateSchema: true,
    });
  }
}

/**
 * Built-in configuration presets
 */
export const ConfigPresets = {
  /**
   * Development preset - verbose logging, low concurrency
   */
  development: ConfigUtils.createPreset('development', {
    logLevel: 'debug',
    concurrency: 2,
    timeout: 10000,
    plugins: {
      delay: { enabled: true, defaultDelay: 2000 },
      rateLimit: { enabled: false },
    },
  }),

  /**
   * Production preset - optimized for performance
   */
  production: ConfigUtils.createPreset('production', {
    logLevel: 'info',
    mode: 'high-performance',
    concurrency: 10,
    timeout: 30000,
    plugins: {
      delay: { enabled: true, defaultDelay: 1000 },
      rateLimit: { enabled: true },
      duplicateFilter: { enabled: true, maxCacheSize: 100000 },
    },
  }),

  /**
   * Testing preset - minimal features, fast execution
   */
  testing: ConfigUtils.createPreset('testing', {
    logLevel: 'silent',
    concurrency: 1,
    timeout: 5000,
    maxRetries: 0,
    plugins: {
      delay: { enabled: false },
      rateLimit: { enabled: false },
      follow: { enabled: false },
    },
  }),

  /**
   * Scraping preset - optimized for data extraction
   */
  scraping: ConfigUtils.createPreset('scraping', {
    mode: 'lightweight',
    concurrency: 5,
    plugins: {
      parse: { enabled: true, validateRules: true },
      follow: { enabled: false },
      duplicateFilter: { enabled: true },
      delay: { enabled: true, defaultDelay: 1500 },
    },
  }),
};
