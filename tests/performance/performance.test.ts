/**
 * Performance Tests for CrawlX
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CrawlX } from '@/core/crawlx';
import { createLightweightCrawler, createHighPerformanceCrawler } from '@/utils/factory';
import { 
  createTestCrawler, 
  mockHtmlResponses, 
  PerformanceTimer, 
  getMemoryUsage,
  MockServer 
} from '../helpers/test-utils';

describe('Performance Tests', () => {
  let mockServer: MockServer;

  beforeEach(() => {
    mockServer = new MockServer();
    
    // Setup mock responses
    for (let i = 1; i <= 100; i++) {
      mockServer.addResponse(
        `https://example${i}.com`,
        mockHtmlResponses.simple.replace('Test Page', `Test Page ${i}`)
      );
    }
  });

  afterEach(() => {
    mockServer.reset();
  });

  describe('Crawling Performance', () => {
    it('should handle single URL crawling efficiently', async () => {
      const timer = new PerformanceTimer();
      const crawler = createTestCrawler({
        'https://example.com': mockHtmlResponses.simple,
      });

      timer.start();
      
      try {
        const result = await crawler.crawl('https://example.com');
        const duration = timer.stop();
        
        expect(result).toBeDefined();
        expect(result.response.statusCode).toBe(200);
        expect(duration).toBeLessThan(1000); // Should complete within 1 second
      } finally {
        await crawler.destroy();
      }
    });

    it('should handle multiple URLs with good throughput', async () => {
      const timer = new PerformanceTimer();
      const urls = Array.from({ length: 20 }, (_, i) => `https://example${i + 1}.com`);
      const mockResponses: Record<string, string> = {};
      
      urls.forEach(url => {
        mockResponses[url] = mockHtmlResponses.simple;
      });

      const crawler = createTestCrawler(mockResponses);
      
      timer.start();
      
      try {
        const results = await crawler.crawlMany(urls);
        const duration = timer.stop();
        
        expect(results).toHaveLength(20);
        expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
        
        // Calculate throughput
        const throughput = results.length / (duration / 1000);
        expect(throughput).toBeGreaterThan(2); // At least 2 URLs per second
      } finally {
        await crawler.destroy();
      }
    });

    it('should scale with concurrency settings', async () => {
      const urls = Array.from({ length: 10 }, (_, i) => `https://example${i + 1}.com`);
      const mockResponses: Record<string, string> = {};
      
      urls.forEach(url => {
        mockResponses[url] = mockHtmlResponses.simple;
      });

      // Test with low concurrency
      const lowConcurrencyCrawler = createTestCrawler(mockResponses);
      lowConcurrencyCrawler.updateConfig({ concurrency: 1 });
      
      const timer1 = new PerformanceTimer();
      timer1.start();
      
      try {
        await lowConcurrencyCrawler.crawlMany(urls);
        const lowConcurrencyTime = timer1.stop();
        
        // Test with high concurrency
        const highConcurrencyCrawler = createTestCrawler(mockResponses);
        highConcurrencyCrawler.updateConfig({ concurrency: 5 });
        
        const timer2 = new PerformanceTimer();
        timer2.start();
        
        try {
          await highConcurrencyCrawler.crawlMany(urls);
          const highConcurrencyTime = timer2.stop();
          
          // High concurrency should be faster (or at least not significantly slower)
          expect(highConcurrencyTime).toBeLessThanOrEqual(lowConcurrencyTime * 1.2);
        } finally {
          await highConcurrencyCrawler.destroy();
        }
      } finally {
        await lowConcurrencyCrawler.destroy();
      }
    });
  });

  describe('Memory Performance', () => {
    it('should maintain stable memory usage during crawling', async () => {
      const urls = Array.from({ length: 50 }, (_, i) => `https://example${i + 1}.com`);
      const mockResponses: Record<string, string> = {};
      
      urls.forEach(url => {
        mockResponses[url] = mockHtmlResponses.simple;
      });

      const crawler = createTestCrawler(mockResponses);
      const initialMemory = getMemoryUsage();
      
      try {
        // Crawl in batches to simulate real usage
        for (let i = 0; i < 5; i++) {
          const batch = urls.slice(i * 10, (i + 1) * 10);
          await crawler.crawlMany(batch);
          
          // Force garbage collection if available
          if (global.gc) {
            global.gc();
          }
        }
        
        const finalMemory = getMemoryUsage();
        const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
        
        // Memory increase should be reasonable (less than 100MB for 50 crawls)
        expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
      } finally {
        await crawler.destroy();
      }
    });

    it('should clean up resources properly', async () => {
      const initialMemory = getMemoryUsage();
      
      // Create and destroy multiple crawlers
      for (let i = 0; i < 5; i++) {
        const crawler = createTestCrawler({
          'https://example.com': mockHtmlResponses.simple,
        });
        
        await crawler.crawl('https://example.com');
        await crawler.destroy();
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = getMemoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be minimal after cleanup
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Parser Performance', () => {
    it('should parse complex documents efficiently', async () => {
      const complexHtml = `
        <!DOCTYPE html>
        <html>
        <body>
          ${Array.from({ length: 1000 }, (_, i) => `
            <div class="item" data-id="${i}">
              <h3 class="title">Item ${i}</h3>
              <p class="description">Description for item ${i}</p>
              <span class="price">$${(i * 10).toFixed(2)}</span>
              <div class="meta">
                <span class="category">Category ${i % 10}</span>
                <span class="rating">${(Math.random() * 5).toFixed(1)}</span>
              </div>
            </div>
          `).join('')}
        </body>
        </html>
      `;

      const crawler = createTestCrawler({
        'https://complex.example.com': complexHtml,
      });

      const timer = new PerformanceTimer();
      timer.start();
      
      try {
        const result = await crawler.crawl('https://complex.example.com', {
          parse: {
            items: {
              _scope: '.item',
              id: '@data-id',
              title: '.title',
              description: '.description',
              price: '.price',
              category: '.meta .category',
              rating: '.meta .rating',
            },
          },
        });
        
        const duration = timer.stop();
        
        expect(result.parsed).toBeDefined();
        expect(result.parsed.items).toHaveLength(1000);
        expect(duration).toBeLessThan(2000); // Should parse 1000 items within 2 seconds
      } finally {
        await crawler.destroy();
      }
    });

    it('should handle multiple parse rules efficiently', async () => {
      const crawler = createTestCrawler({
        'https://example.com': mockHtmlResponses.ecommerce,
      });

      const complexParseRule = {
        title: 'title',
        products: {
          _scope: '.product',
          name: '.name',
          price: '.price',
          image: 'img@src',
          details: {
            _scope: '.details',
            description: '.description',
            category: '.category',
          },
        },
        metadata: {
          productCount: () => document.querySelectorAll('.product').length,
          timestamp: () => new Date().toISOString(),
        },
      };

      const timer = new PerformanceTimer();
      timer.start();
      
      try {
        const result = await crawler.crawl('https://example.com', {
          parse: complexParseRule,
        });
        
        const duration = timer.stop();
        
        expect(result.parsed).toBeDefined();
        expect(duration).toBeLessThan(500); // Should complete within 500ms
      } finally {
        await crawler.destroy();
      }
    });
  });

  describe('Plugin Performance', () => {
    it('should handle plugin processing efficiently', async () => {
      const crawler = new CrawlX({
        logLevel: 'silent',
        concurrency: 5,
        plugins: {
          parse: { enabled: true },
          follow: { enabled: true },
          retry: { enabled: true },
          delay: { enabled: true, defaultDelay: 10 }, // Minimal delay for testing
          duplicateFilter: { enabled: true },
          rateLimit: { enabled: false }, // Disable for performance testing
        },
      });

      // Mock the HTTP client
      const mockResponses: Record<string, string> = {};
      Array.from({ length: 20 }, (_, i) => {
        mockResponses[`https://example${i + 1}.com`] = mockHtmlResponses.simple;
      });

      const originalRequest = crawler['httpClient'].requestWithCheerio;
      crawler['httpClient'].requestWithCheerio = async (request) => {
        const url = request.url;
        const html = mockResponses[url] || mockHtmlResponses.simple;
        const cheerio = require('cheerio');
        const $ = cheerio.load(html);
        
        return {
          url,
          statusCode: 200,
          statusMessage: 'OK',
          headers: { 'content-type': 'text/html' },
          body: Buffer.from(html),
          $,
        };
      };

      const timer = new PerformanceTimer();
      timer.start();
      
      try {
        const urls = Array.from({ length: 20 }, (_, i) => `https://example${i + 1}.com`);
        const results = await crawler.crawlMany(urls, {
          parse: { title: 'title' },
        });
        
        const duration = timer.stop();
        
        expect(results).toHaveLength(20);
        expect(duration).toBeLessThan(3000); // Should complete within 3 seconds with all plugins
      } finally {
        await crawler.destroy();
      }
    });
  });

  describe('Stress Tests', () => {
    it('should handle high-volume crawling', async () => {
      const crawler = createHighPerformanceCrawler({
        concurrency: 10,
        timeout: 5000,
        logLevel: 'silent',
      });

      // Mock a large number of URLs
      const urls = Array.from({ length: 100 }, (_, i) => `https://stress${i + 1}.com`);
      const mockResponses: Record<string, string> = {};
      
      urls.forEach(url => {
        mockResponses[url] = mockHtmlResponses.simple;
      });

      // Mock the HTTP client
      const originalRequest = crawler['httpClient'].requestWithCheerio;
      crawler['httpClient'].requestWithCheerio = async (request) => {
        const url = request.url;
        const html = mockResponses[url] || mockHtmlResponses.simple;
        const cheerio = require('cheerio');
        const $ = cheerio.load(html);
        
        return {
          url,
          statusCode: 200,
          statusMessage: 'OK',
          headers: { 'content-type': 'text/html' },
          body: Buffer.from(html),
          $,
        };
      };

      const timer = new PerformanceTimer();
      timer.start();
      
      try {
        const results = await crawler.crawlMany(urls);
        const duration = timer.stop();
        
        expect(results).toHaveLength(100);
        expect(duration).toBeLessThan(15000); // Should complete within 15 seconds
        
        // Calculate throughput
        const throughput = results.length / (duration / 1000);
        expect(throughput).toBeGreaterThan(5); // At least 5 URLs per second
      } finally {
        await crawler.destroy();
      }
    }, 20000); // Increase timeout for stress test
  });
});
