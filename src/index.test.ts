/**
 * Tests for main index.ts entry point
 */
import { describe, it, expect } from 'vitest';
import CrawlX, {
  // Core exports
  CrawlX as NamedCrawlX,
  createLightweightCrawler,
  createScraper,
  quickCrawl,

  // Configuration exports
  Config,
  ConfigFactory,
  ConfigPresets,

  // Plugin exports
  PluginManager,
  ParsePlugin,
  FollowPlugin,
  RetryPlugin,
  DelayPlugin,
  DuplicateFilterPlugin,
  RateLimitPlugin,

  // HTTP exports
  HttpClient,
  LightweightClient,
  HighPerformanceClient,

  // Parser exports
  Parser,

  // Scheduler exports
  TaskScheduler,
  PriorityQueue,

  // Utility exports
  Logger,
  CrawlXError,
  NetworkError,
  UrlUtils,

  // Type exports
  TaskOptions,
  TaskResult,
  HttpResponse,
  ParseRule
} from './index';

describe('Index Exports', () => {
  describe('Default Export', () => {
    it('should export CrawlX as default', () => {
      expect(CrawlX).toBeDefined();
      expect(typeof CrawlX).toBe('function');
    });
    
    it('should be able to create CrawlX instance from default export', () => {
      const crawler = new CrawlX();
      expect(crawler).toBeInstanceOf(CrawlX);
      crawler.destroy();
    });
  });

  describe('Named Exports', () => {
    it('should export CrawlX as named export', () => {
      expect(NamedCrawlX).toBeDefined();
      expect(NamedCrawlX).toBe(CrawlX);
    });

    it('should export factory functions', () => {
      expect(createLightweightCrawler).toBeDefined();
      expect(typeof createLightweightCrawler).toBe('function');
      
      expect(createScraper).toBeDefined();
      expect(typeof createScraper).toBe('function');
      
      expect(quickCrawl).toBeDefined();
      expect(typeof quickCrawl).toBe('function');
    });

    it('should export configuration classes', () => {
      expect(Config).toBeDefined();
      expect(typeof Config).toBe('function');
      
      expect(ConfigFactory).toBeDefined();
      expect(typeof ConfigFactory).toBe('function');

      expect(ConfigPresets).toBeDefined();
      expect(typeof ConfigPresets).toBe('object');
    });

    it('should export plugin classes', () => {
      expect(PluginManager).toBeDefined();
      expect(typeof PluginManager).toBe('function');
      
      expect(ParsePlugin).toBeDefined();
      expect(typeof ParsePlugin).toBe('function');
      
      expect(FollowPlugin).toBeDefined();
      expect(typeof FollowPlugin).toBe('function');
      
      expect(RetryPlugin).toBeDefined();
      expect(typeof RetryPlugin).toBe('function');
      
      expect(DelayPlugin).toBeDefined();
      expect(typeof DelayPlugin).toBe('function');
      
      expect(DuplicateFilterPlugin).toBeDefined();
      expect(typeof DuplicateFilterPlugin).toBe('function');
      
      expect(RateLimitPlugin).toBeDefined();
      expect(typeof RateLimitPlugin).toBe('function');
    });

    it('should export HTTP classes', () => {
      expect(HttpClient).toBeDefined();
      expect(typeof HttpClient).toBe('function');
      
      expect(LightweightClient).toBeDefined();
      expect(typeof LightweightClient).toBe('function');
      
      expect(HighPerformanceClient).toBeDefined();
      expect(typeof HighPerformanceClient).toBe('function');
    });

    it('should export parser classes', () => {
      expect(Parser).toBeDefined();
      expect(typeof Parser).toBe('function');
    });

    it('should export scheduler classes', () => {
      expect(TaskScheduler).toBeDefined();
      expect(typeof TaskScheduler).toBe('function');
      
      expect(PriorityQueue).toBeDefined();
      expect(typeof PriorityQueue).toBe('function');
    });

    it('should export utility classes', () => {
      expect(Logger).toBeDefined();
      expect(typeof Logger).toBe('function');
      
      expect(CrawlXError).toBeDefined();
      expect(typeof CrawlXError).toBe('function');
      
      expect(NetworkError).toBeDefined();
      expect(typeof NetworkError).toBe('function');
      
      expect(UrlUtils).toBeDefined();
      expect(typeof UrlUtils).toBe('function');
    });
  });

  describe('Factory Functions Integration', () => {
    it('should create lightweight crawler using factory', () => {
      const crawler = createLightweightCrawler();
      expect(crawler).toBeInstanceOf(CrawlX);
      crawler.destroy();
    });

    it('should create scraper using factory', () => {
      const scraper = createScraper();
      expect(scraper).toBeInstanceOf(CrawlX);
      scraper.destroy();
    });
  });

  describe('Type Exports', () => {
    it('should have type exports available at runtime for validation', () => {
      // These are TypeScript types, so we can't test them directly at runtime
      // But we can test that the related runtime objects exist
      expect(CrawlX).toBeDefined(); // Related to CrawlXConfig
      expect(PluginManager).toBeDefined(); // Related to Plugin
      expect(HttpClient).toBeDefined(); // Related to HttpResponse
      expect(Parser).toBeDefined(); // Related to ParseRule
    });
  });
});
