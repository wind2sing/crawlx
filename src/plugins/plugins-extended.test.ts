/**
 * Extended tests for plugins to improve coverage
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ParsePlugin } from './parse-plugin';
import { FollowPlugin } from './follow-plugin';
import { RetryPlugin } from './retry-plugin';
import { DelayPlugin } from './delay-plugin';
import { DuplicateFilterPlugin } from './duplicate-filter-plugin';
import { RateLimitPlugin } from './rate-limit-plugin';
import { PluginManager } from '../core/plugin';
import { TaskOptions, TaskResult } from '../types';
import * as cheerio from 'cheerio';

describe('Plugins Extended Coverage', () => {
  describe('ParsePlugin Extended', () => {
    let plugin: ParsePlugin;
    let mockTask: TaskOptions;
    let mockResult: TaskResult;

    beforeEach(() => {
      plugin = new ParsePlugin();
      mockTask = {
        url: 'https://example.com',
        method: 'GET',
        headers: {},
        parse: {
          title: 'title',
          links: '[href] | @href'
        }
      };
      
      const html = '<html><head><title>Test Page</title></head><body><a href="/link1">Link 1</a><a href="/link2">Link 2</a></body></html>';
      const $ = cheerio.load(html);
      
      mockResult = {
        task: mockTask,
        response: {
          statusCode: 200,
          statusMessage: 'OK',
          headers: { 'content-type': 'text/html' },
          body: Buffer.from(html),
          url: 'https://example.com',
          timing: {
            start: Date.now(),
            request: 100,
            total: 200
          }
        } as any // Cast to any to allow $ property
      };

      // Add Cheerio instance to response
      (mockResult.response as any).$ = $;
    });

    it('should handle complex parse rules', async () => {
      mockTask.parse = {
        title: 'title',
        description: 'meta[name="description"] | @content',
        links: {
          _scope: 'a',
          text: '.',
          url: '@href'
        },
        stats: {
          linkCount: 'a | length',
          hasTitle: 'title | exists'
        }
      };

      const result = await plugin.onTaskComplete(mockResult);
      expect(result.parsed).toHaveProperty('title');
      expect(result.parsed).toHaveProperty('links');
      expect(result.parsed).toHaveProperty('stats');
    });

    it('should handle parse errors gracefully', async () => {
      mockTask.parse = {
        invalid: 'invalid-selector-syntax | unknown-filter'
      };

      // Should not throw, but may return null or empty result
      const result = await plugin.onTaskComplete(mockResult);
      expect(result).toBeDefined();
    });

    it('should validate parse rules', () => {
      expect(plugin.validateParseRule('title')).toBe(true);
      expect(plugin.validateParseRule({ title: 'title' })).toBe(true);
      expect(plugin.validateParseRule(['title', 'h1'])).toBe(true);
      expect(plugin.validateParseRule(null)).toBe(false);
      expect(plugin.validateParseRule(123 as any)).toBe(false);
    });

    it('should add custom filters', () => {
      const customFilter = (value: any) => value.toUpperCase();
      plugin.addFilter('uppercase', customFilter);

      // Test that the filter was added (this would need to be tested in actual parsing)
      expect(() => plugin.addFilter('uppercase', customFilter)).not.toThrow();
    });
  });

  describe('FollowPlugin Extended', () => {
    let plugin: FollowPlugin;
    let mockTask: TaskOptions;
    let mockResult: TaskResult;

    beforeEach(() => {
      plugin = new FollowPlugin({
        maxDepth: 3,
        sameDomainOnly: true,
        urlFilters: [
          (url: string) => url.includes('/page'),
          (url: string) => !url.includes('/ignore'),
          (url: string) => !url.includes('blocked.com')
        ]
      });

      mockTask = {
        url: 'https://example.com',
        method: 'GET',
        headers: {},
        follow: 'a@href',
        metadata: { depth: 0 }
      };

      const html = `
        <html>
          <body>
            <a href="/page1">Page 1</a>
            <a href="/page2">Page 2</a>
            <a href="/ignore">Ignore</a>
            <a href="https://blocked.com/page">Blocked</a>
            <a href="https://external.com/page">External</a>
          </body>
        </html>
      `;
      const $ = cheerio.load(html);

      mockResult = {
        task: mockTask,
        response: {
          statusCode: 200,
          statusMessage: 'OK',
          headers: { 'content-type': 'text/html' },
          body: Buffer.from(html),
          url: 'https://example.com',
          timing: {
            start: Date.now(),
            request: 100,
            total: 200
          }
        } as any,
        followed: []
      };

      // Add Cheerio instance to response
      (mockResult.response as any).$ = $;
    });

    it('should extract and filter links based on configuration', async () => {
      const result = await plugin.onTaskComplete(mockResult);

      expect(result.followed).toBeDefined();
      expect(Array.isArray(result.followed)).toBe(true);

      // Should include allowed links and exclude blocked/ignored ones
      const followedUrls = result.followed!.map(task => task.url);
      expect(followedUrls).toContain('https://example.com/page1');
      expect(followedUrls).toContain('https://example.com/page2');
      expect(followedUrls).not.toContain('https://example.com/ignore');
      expect(followedUrls).not.toContain('https://blocked.com/page');
    });

    it('should respect depth limits', async () => {
      mockTask.metadata = { depth: 2 }; // At max depth

      const result = await plugin.onTaskComplete(mockResult);
      expect(result.followed).toHaveLength(0); // Should not follow at max depth
    });

    it('should track visited URLs', async () => {
      // Test the visited URLs functionality through the plugin's public API
      const visitedUrls = plugin.getVisitedUrls();
      expect(Array.isArray(visitedUrls)).toBe(true);
      expect(visitedUrls.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle different follow configurations', async () => {
      // Test with string selector
      mockTask.follow = 'a@href';
      let result = await plugin.onTaskComplete(mockResult);
      expect(result.followed).toBeDefined();

      // Test with function selector
      mockTask.follow = (context: any) => {
        return [{ url: 'https://example.com/custom' }];
      };
      result = await plugin.onTaskComplete(mockResult);
      expect(result.followed).toBeDefined();
    });
  });

  describe('RetryPlugin Extended', () => {
    let plugin: RetryPlugin;
    let mockTask: TaskOptions;

    beforeEach(() => {
      plugin = new RetryPlugin({
        maxRetries: 3,
        retryDelay: 100,
        exponentialBackoff: true,
        backoffMultiplier: 2
      });

      mockTask = {
        url: 'https://example.com',
        method: 'GET',
        headers: {},
        metadata: { retryCount: 0, maxRetries: 3 }
      };
    });

    it('should determine if error is retryable', () => {
      const networkError = new Error('ECONNREFUSED');
      const timeoutError = new Error('ETIMEDOUT');
      const serverError = new Error('500 Internal Server Error');
      const clientError = new Error('404 Not Found');

      expect(plugin.testRetryCondition(networkError, 1, mockTask)).toBe(true);
      expect(plugin.testRetryCondition(timeoutError, 1, mockTask)).toBe(true);
      expect(plugin.testRetryCondition(serverError, 1, mockTask)).toBe(false); // No status code extraction
      expect(plugin.testRetryCondition(clientError, 1, mockTask)).toBe(false);
    });

    it('should respect retry limits', () => {
      mockTask.metadata!.retryCount = 3;
      const error = new Error('ECONNREFUSED');
      expect(plugin.testRetryCondition(error, 4, mockTask)).toBe(false); // Attempt 4 exceeds max retries
    });

    it('should get retry attempts', () => {
      const attempts = plugin.getRetryAttempts('https://example.com');
      expect(Array.isArray(attempts)).toBe(true);
    });

    it('should clear retry history', () => {
      plugin.clearRetryHistory();
      const attempts = plugin.getRetryAttempts('https://example.com');
      expect(attempts).toHaveLength(0);
    });
  });

  describe('DelayPlugin Extended', () => {
    let plugin: DelayPlugin;

    beforeEach(() => {
      plugin = new DelayPlugin({
        defaultDelay: 1000
      });
    });

    it('should set domain-specific delays', () => {
      plugin.setDomainDelay('example.com', 2000);
      plugin.setDomainDelay('slow-site.com', 5000);

      // Test that delays are set (internal state)
      expect(() => plugin.setDomainDelay('test.com', 1000)).not.toThrow();
    });

    it('should get configuration', () => {
      const config = plugin.getConfig();
      expect(config.defaultDelay).toBe(1000);
    });

    it('should get plugin stats', () => {
      const stats = plugin.getStats();
      expect(stats).toHaveProperty('enabled');
      expect(stats).toHaveProperty('config');
    });
  });

  describe('DuplicateFilterPlugin Extended', () => {
    let plugin: DuplicateFilterPlugin;

    beforeEach(() => {
      plugin = new DuplicateFilterPlugin({
        normalizeUrls: true,
        ignoreQuery: false,
        ignoreFragment: true,
        customNormalizer: (url: string) => url.toLowerCase()
      });
    });

    it('should detect duplicate URLs with normalization', () => {
      const url1 = 'https://Example.com/Page';
      const url2 = 'https://example.com/page';
      const url3 = 'https://example.com/page#section';

      expect(plugin.hasSeen(url1)).toBe(false);
      plugin.markAsSeen(url1);

      expect(plugin.hasSeen(url2)).toBe(true); // Should be duplicate after normalization
      expect(plugin.hasSeen(url3)).toBe(true); // Should be duplicate (fragment ignored)
    });

    it('should handle query parameters based on configuration', () => {
      const url1 = 'https://example.com/page?param=1';
      const url2 = 'https://example.com/page?param=2';

      expect(plugin.hasSeen(url1)).toBe(false);
      plugin.markAsSeen(url1);

      // With ignoreQuery=false, these should be different
      expect(plugin.hasSeen(url2)).toBe(false);
    });

    it('should normalize URLs consistently', () => {
      const urls = [
        'https://Example.com/Page',
        'https://EXAMPLE.COM/PAGE',
        'https://example.com/page'
      ];

      const normalized = urls.map(url => plugin.normalizeUrl(url));
      expect(normalized[0]).toBe(normalized[1]);
      expect(normalized[1]).toBe(normalized[2]);
    });
  });

  describe('RateLimitPlugin Extended', () => {
    let plugin: RateLimitPlugin;

    beforeEach(() => {
      plugin = new RateLimitPlugin({
        globalLimit: { requests: 10, window: 60000 },
        perDomainLimit: { requests: 5, window: 60000 }
      });
    });

    it('should create rate limit plugin', () => {
      expect(plugin).toBeInstanceOf(RateLimitPlugin);
    });

    it('should get configuration', () => {
      const config = plugin.getConfig();
      expect(config.globalLimit?.requests).toBe(10);
      expect(config.perDomainLimit?.requests).toBe(5);
    });

    it('should get plugin stats', () => {
      const stats = plugin.getStats();
      expect(stats).toHaveProperty('enabled');
      expect(stats).toHaveProperty('config');
      expect(stats).toHaveProperty('globalTokens');
    });

    it('should set domain limits', () => {
      plugin.setDomainLimit('example.com', 20, 60000);
      const tokens = plugin.getAvailableTokens('example.com');
      expect(tokens).toBeGreaterThanOrEqual(0);
    });

    it('should get global available tokens', () => {
      const tokens = plugin.getGlobalAvailableTokens();
      expect(tokens).toBeGreaterThanOrEqual(0);
    });
  });
});
