/**
 * Plugin system tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Plugin, PluginManager } from '@/core/plugin';
import { ParsePlugin } from './parse-plugin';
import { FollowPlugin } from './follow-plugin';
import { RetryPlugin } from './retry-plugin';
import { DelayPlugin } from './delay-plugin';
import { DuplicateFilterPlugin } from './duplicate-filter-plugin';

// Mock plugin for testing
class TestPlugin extends Plugin {
  public hooksCalled: string[] = [];

  constructor(name: string = 'test', priority: number = 100) {
    super(name, '1.0.0', priority);
  }

  async onInit() {
    this.hooksCalled.push('onInit');
  }

  async onTaskCreate(task: any) {
    this.hooksCalled.push('onTaskCreate');
    return { ...task, modified: true };
  }

  async onTaskComplete(result: any) {
    this.hooksCalled.push('onTaskComplete');
    return { ...result, processed: true };
  }
}

describe('Plugin System', () => {
  let pluginManager: PluginManager;

  beforeEach(() => {
    pluginManager = new PluginManager();
  });

  describe('PluginManager', () => {
    it('should register plugins', () => {
      const plugin = new TestPlugin();
      pluginManager.register(plugin);
      
      expect(pluginManager.has('test')).toBe(true);
      expect(pluginManager.count()).toBe(1);
    });

    it('should prevent duplicate plugin registration', () => {
      const plugin1 = new TestPlugin();
      const plugin2 = new TestPlugin();
      
      pluginManager.register(plugin1);
      
      expect(() => {
        pluginManager.register(plugin2);
      }).toThrow("Plugin 'test' is already registered");
    });

    it('should unregister plugins', () => {
      const plugin = new TestPlugin();
      pluginManager.register(plugin);
      
      const unregistered = pluginManager.unregister('test');
      
      expect(unregistered).toBe(true);
      expect(pluginManager.has('test')).toBe(false);
      expect(pluginManager.count()).toBe(0);
    });

    it('should order plugins by priority', () => {
      const lowPriority = new TestPlugin('low', 50);
      const highPriority = new TestPlugin('high', 200);
      const mediumPriority = new TestPlugin('medium', 100);
      
      pluginManager.register(lowPriority);
      pluginManager.register(highPriority);
      pluginManager.register(mediumPriority);
      
      const plugins = pluginManager.getAll();
      expect(plugins[0].name).toBe('high');
      expect(plugins[1].name).toBe('medium');
      expect(plugins[2].name).toBe('low');
    });

    it('should enable and disable plugins', () => {
      const plugin = new TestPlugin();
      pluginManager.register(plugin);
      
      expect(plugin.isEnabled()).toBe(true);
      
      pluginManager.disable('test');
      expect(plugin.isEnabled()).toBe(false);
      
      pluginManager.enable('test');
      expect(plugin.isEnabled()).toBe(true);
    });

    it('should execute hooks on enabled plugins only', async () => {
      const plugin1 = new TestPlugin('plugin1');
      const plugin2 = new TestPlugin('plugin2');
      
      pluginManager.register(plugin1);
      pluginManager.register(plugin2);
      pluginManager.disable('plugin2');
      
      await pluginManager.executeHook('onInit');
      
      expect(plugin1.hooksCalled).toContain('onInit');
      expect(plugin2.hooksCalled).not.toContain('onInit');
    });

    it('should execute transform hooks', async () => {
      const plugin = new TestPlugin();
      pluginManager.register(plugin);
      
      const task = { url: 'https://example.com' };
      const result = await pluginManager.executeTransformHook('onTaskCreate', task);
      
      expect(result.modified).toBe(true);
      expect(plugin.hooksCalled).toContain('onTaskCreate');
    });

    it('should provide plugin statistics', () => {
      const plugin1 = new TestPlugin('plugin1');
      const plugin2 = new TestPlugin('plugin2');
      
      pluginManager.register(plugin1);
      pluginManager.register(plugin2);
      pluginManager.disable('plugin2');
      
      const stats = pluginManager.getStats();
      
      expect(stats.total).toBe(2);
      expect(stats.enabled).toBe(1);
      expect(stats.disabled).toBe(1);
    });
  });

  describe('Built-in Plugins', () => {
    describe('ParsePlugin', () => {
      it('should create parse plugin', () => {
        const plugin = new ParsePlugin();
        
        expect(plugin.name).toBe('parse');
        expect(plugin.isEnabled()).toBe(true);
      });

      it('should validate parse rules', () => {
        const plugin = new ParsePlugin({ validateRules: true });
        
        expect(plugin.validateParseRule('.title')).toBe(true);
        expect(plugin.validateParseRule({ title: '.title' })).toBe(true);
      });

      it('should add custom filters', () => {
        const plugin = new ParsePlugin();
        
        plugin.addFilter('custom', (value: string) => value.toUpperCase());
        
        const filters = plugin.getFilters();
        expect(filters.custom).toBeDefined();
      });
    });

    describe('FollowPlugin', () => {
      it('should create follow plugin', () => {
        const plugin = new FollowPlugin();
        
        expect(plugin.name).toBe('follow');
        expect(plugin.isEnabled()).toBe(true);
      });

      it('should track visited URLs', () => {
        const plugin = new FollowPlugin();
        
        expect(plugin.getVisitedUrls()).toHaveLength(0);
        
        // Simulate URL processing (would normally happen during crawling)
        // This is a simplified test
      });

      it('should respect configuration', () => {
        const plugin = new FollowPlugin({
          maxDepth: 2,
          sameDomainOnly: false,
        });
        
        const config = plugin.getConfig();
        expect(config.maxDepth).toBe(2);
        expect(config.sameDomainOnly).toBe(false);
      });
    });

    describe('RetryPlugin', () => {
      it('should create retry plugin', () => {
        const plugin = new RetryPlugin();
        
        expect(plugin.name).toBe('retry');
        expect(plugin.isEnabled()).toBe(true);
      });

      it('should test retry conditions', () => {
        const plugin = new RetryPlugin();
        
        const networkError = new Error('ECONNRESET');
        const task = { url: 'https://example.com' };
        
        expect(plugin.testRetryCondition(networkError, 1, task)).toBe(true);
        expect(plugin.testRetryCondition(networkError, 4, task)).toBe(false); // Exceeds max retries
      });
    });

    describe('DelayPlugin', () => {
      it('should create delay plugin', () => {
        const plugin = new DelayPlugin();
        
        expect(plugin.name).toBe('delay');
        expect(plugin.isEnabled()).toBe(true);
      });

      it('should set domain delays', () => {
        const plugin = new DelayPlugin();
        
        plugin.setDomainDelay('example.com', 2000);
        
        const config = plugin.getConfig();
        expect(config.perDomainDelay!['example.com']).toBe(2000);
      });
    });

    describe('DuplicateFilterPlugin', () => {
      it('should create duplicate filter plugin', () => {
        const plugin = new DuplicateFilterPlugin();
        
        expect(plugin.name).toBe('duplicate-filter');
        expect(plugin.isEnabled()).toBe(true);
      });

      it('should detect duplicate URLs', () => {
        const plugin = new DuplicateFilterPlugin();
        
        plugin.markAsSeen('https://example.com');
        
        expect(plugin.hasSeen('https://example.com')).toBe(true);
        expect(plugin.hasSeen('https://other.com')).toBe(false);
      });

      it('should normalize URLs', () => {
        const plugin = new DuplicateFilterPlugin({
          ignoreQuery: true,
          ignoreFragment: true,
        });
        
        plugin.markAsSeen('https://example.com/page?param=1#section');
        
        expect(plugin.hasSeen('https://example.com/page')).toBe(true);
        expect(plugin.hasSeen('https://example.com/page?other=2')).toBe(true);
      });
    });
  });

  describe('Plugin Dependencies', () => {
    it('should check plugin dependencies', () => {
      const followPlugin = new FollowPlugin();
      
      // Follow plugin depends on parse plugin
      expect(() => {
        pluginManager.register(followPlugin);
      }).toThrow("Plugin 'follow' depends on 'parse' which is not registered");
      
      // Register parse plugin first
      const parsePlugin = new ParsePlugin();
      pluginManager.register(parsePlugin);
      
      // Now follow plugin should register successfully
      expect(() => {
        pluginManager.register(followPlugin);
      }).not.toThrow();
    });

    it('should prevent unregistering plugins with dependents', () => {
      const parsePlugin = new ParsePlugin();
      const followPlugin = new FollowPlugin();
      
      pluginManager.register(parsePlugin);
      pluginManager.register(followPlugin);
      
      expect(() => {
        pluginManager.unregister('parse');
      }).toThrow("Cannot unregister 'parse' because 'follow' depends on it");
    });
  });

  describe('Plugin Events', () => {
    it('should emit plugin events', () => {
      const events: string[] = [];
      
      pluginManager.on('plugin-registered', () => events.push('registered'));
      pluginManager.on('plugin-unregistered', () => events.push('unregistered'));
      
      const plugin = new TestPlugin();
      pluginManager.register(plugin);
      pluginManager.unregister('test');
      
      expect(events).toEqual(['registered', 'unregistered']);
    });

    it('should emit plugin errors', async () => {
      const errors: any[] = [];
      
      pluginManager.on('plugin-error', (plugin, hook, error) => {
        errors.push({ plugin: plugin.name, hook, error });
      });
      
      const faultyPlugin = new TestPlugin();
      faultyPlugin.onInit = async () => {
        throw new Error('Plugin error');
      };
      
      pluginManager.register(faultyPlugin);
      
      await expect(pluginManager.executeHook('onInit')).rejects.toThrow('Plugin error');
      expect(errors).toHaveLength(1);
      expect(errors[0].plugin).toBe('test');
      expect(errors[0].hook).toBe('onInit');
    });
  });
});
