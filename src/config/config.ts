/**
 * Configuration Management System
 */

import { EventEmitter } from 'events';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

import { CrawlerOptions, DeepPartial } from '@/types';

/**
 * Configuration source types
 */
export type ConfigSource = 'default' | 'file' | 'env' | 'runtime';

/**
 * Configuration entry with metadata
 */
export interface ConfigEntry<T = any> {
  value: T;
  source: ConfigSource;
  timestamp: number;
  path: string;
}

/**
 * Configuration change event
 */
export interface ConfigChangeEvent<T = any> {
  path: string;
  oldValue: T;
  newValue: T;
  source: ConfigSource;
}

/**
 * Configuration validation function
 */
export type ConfigValidator<T = any> = (value: T, path: string) => boolean | string;

/**
 * Configuration schema definition
 */
export interface ConfigSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required?: boolean;
    default?: any;
    validator?: ConfigValidator;
    description?: string;
  } | ConfigSchema;
}

/**
 * Configuration manager class
 */
export class Config extends EventEmitter {
  private config: Map<string, ConfigEntry> = new Map();
  private schema?: ConfigSchema;
  private watchers = new Map<string, Set<(value: any) => void>>();

  constructor(initialConfig?: DeepPartial<CrawlerOptions>, schema?: ConfigSchema) {
    super();
    this.schema = schema;
    
    if (initialConfig) {
      this.setMany(initialConfig, 'default');
    }
  }

  /**
   * Get configuration value
   */
  get<T = any>(path: string, defaultValue?: T): T {
    const entry = this.config.get(path);
    return entry ? entry.value : (defaultValue as T);
  }

  /**
   * Get configuration entry with metadata
   */
  getEntry<T = any>(path: string): ConfigEntry<T> | undefined {
    return this.config.get(path) as ConfigEntry<T>;
  }

  /**
   * Set configuration value
   */
  set<T = any>(path: string, value: T, source: ConfigSource = 'runtime'): void {
    const oldEntry = this.config.get(path);
    const oldValue = oldEntry?.value;

    // Validate value if schema is provided
    if (this.schema) {
      this.validateValue(path, value);
    }

    const newEntry: ConfigEntry<T> = {
      value,
      source,
      timestamp: Date.now(),
      path,
    };

    this.config.set(path, newEntry);

    // Emit change event
    if (oldValue !== value) {
      const changeEvent: ConfigChangeEvent<T> = {
        path,
        oldValue,
        newValue: value,
        source,
      };

      this.emit('change', changeEvent);
      this.emit(`change:${path}`, changeEvent);

      // Notify watchers
      const pathWatchers = this.watchers.get(path);
      if (pathWatchers) {
        pathWatchers.forEach(watcher => watcher(value));
      }
    }
  }

  /**
   * Set multiple configuration values
   */
  setMany(config: Record<string, any>, source: ConfigSource = 'runtime'): void {
    const flatConfig = this.flattenObject(config);
    
    for (const [path, value] of Object.entries(flatConfig)) {
      this.set(path, value, source);
    }
  }

  /**
   * Check if configuration path exists
   */
  has(path: string): boolean {
    return this.config.has(path);
  }

  /**
   * Delete configuration value
   */
  delete(path: string): boolean {
    const entry = this.config.get(path);
    if (entry) {
      this.config.delete(path);
      this.emit('delete', { path, value: entry.value });
      return true;
    }
    return false;
  }

  /**
   * Clear all configuration
   */
  clear(): void {
    this.config.clear();
    this.emit('clear');
  }

  /**
   * Get all configuration as flat object
   */
  getAll(): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [path, entry] of this.config.entries()) {
      result[path] = entry.value;
    }
    
    return result;
  }

  /**
   * Get all configuration as nested object
   */
  getAllNested(): Record<string, any> {
    const flat = this.getAll();
    return this.unflattenObject(flat);
  }

  /**
   * Load configuration from file
   */
  loadFromFile(filePath: string): void {
    const resolvedPath = resolve(filePath);
    
    if (!existsSync(resolvedPath)) {
      throw new Error(`Configuration file not found: ${resolvedPath}`);
    }

    try {
      const content = readFileSync(resolvedPath, 'utf8');
      let config: any;

      if (filePath.endsWith('.json')) {
        config = JSON.parse(content);
      } else if (filePath.endsWith('.js') || filePath.endsWith('.ts')) {
        // Dynamic import for JS/TS files
        delete require.cache[resolvedPath];
        config = require(resolvedPath);
        if (config.default) {
          config = config.default;
        }
      } else {
        throw new Error(`Unsupported configuration file format: ${filePath}`);
      }

      this.setMany(config, 'file');
      this.emit('file-loaded', { filePath: resolvedPath, config });
    } catch (error) {
      throw new Error(`Failed to load configuration from ${resolvedPath}: ${error}`);
    }
  }

  /**
   * Load configuration from environment variables
   */
  loadFromEnv(prefix: string = 'CRAWLX_'): void {
    const envConfig: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith(prefix)) {
        const configKey = key
          .slice(prefix.length)
          .toLowerCase()
          .replace(/_/g, '.');
        
        envConfig[configKey] = this.parseEnvValue(value);
      }
    }

    this.setMany(envConfig, 'env');
    this.emit('env-loaded', { prefix, config: envConfig });
  }

  /**
   * Watch for configuration changes
   */
  watch(path: string, callback: (value: any) => void): () => void {
    if (!this.watchers.has(path)) {
      this.watchers.set(path, new Set());
    }
    
    this.watchers.get(path)!.add(callback);
    
    // Return unwatch function
    return () => {
      const pathWatchers = this.watchers.get(path);
      if (pathWatchers) {
        pathWatchers.delete(callback);
        if (pathWatchers.size === 0) {
          this.watchers.delete(path);
        }
      }
    };
  }

  /**
   * Validate configuration against schema
   */
  validate(): { valid: boolean; errors: string[] } {
    if (!this.schema) {
      return { valid: true, errors: [] };
    }

    const errors: string[] = [];
    const config = this.getAllNested();
    
    this.validateObjectAgainstSchema(config, this.schema, '', errors);
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get configuration metadata
   */
  getMetadata(): Record<string, Omit<ConfigEntry, 'value'>> {
    const metadata: Record<string, Omit<ConfigEntry, 'value'>> = {};
    
    for (const [path, entry] of this.config.entries()) {
      metadata[path] = {
        source: entry.source,
        timestamp: entry.timestamp,
        path: entry.path,
      };
    }
    
    return metadata;
  }

  /**
   * Export configuration to JSON
   */
  export(): string {
    const data = {
      config: this.getAllNested(),
      metadata: this.getMetadata(),
      timestamp: Date.now(),
    };
    
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import configuration from JSON
   */
  import(data: string): void {
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.config) {
        this.setMany(parsed.config, 'runtime');
      }
      
      this.emit('imported', parsed);
    } catch (error) {
      throw new Error(`Failed to import configuration: ${error}`);
    }
  }

  /**
   * Parse environment variable value
   */
  private parseEnvValue(value: string | undefined): any {
    if (!value) return undefined;
    
    // Try to parse as JSON first
    try {
      return JSON.parse(value);
    } catch {
      // If not JSON, return as string
      return value;
    }
  }

  /**
   * Validate value against schema
   */
  private validateValue(path: string, value: any): void {
    if (!this.schema) return;
    
    const pathParts = path.split('.');
    let currentSchema: any = this.schema;
    
    for (const part of pathParts) {
      if (currentSchema[part]) {
        currentSchema = currentSchema[part];
      } else {
        return; // Path not in schema, skip validation
      }
    }
    
    if (currentSchema.validator) {
      const result = currentSchema.validator(value, path);
      if (result !== true) {
        throw new Error(`Validation failed for ${path}: ${result}`);
      }
    }
    
    if (currentSchema.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== currentSchema.type) {
        throw new Error(`Type mismatch for ${path}: expected ${currentSchema.type}, got ${actualType}`);
      }
    }
  }

  /**
   * Validate object against schema recursively
   */
  private validateObjectAgainstSchema(
    obj: any,
    schema: ConfigSchema,
    basePath: string,
    errors: string[]
  ): void {
    for (const [key, schemaEntry] of Object.entries(schema)) {
      const currentPath = basePath ? `${basePath}.${key}` : key;
      
      if (typeof schemaEntry === 'object' && !schemaEntry.type) {
        // Nested schema
        if (obj[key] && typeof obj[key] === 'object') {
          this.validateObjectAgainstSchema(obj[key], schemaEntry as ConfigSchema, currentPath, errors);
        }
      } else {
        // Leaf schema entry
        const entry = schemaEntry as any;
        const value = obj[key];
        
        if (entry.required && value === undefined) {
          errors.push(`Required field missing: ${currentPath}`);
        }
        
        if (value !== undefined && entry.validator) {
          const result = entry.validator(value, currentPath);
          if (result !== true) {
            errors.push(`Validation failed for ${currentPath}: ${result}`);
          }
        }
      }
    }
  }

  /**
   * Flatten nested object to dot notation
   */
  private flattenObject(obj: any, prefix: string = ''): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(result, this.flattenObject(value, newKey));
      } else {
        result[newKey] = value;
      }
    }
    
    return result;
  }

  /**
   * Unflatten dot notation to nested object
   */
  private unflattenObject(flat: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [path, value] of Object.entries(flat)) {
      const parts = path.split('.');
      let current = result;
      
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!(part in current)) {
          current[part] = {};
        }
        current = current[part];
      }
      
      current[parts[parts.length - 1]] = value;
    }
    
    return result;
  }
}
