/**
 * Tests for core module exports
 */
import { describe, it, expect } from 'vitest';
import {
  CrawlX,
  PluginManager
} from './index';

describe('Core Module Exports', () => {
  describe('CrawlX Export', () => {
    it('should export CrawlX class', () => {
      expect(CrawlX).toBeDefined();
      expect(typeof CrawlX).toBe('function');
    });

    it('should create CrawlX instance', () => {
      const crawler = new CrawlX();
      expect(crawler).toBeInstanceOf(CrawlX);
      crawler.destroy();
    });
  });

  describe('PluginManager Export', () => {
    it('should export PluginManager class', () => {
      expect(PluginManager).toBeDefined();
      expect(typeof PluginManager).toBe('function');
    });

    it('should create PluginManager instance', () => {
      const manager = new PluginManager();
      expect(manager).toBeInstanceOf(PluginManager);
    });
  });

  describe('Module Integration', () => {
    it('should have consistent exports', () => {
      // All exports should be defined and have correct types
      const exports = {
        CrawlX,
        PluginManager
      };

      Object.entries(exports).forEach(([name, exportValue]) => {
        expect(exportValue).toBeDefined();
        expect(typeof exportValue).toBe('function');
      });
    });
  });
});
