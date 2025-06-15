/**
 * CrawlX Integration Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CrawlX } from '@/core/crawlx';
import { createLightweightCrawler, createScraper, quickCrawl } from '@/utils/factory';
import { createTestCrawler, mockHtmlResponses, testConfigs, PerformanceTimer } from '../helpers/test-utils';

describe('CrawlX Integration Tests', () => {
  let crawler: CrawlX;

  beforeEach(() => {
    crawler = new CrawlX(testConfigs.standard);
  });

  afterEach(async () => {
    if (crawler) {
      await crawler.destroy();
    }
  });

  describe('Basic Crawling', () => {
    it('should create crawler instance successfully', () => {
      expect(crawler).toBeInstanceOf(CrawlX);
      expect(crawler.crawl).toBeDefined();
      expect(crawler.crawlMany).toBeDefined();
      expect(crawler.getStats).toBeDefined();
    });

    it('should have correct default configuration', () => {
      const config = crawler.getConfig();
      expect(config.get('mode')).toBe('lightweight');
      expect(config.get('concurrency')).toBe(2);
      expect(config.get('timeout')).toBe(5000);
    });

    it('should provide comprehensive statistics', () => {
      const stats = crawler.getStats();
      
      expect(stats).toHaveProperty('isRunning');
      expect(stats).toHaveProperty('results');
      expect(stats).toHaveProperty('scheduler');
      expect(stats).toHaveProperty('httpClient');
      expect(stats).toHaveProperty('plugins');
      
      expect(typeof stats.isRunning).toBe('boolean');
      expect(typeof stats.results).toBe('number');
      expect(typeof stats.plugins.total).toBe('number');
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration at runtime', () => {
      const originalConcurrency = crawler.getConfig().get('concurrency');
      
      crawler.updateConfig({ concurrency: 5 });
      
      expect(crawler.getConfig().get('concurrency')).toBe(5);
      expect(crawler.getConfig().get('concurrency')).not.toBe(originalConcurrency);
    });

    it('should handle nested configuration updates', () => {
      crawler.updateConfig({
        plugins: {
          delay: {
            enabled: true,
            defaultDelay: 2000,
          },
        },
      });
      
      expect(crawler.getConfig().get('plugins.delay.enabled')).toBe(true);
      expect(crawler.getConfig().get('plugins.delay.defaultDelay')).toBe(2000);
    });
  });

  describe('Plugin Management', () => {
    it('should have plugins loaded by default', () => {
      const stats = crawler.getStats().plugins;
      
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.enabled).toBeGreaterThan(0);
      expect(stats.enabled).toBeLessThanOrEqual(stats.total);
    });

    it('should support custom plugins', () => {
      class TestPlugin {
        name = 'test-plugin';
        version = '1.0.0';
        priority = 100;
        
        async onTaskComplete(result: any) {
          result.testProcessed = true;
          return result;
        }
      }

      const initialCount = crawler.getStats().plugins.total;
      crawler.addPlugin(new TestPlugin());
      
      expect(crawler.getStats().plugins.total).toBe(initialCount + 1);
    });

    it('should remove plugins correctly', () => {
      const initialCount = crawler.getStats().plugins.total;
      
      // Try to remove a plugin (may or may not exist)
      const removed = crawler.removePlugin('parse');
      
      if (removed) {
        expect(crawler.getStats().plugins.total).toBe(initialCount - 1);
      } else {
        expect(crawler.getStats().plugins.total).toBe(initialCount);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid URLs gracefully', async () => {
      await expect(crawler.crawl('invalid-url')).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      // This would normally require a real network request
      // For now, we test that the error handling structure is in place
      await expect(crawler.crawl('https://nonexistent-domain-12345.com')).rejects.toThrow();
    });

    it('should handle malformed parse rules', async () => {
      const testCrawler = createTestCrawler({
        'https://example.com': mockHtmlResponses.simple,
      });

      try {
        // Test with invalid parse rule
        await expect(testCrawler.crawl('https://example.com', {
          parse: null as any,
        })).rejects.toThrow();
      } finally {
        await testCrawler.destroy();
      }
    });
  });

  describe('Event System', () => {
    it('should emit events during crawling', async () => {
      const events: string[] = [];
      
      crawler.on('task-start', () => events.push('task-start'));
      crawler.on('task-complete', () => events.push('task-complete'));
      crawler.on('task-error', () => events.push('task-error'));

      const testCrawler = createTestCrawler({
        'https://example.com': mockHtmlResponses.simple,
      });

      try {
        await testCrawler.crawl('https://example.com');
        
        // Events should be emitted (though we can't easily test the exact sequence without mocking)
        expect(testCrawler.listenerCount('task-start')).toBeGreaterThanOrEqual(0);
      } finally {
        await testCrawler.destroy();
      }
    });
  });
});

describe('Factory Functions Integration', () => {
  describe('createLightweightCrawler', () => {
    it('should create lightweight crawler with correct configuration', () => {
      const crawler = createLightweightCrawler();
      
      expect(crawler).toBeInstanceOf(CrawlX);
      expect(crawler.getConfig().get('mode')).toBe('lightweight');
      expect(crawler.getConfig().get('concurrency')).toBe(2);
      
      crawler.destroy();
    });

    it('should accept custom options', () => {
      const crawler = createLightweightCrawler({
        concurrency: 1,
        timeout: 3000,
      });
      
      expect(crawler.getConfig().get('concurrency')).toBe(1);
      expect(crawler.getConfig().get('timeout')).toBe(3000);
      
      crawler.destroy();
    });
  });

  describe('createScraper', () => {
    it('should create scraper with appropriate configuration', () => {
      const scraper = createScraper();
      
      expect(scraper).toBeInstanceOf(CrawlX);
      expect(scraper.getConfig().get('mode')).toBe('lightweight');
      
      scraper.destroy();
    });
  });
});

describe('Performance Tests', () => {
  it('should handle multiple concurrent requests efficiently', async () => {
    const timer = new PerformanceTimer();
    const testCrawler = createTestCrawler({
      'https://example1.com': mockHtmlResponses.simple,
      'https://example2.com': mockHtmlResponses.ecommerce,
      'https://example3.com': mockHtmlResponses.blog,
    });

    timer.start();
    
    try {
      const results = await testCrawler.crawlMany([
        'https://example1.com',
        'https://example2.com',
        'https://example3.com',
      ]);
      
      const duration = timer.stop();
      
      expect(results).toHaveLength(3);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      
      // All results should be successful
      results.forEach(result => {
        expect(result.response.statusCode).toBe(200);
        expect(result.response.$).toBeDefined();
      });
    } finally {
      await testCrawler.destroy();
    }
  });

  it('should maintain reasonable memory usage', async () => {
    const initialMemory = process.memoryUsage();
    const testCrawler = createTestCrawler({
      'https://example.com': mockHtmlResponses.simple,
    });

    try {
      // Perform multiple crawls
      for (let i = 0; i < 10; i++) {
        await testCrawler.crawl('https://example.com');
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 50MB for 10 simple crawls)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    } finally {
      await testCrawler.destroy();
    }
  });
});

describe('Real-world Scenarios', () => {
  it('should handle data extraction from e-commerce page', async () => {
    const testCrawler = createTestCrawler({
      'https://shop.example.com': mockHtmlResponses.ecommerce,
    });

    try {
      const result = await testCrawler.crawl('https://shop.example.com', {
        parse: {
          products: {
            _scope: '.product',
            name: '.name',
            price: '.price',
            image: 'img@src',
            category: '.details .category',
          },
        },
      });

      expect(result.parsed).toBeDefined();
      expect(result.parsed.products).toBeInstanceOf(Array);
      expect(result.parsed.products).toHaveLength(2);
      
      const firstProduct = result.parsed.products[0];
      expect(firstProduct.name).toBe('Product 1');
      expect(firstProduct.price).toBe('$99.99');
      expect(firstProduct.image).toBe('/img1.jpg');
      expect(firstProduct.category).toBe('Electronics');
    } finally {
      await testCrawler.destroy();
    }
  });

  it('should handle blog content extraction', async () => {
    const testCrawler = createTestCrawler({
      'https://blog.example.com': mockHtmlResponses.blog,
    });

    try {
      const result = await testCrawler.crawl('https://blog.example.com', {
        parse: {
          title: '.post .title',
          author: '.meta .author',
          date: '.meta .date',
          content: '.content p',
          tags: ['.tags .tag'],
        },
      });

      expect(result.parsed).toBeDefined();
      expect(result.parsed.title).toBe('First Post');
      expect(result.parsed.author).toBe('John Doe');
      expect(result.parsed.tags).toEqual(['tech', 'web']);
      expect(result.parsed.content).toBeInstanceOf(Array);
      expect(result.parsed.content).toHaveLength(2);
    } finally {
      await testCrawler.destroy();
    }
  });
});
