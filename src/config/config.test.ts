/**
 * Configuration tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Config } from './config';
import { ConfigFactory, ConfigUtils, ConfigPresets } from './factory';
import { crawlerConfigSchema, createDefaultConfig } from './schema';

describe('Config', () => {
  let config: Config;

  beforeEach(() => {
    config = new Config();
  });

  describe('Basic operations', () => {
    it('should set and get values', () => {
      config.set('test.key', 'value');
      expect(config.get('test.key')).toBe('value');
    });

    it('should return default value for missing keys', () => {
      expect(config.get('missing.key', 'default')).toBe('default');
    });

    it('should check if key exists', () => {
      config.set('existing.key', 'value');
      expect(config.has('existing.key')).toBe(true);
      expect(config.has('missing.key')).toBe(false);
    });

    it('should delete values', () => {
      config.set('test.key', 'value');
      expect(config.delete('test.key')).toBe(true);
      expect(config.has('test.key')).toBe(false);
    });

    it('should clear all values', () => {
      config.set('key1', 'value1');
      config.set('key2', 'value2');
      config.clear();
      expect(config.has('key1')).toBe(false);
      expect(config.has('key2')).toBe(false);
    });
  });

  describe('Nested configuration', () => {
    it('should handle nested objects', () => {
      const nestedConfig = {
        database: {
          host: 'localhost',
          port: 5432,
          credentials: {
            username: 'user',
            password: 'pass',
          },
        },
      };

      config.setMany(nestedConfig);

      expect(config.get('database.host')).toBe('localhost');
      expect(config.get('database.port')).toBe(5432);
      expect(config.get('database.credentials.username')).toBe('user');
    });

    it('should return nested objects', () => {
      config.set('app.name', 'CrawlX');
      config.set('app.version', '2.0.0');

      const nested = config.getAllNested();
      expect(nested.app.name).toBe('CrawlX');
      expect(nested.app.version).toBe('2.0.0');
    });
  });

  describe('Configuration sources', () => {
    it('should track configuration sources', () => {
      config.set('key1', 'value1', 'default');
      config.set('key2', 'value2', 'file');
      config.set('key3', 'value3', 'env');

      const entry1 = config.getEntry('key1');
      const entry2 = config.getEntry('key2');
      const entry3 = config.getEntry('key3');

      expect(entry1?.source).toBe('default');
      expect(entry2?.source).toBe('file');
      expect(entry3?.source).toBe('env');
    });

    it('should provide metadata', () => {
      config.set('test.key', 'value', 'runtime');
      const metadata = config.getMetadata();

      expect(metadata['test.key']).toBeDefined();
      expect(metadata['test.key'].source).toBe('runtime');
      expect(metadata['test.key'].timestamp).toBeTypeOf('number');
    });
  });

  describe('Events', () => {
    it('should emit change events', () => {
      const changes: any[] = [];
      config.on('change', (event) => changes.push(event));

      config.set('test.key', 'value1');
      config.set('test.key', 'value2');

      expect(changes).toHaveLength(2);
      expect(changes[1].oldValue).toBe('value1');
      expect(changes[1].newValue).toBe('value2');
    });

    it('should emit path-specific events', () => {
      const events: any[] = [];
      config.on('change:test.key', (event) => events.push(event));

      config.set('test.key', 'value');
      config.set('other.key', 'other');

      expect(events).toHaveLength(1);
      expect(events[0].path).toBe('test.key');
    });
  });

  describe('Watchers', () => {
    it('should watch for value changes', () => {
      const values: any[] = [];
      const unwatch = config.watch('test.key', (value) => values.push(value));

      config.set('test.key', 'value1');
      config.set('test.key', 'value2');

      expect(values).toEqual(['value1', 'value2']);

      unwatch();
      config.set('test.key', 'value3');

      expect(values).toEqual(['value1', 'value2']); // No new value after unwatch
    });
  });

  describe('Environment variables', () => {
    it('should load from environment variables', () => {
      // Mock environment variables
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        CRAWLX_MODE: 'high-performance',
        CRAWLX_CONCURRENCY: '10',
        CRAWLX_PLUGINS_PARSE_ENABLED: 'true',
      };

      config.loadFromEnv('CRAWLX_');

      expect(config.get('mode')).toBe('high-performance');
      expect(config.get('concurrency')).toBe(10);
      expect(config.get('plugins.parse.enabled')).toBe(true);

      process.env = originalEnv;
    });
  });

  describe('Import/Export', () => {
    it('should export and import configuration', () => {
      config.set('key1', 'value1');
      config.set('key2', 'value2');

      const exported = config.export();
      const newConfig = new Config();
      newConfig.import(exported);

      expect(newConfig.get('key1')).toBe('value1');
      expect(newConfig.get('key2')).toBe('value2');
    });
  });
});

describe('ConfigFactory', () => {
  describe('Factory methods', () => {
    it('should create default configuration', () => {
      const config = ConfigFactory.create();
      expect(config.get('mode')).toBe('lightweight');
      expect(config.get('concurrency')).toBe(5);
    });

    it('should create lightweight configuration', () => {
      const config = ConfigFactory.createLightweight();
      expect(config.get('mode')).toBe('lightweight');
      expect(config.get('concurrency')).toBe(2);
      expect(config.get('plugins.follow.enabled')).toBe(false);
    });

    it('should create high-performance configuration', () => {
      const config = ConfigFactory.createHighPerformance();
      expect(config.get('mode')).toBe('high-performance');
      expect(config.get('concurrency')).toBe(20);
      expect(config.get('plugins.follow.enabled')).toBe(true);
    });

    it('should apply overrides', () => {
      const config = ConfigFactory.create({
        concurrency: 15,
        timeout: 20000,
      });

      expect(config.get('concurrency')).toBe(15);
      expect(config.get('timeout')).toBe(20000);
    });
  });

  describe('Configuration validation', () => {
    it('should validate configuration against schema', () => {
      const config = ConfigFactory.create({
        concurrency: 5, // Valid value first
      }, { strict: false });

      // First validate the current valid configuration
      let validation = config.validate();
      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);

      // Now try to set an invalid value and catch the error
      expect(() => {
        config.set('concurrency', -1);
      }).toThrow(/Validation failed/);
    });

    it('should throw in strict mode for invalid config', () => {
      expect(() => {
        ConfigFactory.create({
          concurrency: -1,
        }, { strict: true });
      }).toThrow();
    });
  });
});

describe('ConfigUtils', () => {
  describe('Deep merge', () => {
    it('should merge configurations deeply', () => {
      const config1 = {
        app: { name: 'CrawlX', version: '1.0.0' },
        plugins: { parse: { enabled: true } },
      };

      const config2 = {
        app: { version: '2.0.0', author: 'Team' },
        plugins: { follow: { enabled: true } },
      };

      const merged = ConfigUtils.merge(config1, config2);

      expect(merged.app.name).toBe('CrawlX');
      expect(merged.app.version).toBe('2.0.0');
      expect(merged.app.author).toBe('Team');
      expect(merged.plugins.parse.enabled).toBe(true);
      expect(merged.plugins.follow.enabled).toBe(true);
    });
  });

  describe('Environment format', () => {
    it('should convert to environment variables format', () => {
      const config = {
        mode: 'lightweight',
        plugins: {
          parse: { enabled: true },
        },
      };

      const envVars = ConfigUtils.toEnvFormat(config);

      expect(envVars['CRAWLX_MODE']).toBe('"lightweight"');
      expect(envVars['CRAWLX_PLUGINS_PARSE_ENABLED']).toBe('true');
    });
  });

  describe('Path validation', () => {
    it('should validate configuration paths', () => {
      expect(ConfigUtils.isValidPath('valid.path')).toBe(true);
      expect(ConfigUtils.isValidPath('valid')).toBe(true);
      expect(ConfigUtils.isValidPath('valid.nested.path')).toBe(true);
      expect(ConfigUtils.isValidPath('invalid..path')).toBe(false);
      expect(ConfigUtils.isValidPath('.invalid')).toBe(false);
      expect(ConfigUtils.isValidPath('invalid.')).toBe(false);
    });
  });
});

describe('ConfigPresets', () => {
  it('should provide development preset', () => {
    const config = ConfigPresets.development();
    expect(config.get('logLevel')).toBe('debug');
    expect(config.get('concurrency')).toBe(2);
  });

  it('should provide production preset', () => {
    const config = ConfigPresets.production();
    expect(config.get('logLevel')).toBe('info');
    expect(config.get('mode')).toBe('high-performance');
  });

  it('should provide testing preset', () => {
    const config = ConfigPresets.testing();
    expect(config.get('logLevel')).toBe('silent');
    expect(config.get('maxRetries')).toBe(0);
  });

  it('should provide scraping preset', () => {
    const config = ConfigPresets.scraping();
    expect(config.get('mode')).toBe('lightweight');
    expect(config.get('plugins.parse.enabled')).toBe(true);
    expect(config.get('plugins.follow.enabled')).toBe(false);
  });
});

describe('Schema', () => {
  it('should create default configuration from schema', () => {
    const defaults = createDefaultConfig();
    expect(defaults.mode).toBe('lightweight');
    expect(defaults.concurrency).toBe(5);
    expect(defaults['plugins.parse.enabled']).toBe(true);
  });

  it('should have valid schema structure', () => {
    expect(crawlerConfigSchema).toBeDefined();
    expect(crawlerConfigSchema.mode).toBeDefined();
    expect(crawlerConfigSchema.concurrency).toBeDefined();
    expect(crawlerConfigSchema.plugins).toBeDefined();
  });
});
