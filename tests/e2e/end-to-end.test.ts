/**
 * End-to-End Tests for CrawlX
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { CrawlX } from '@/core/crawlx';
import { 
  createLightweightCrawler, 
  createScraper, 
  createSpider,
  quickCrawl,
  batchCrawl 
} from '@/utils/factory';
import { ConfigPresets } from '@/config';
import { createTestCrawler, mockHtmlResponses, MockServer } from '../helpers/test-utils';

describe('End-to-End Tests', () => {
  let mockServer: MockServer;

  beforeAll(() => {
    mockServer = new MockServer();
    
    // Setup comprehensive mock responses
    mockServer.addResponse('https://example.com', mockHtmlResponses.simple);
    mockServer.addResponse('https://shop.example.com', mockHtmlResponses.ecommerce);
    mockServer.addResponse('https://blog.example.com', mockHtmlResponses.blog);
    
    // Add linked pages for following tests
    mockServer.addResponse('https://example.com/page1', `
      <html>
        <head><title>Page 1</title></head>
        <body>
          <h1>Page 1</h1>
          <a href="/page2">Go to Page 2</a>
          <a href="/page3">Go to Page 3</a>
        </body>
      </html>
    `);
    
    mockServer.addResponse('https://example.com/page2', `
      <html>
        <head><title>Page 2</title></head>
        <body>
          <h1>Page 2</h1>
          <p>This is page 2 content.</p>
        </body>
      </html>
    `);
    
    mockServer.addResponse('https://example.com/page3', `
      <html>
        <head><title>Page 3</title></head>
        <body>
          <h1>Page 3</h1>
          <p>This is page 3 content.</p>
        </body>
      </html>
    `);
  });

  afterAll(() => {
    mockServer.reset();
  });

  describe('Complete Crawling Workflows', () => {
    it('should perform basic single-page crawling workflow', async () => {
      const crawler = createTestCrawler({
        'https://example.com': mockHtmlResponses.simple,
      });

      try {
        // Step 1: Basic crawl
        const result = await crawler.crawl('https://example.com');
        
        expect(result).toBeDefined();
        expect(result.response.statusCode).toBe(200);
        expect(result.response.$).toBeDefined();
        expect(result.response.$.find('title').text()).toBe('Test Page');
        
        // Step 2: Check crawler statistics
        const stats = crawler.getStats();
        expect(stats.results).toBe(1);
        expect(stats.isRunning).toBe(false);
      } finally {
        await crawler.destroy();
      }
    });

    it('should perform data extraction workflow', async () => {
      const scraper = createTestCrawler({
        'https://shop.example.com': mockHtmlResponses.ecommerce,
      });

      try {
        // Step 1: Extract structured data
        const result = await scraper.crawl('https://shop.example.com', {
          parse: {
            title: 'title',
            products: {
              _scope: '.product',
              name: '.name',
              price: '.price',
              image: 'img@src',
              id: '@data-id',
              details: {
                _scope: '.details',
                description: '.description',
                category: '.category',
              },
            },
          },
        });

        // Step 2: Validate extracted data
        expect(result.parsed).toBeDefined();
        expect(result.parsed.title).toBe('E-commerce Site');
        expect(result.parsed.products).toBeInstanceOf(Array);
        expect(result.parsed.products).toHaveLength(2);
        
        const firstProduct = result.parsed.products[0];
        expect(firstProduct.name).toBe('Product 1');
        expect(firstProduct.price).toBe('$99.99');
        expect(firstProduct.image).toBe('/img1.jpg');
        expect(firstProduct.id).toBe('1');
        expect(firstProduct.details.description).toBe('Great product');
        expect(firstProduct.details.category).toBe('Electronics');
      } finally {
        await scraper.destroy();
      }
    });

    it('should perform multi-page crawling workflow', async () => {
      const urls = [
        'https://example.com',
        'https://shop.example.com',
        'https://blog.example.com',
      ];

      const crawler = createTestCrawler({
        'https://example.com': mockHtmlResponses.simple,
        'https://shop.example.com': mockHtmlResponses.ecommerce,
        'https://blog.example.com': mockHtmlResponses.blog,
      });

      try {
        // Step 1: Crawl multiple URLs
        const results = await crawler.crawlMany(urls, {
          parse: {
            title: 'title',
            type: (response: any) => {
              const title = response.$.find('title').text();
              if (title.includes('E-commerce')) return 'shop';
              if (title.includes('Blog')) return 'blog';
              return 'general';
            },
          },
        });

        // Step 2: Validate results
        expect(results).toHaveLength(3);
        
        results.forEach(result => {
          expect(result.response.statusCode).toBe(200);
          expect(result.parsed).toBeDefined();
          expect(result.parsed.title).toBeDefined();
          expect(result.parsed.type).toBeDefined();
        });

        // Step 3: Check specific results
        const shopResult = results.find(r => r.parsed.type === 'shop');
        const blogResult = results.find(r => r.parsed.type === 'blog');
        const generalResult = results.find(r => r.parsed.type === 'general');

        expect(shopResult).toBeDefined();
        expect(blogResult).toBeDefined();
        expect(generalResult).toBeDefined();
      } finally {
        await crawler.destroy();
      }
    });
  });

  describe('Factory Function Workflows', () => {
    it('should work with lightweight crawler factory', async () => {
      const crawler = createLightweightCrawler({
        logLevel: 'silent',
        timeout: 5000,
      });

      // Mock the HTTP client
      const originalRequest = crawler['httpClient'].requestWithCheerio;
      crawler['httpClient'].requestWithCheerio = async (request) => {
        const cheerio = require('cheerio');
        const $ = cheerio.load(mockHtmlResponses.simple);
        
        return {
          url: request.url,
          statusCode: 200,
          statusMessage: 'OK',
          headers: { 'content-type': 'text/html' },
          body: Buffer.from(mockHtmlResponses.simple),
          $,
        };
      };

      try {
        const result = await crawler.crawl('https://example.com');
        
        expect(result).toBeDefined();
        expect(crawler.getConfig().get('mode')).toBe('lightweight');
        expect(crawler.getConfig().get('concurrency')).toBe(2);
      } finally {
        await crawler.destroy();
      }
    });

    it('should work with scraper factory', async () => {
      const scraper = createScraper({
        logLevel: 'silent',
      });

      // Mock the HTTP client
      const originalRequest = scraper['httpClient'].requestWithCheerio;
      scraper['httpClient'].requestWithCheerio = async (request) => {
        const cheerio = require('cheerio');
        const $ = cheerio.load(mockHtmlResponses.ecommerce);
        
        return {
          url: request.url,
          statusCode: 200,
          statusMessage: 'OK',
          headers: { 'content-type': 'text/html' },
          body: Buffer.from(mockHtmlResponses.ecommerce),
          $,
        };
      };

      try {
        const result = await scraper.crawl('https://shop.example.com', {
          parse: {
            products: {
              _scope: '.product',
              name: '.name',
              price: '.price',
            },
          },
        });

        expect(result.parsed).toBeDefined();
        expect(result.parsed.products).toHaveLength(2);
      } finally {
        await scraper.destroy();
      }
    });
  });

  describe('Configuration Preset Workflows', () => {
    it('should work with development preset', () => {
      const crawler = ConfigPresets.development();
      
      expect(crawler.getConfig().get('logLevel')).toBe('debug');
      expect(crawler.getConfig().get('concurrency')).toBe(2);
      
      crawler.destroy();
    });

    it('should work with production preset', () => {
      const crawler = ConfigPresets.production();
      
      expect(crawler.getConfig().get('logLevel')).toBe('info');
      expect(crawler.getConfig().get('mode')).toBe('high-performance');
      
      crawler.destroy();
    });

    it('should work with testing preset', () => {
      const crawler = ConfigPresets.testing();
      
      expect(crawler.getConfig().get('logLevel')).toBe('silent');
      expect(crawler.getConfig().get('maxRetries')).toBe(0);
      
      crawler.destroy();
    });
  });

  describe('Plugin Integration Workflows', () => {
    it('should work with all plugins enabled', async () => {
      const crawler = new CrawlX({
        logLevel: 'silent',
        plugins: {
          parse: { enabled: true },
          follow: { enabled: true, maxDepth: 2 },
          retry: { enabled: true, maxRetries: 2 },
          delay: { enabled: true, defaultDelay: 100 },
          duplicateFilter: { enabled: true },
          rateLimit: { enabled: false }, // Disable for testing
        },
      });

      // Mock the HTTP client
      const originalRequest = crawler['httpClient'].requestWithCheerio;
      crawler['httpClient'].requestWithCheerio = async (request) => {
        const cheerio = require('cheerio');
        const $ = cheerio.load(mockHtmlResponses.simple);
        
        return {
          url: request.url,
          statusCode: 200,
          statusMessage: 'OK',
          headers: { 'content-type': 'text/html' },
          body: Buffer.from(mockHtmlResponses.simple),
          $,
        };
      };

      try {
        const result = await crawler.crawl('https://example.com', {
          parse: { title: 'title' },
        });

        expect(result).toBeDefined();
        expect(result.parsed).toBeDefined();
        expect(result.parsed.title).toBe('Test Page');
        
        // Check that plugins are working
        const stats = crawler.getStats().plugins;
        expect(stats.enabled).toBeGreaterThan(0);
      } finally {
        await crawler.destroy();
      }
    });

    it('should handle custom plugin workflow', async () => {
      const crawler = createTestCrawler({
        'https://example.com': mockHtmlResponses.simple,
      });

      // Add custom plugin
      class TimestampPlugin {
        name = 'timestamp';
        version = '1.0.0';
        priority = 50;

        async onTaskComplete(result: any) {
          result.timestamp = new Date().toISOString();
          return result;
        }
      }

      crawler.addPlugin(new TimestampPlugin());

      try {
        const result = await crawler.crawl('https://example.com');
        
        expect(result).toBeDefined();
        expect(result.timestamp).toBeDefined();
        expect(typeof result.timestamp).toBe('string');
      } finally {
        await crawler.destroy();
      }
    });
  });

  describe('Error Recovery Workflows', () => {
    it('should handle and recover from errors gracefully', async () => {
      const crawler = new CrawlX({
        logLevel: 'silent',
        maxRetries: 2,
        timeout: 1000,
      });

      let attemptCount = 0;
      
      // Mock HTTP client to fail first attempt, succeed on retry
      const originalRequest = crawler['httpClient'].requestWithCheerio;
      crawler['httpClient'].requestWithCheerio = async (request) => {
        attemptCount++;
        
        if (attemptCount === 1) {
          throw new Error('Network error');
        }
        
        const cheerio = require('cheerio');
        const $ = cheerio.load(mockHtmlResponses.simple);
        
        return {
          url: request.url,
          statusCode: 200,
          statusMessage: 'OK',
          headers: { 'content-type': 'text/html' },
          body: Buffer.from(mockHtmlResponses.simple),
          $,
        };
      };

      try {
        const result = await crawler.crawl('https://example.com');
        
        expect(result).toBeDefined();
        expect(attemptCount).toBeGreaterThan(1); // Should have retried
      } finally {
        await crawler.destroy();
      }
    });
  });

  describe('Real-world Simulation', () => {
    it('should simulate a complete web scraping project', async () => {
      // Simulate scraping a news website
      const newsHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>News Site</title>
        </head>
        <body>
          <div class="article" data-id="1">
            <h2 class="headline">Breaking News 1</h2>
            <div class="meta">
              <span class="author">Reporter A</span>
              <time class="date">2024-01-01</time>
              <span class="category">Politics</span>
            </div>
            <div class="content">
              <p>This is the first paragraph of the news article.</p>
              <p>This is the second paragraph with more details.</p>
            </div>
            <div class="tags">
              <span class="tag">breaking</span>
              <span class="tag">politics</span>
            </div>
          </div>
          <div class="article" data-id="2">
            <h2 class="headline">Tech Update</h2>
            <div class="meta">
              <span class="author">Tech Writer</span>
              <time class="date">2024-01-02</time>
              <span class="category">Technology</span>
            </div>
            <div class="content">
              <p>Latest technology news and updates.</p>
            </div>
            <div class="tags">
              <span class="tag">tech</span>
              <span class="tag">innovation</span>
            </div>
          </div>
        </body>
        </html>
      `;

      const scraper = createTestCrawler({
        'https://news.example.com': newsHtml,
      });

      try {
        // Step 1: Extract news articles
        const result = await scraper.crawl('https://news.example.com', {
          parse: {
            site: 'title',
            articles: {
              _scope: '.article',
              id: '@data-id',
              headline: '.headline',
              author: '.meta .author',
              date: '.meta .date',
              category: '.meta .category',
              content: '.content p',
              tags: ['.tags .tag'],
            },
          },
        });

        // Step 2: Validate comprehensive data extraction
        expect(result.parsed).toBeDefined();
        expect(result.parsed.site).toBe('News Site');
        expect(result.parsed.articles).toHaveLength(2);

        const firstArticle = result.parsed.articles[0];
        expect(firstArticle.id).toBe('1');
        expect(firstArticle.headline).toBe('Breaking News 1');
        expect(firstArticle.author).toBe('Reporter A');
        expect(firstArticle.category).toBe('Politics');
        expect(firstArticle.content).toHaveLength(2);
        expect(firstArticle.tags).toEqual(['breaking', 'politics']);

        const secondArticle = result.parsed.articles[1];
        expect(secondArticle.id).toBe('2');
        expect(secondArticle.headline).toBe('Tech Update');
        expect(secondArticle.tags).toEqual(['tech', 'innovation']);

        // Step 3: Verify crawler statistics
        const stats = scraper.getStats();
        expect(stats.results).toBe(1);
        expect(stats.plugins.enabled).toBeGreaterThan(0);
      } finally {
        await scraper.destroy();
      }
    });
  });
});
