/**
 * CrawlX integration tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CrawlX } from './crawlx';
import { createLightweightCrawler, quickCrawl } from '../utils/factory';

// Mock HTTP responses for testing
const mockHtmlResponse = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Page</title>
</head>
<body>
  <h1 class="title">Welcome to Test Page</h1>
  <div class="content">
    <p class="text">This is a test paragraph.</p>
    <a href="/link1" class="link">Link 1</a>
    <a href="/link2" class="link">Link 2</a>
  </div>
  <div class="product" data-price="100">
    <span class="name">Product 1</span>
    <span class="price">$100.00</span>
  </div>
</body>
</html>
`;

describe('CrawlX Integration', () => {
  let crawler: CrawlX;

  beforeEach(() => {
    crawler = new CrawlX({
      logLevel: 'silent', // Suppress logs during testing
      timeout: 5000,
    });
  });

  afterEach(async () => {
    if (crawler) {
      await crawler.destroy();
    }
  });

  describe('Basic functionality', () => {
    it('should create crawler instance', () => {
      expect(crawler).toBeInstanceOf(CrawlX);
      expect(crawler.getStats).toBeDefined();
      expect(crawler.crawl).toBeDefined();
      expect(crawler.crawlMany).toBeDefined();
    });

    it('should have proper configuration', () => {
      const config = crawler.getConfig();
      expect(config.get('mode')).toBe('lightweight');
      expect(config.get('concurrency')).toBe(5);
      expect(config.get('timeout')).toBe(5000);
    });

    it('should provide statistics', () => {
      const stats = crawler.getStats();
      expect(stats).toHaveProperty('isRunning');
      expect(stats).toHaveProperty('results');
      expect(stats).toHaveProperty('scheduler');
      expect(stats).toHaveProperty('httpClient');
      expect(stats).toHaveProperty('plugins');
    });
  });

  describe('Configuration management', () => {
    it('should update configuration', () => {
      crawler.updateConfig({ concurrency: 10 });
      expect(crawler.getConfig().get('concurrency')).toBe(10);
    });

    it('should handle plugin management', () => {
      const initialStats = crawler.getStats().plugins;
      
      // Test plugin removal (if any plugins are loaded)
      if (initialStats.total > 0) {
        const removed = crawler.removePlugin('parse');
        expect(typeof removed).toBe('boolean');
      }
    });
  });

  describe('Factory functions', () => {
    it('should create lightweight crawler', () => {
      const lightweightCrawler = createLightweightCrawler();
      expect(lightweightCrawler).toBeInstanceOf(CrawlX);
      expect(lightweightCrawler.getConfig().get('mode')).toBe('lightweight');
      lightweightCrawler.destroy();
    });

    it('should create crawler with custom options', () => {
      const customCrawler = createLightweightCrawler({
        concurrency: 3,
        timeout: 10000,
      });
      
      expect(customCrawler.getConfig().get('concurrency')).toBe(3);
      expect(customCrawler.getConfig().get('timeout')).toBe(10000);
      customCrawler.destroy();
    });
  });

  describe('Error handling', () => {
    it('should handle invalid URLs gracefully', async () => {
      await expect(crawler.crawl('invalid-url')).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      // Test with a URL that should fail
      await expect(crawler.crawl('https://nonexistent-domain-12345.com')).rejects.toThrow();
    });
  });

  describe('Plugin system', () => {
    it('should have plugins loaded by default', () => {
      const stats = crawler.getStats().plugins;
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.enabled).toBeGreaterThan(0);
    });
  });

  // Note: Real HTTP tests would require a test server or mocking
  // For now, we focus on testing the structure and configuration
});

describe('Quick API', () => {
  it('should provide quick crawl function', () => {
    expect(quickCrawl).toBeDefined();
    expect(typeof quickCrawl).toBe('function');
  });

  // Note: Actual quickCrawl tests would require HTTP mocking
  // which is beyond the scope of this basic integration test
});
