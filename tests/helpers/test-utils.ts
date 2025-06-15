/**
 * Test utilities and helpers
 */

import { vi } from 'vitest';
import { CrawlX } from '@/core/crawlx';
import { HttpResponse } from '@/types';

/**
 * Mock HTML responses for testing
 */
export const mockHtmlResponses = {
  simple: `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Test Page</title>
      <meta name="description" content="Test description">
    </head>
    <body>
      <h1 class="title">Welcome</h1>
      <p class="content">This is test content.</p>
      <a href="/link1" class="link">Link 1</a>
      <a href="/link2" class="link">Link 2</a>
    </body>
    </html>
  `,
  
  ecommerce: `
    <!DOCTYPE html>
    <html>
    <head>
      <title>E-commerce Site</title>
    </head>
    <body>
      <div class="product" data-id="1">
        <h2 class="name">Product 1</h2>
        <span class="price">$99.99</span>
        <img src="/img1.jpg" alt="Product 1">
        <div class="details">
          <p class="description">Great product</p>
          <span class="category">Electronics</span>
        </div>
      </div>
      <div class="product" data-id="2">
        <h2 class="name">Product 2</h2>
        <span class="price">$149.99</span>
        <img src="/img2.jpg" alt="Product 2">
        <div class="details">
          <p class="description">Amazing product</p>
          <span class="category">Gadgets</span>
        </div>
      </div>
    </body>
    </html>
  `,
  
  blog: `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Blog Site</title>
    </head>
    <body>
      <article class="post">
        <h1 class="title">First Post</h1>
        <div class="meta">
          <span class="author">John Doe</span>
          <time class="date">2024-01-01</time>
        </div>
        <div class="content">
          <p>This is the first paragraph.</p>
          <p>This is the second paragraph.</p>
        </div>
        <div class="tags">
          <span class="tag">tech</span>
          <span class="tag">web</span>
        </div>
      </article>
    </body>
    </html>
  `,
};

/**
 * Create mock HTTP response
 */
export function createMockResponse(
  html: string,
  url: string = 'https://example.com',
  statusCode: number = 200
): HttpResponse {
  const cheerio = require('cheerio');
  const $ = cheerio.load(html);
  
  return {
    url,
    statusCode,
    statusMessage: 'OK',
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'content-length': html.length.toString(),
    },
    body: Buffer.from(html),
    $,
  };
}

/**
 * Create test crawler with mocked HTTP client
 */
export function createTestCrawler(mockResponses: Record<string, string> = {}) {
  const crawler = new CrawlX({
    logLevel: 'silent',
    timeout: 5000,
  });

  // Mock the HTTP client
  const originalRequest = crawler['httpClient'].requestWithCheerio;
  crawler['httpClient'].requestWithCheerio = vi.fn().mockImplementation(async (request) => {
    const url = request.url;
    const html = mockResponses[url] || mockHtmlResponses.simple;
    return createMockResponse(html, url);
  });

  return crawler;
}

/**
 * Wait for a specified amount of time
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a test server mock
 */
export class MockServer {
  private responses = new Map<string, { html: string; statusCode: number }>();
  private requestLog: Array<{ url: string; timestamp: number }> = [];

  addResponse(url: string, html: string, statusCode: number = 200) {
    this.responses.set(url, { html, statusCode });
  }

  getResponse(url: string) {
    const response = this.responses.get(url);
    if (!response) {
      return { html: '<html><body>Not Found</body></html>', statusCode: 404 };
    }
    
    this.requestLog.push({ url, timestamp: Date.now() });
    return response;
  }

  getRequestLog() {
    return [...this.requestLog];
  }

  clearRequestLog() {
    this.requestLog = [];
  }

  reset() {
    this.responses.clear();
    this.requestLog = [];
  }
}

/**
 * Performance measurement utilities
 */
export class PerformanceTimer {
  private startTime: number = 0;
  private endTime: number = 0;

  start() {
    this.startTime = performance.now();
  }

  stop() {
    this.endTime = performance.now();
    return this.getDuration();
  }

  getDuration() {
    return this.endTime - this.startTime;
  }
}

/**
 * Memory usage measurement
 */
export function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    rss: usage.rss,
    heapTotal: usage.heapTotal,
    heapUsed: usage.heapUsed,
    external: usage.external,
    arrayBuffers: usage.arrayBuffers,
  };
}

/**
 * Test data generators
 */
export const testData = {
  urls: {
    valid: [
      'https://example.com',
      'http://test.org',
      'https://subdomain.example.com/path',
      'https://example.com/path?query=value',
    ],
    invalid: [
      'invalid-url',
      'ftp://example.com',
      '',
      'javascript:alert(1)',
    ],
  },
  
  parseRules: {
    simple: {
      title: 'title',
      content: '.content',
    },
    complex: {
      products: {
        _scope: '.product',
        name: '.name',
        price: '.price | trim | number',
        image: 'img@src',
        details: {
          _scope: '.details',
          description: '.description',
          category: '.category',
        },
      },
    },
    withFilters: {
      title: 'title | trim | uppercase',
      price: '.price | trim | number',
      date: '.date | date',
    },
  },
};

/**
 * Assertion helpers
 */
export const assertions = {
  isValidUrl: (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
  
  hasProperty: (obj: any, path: string) => {
    const keys = path.split('.');
    let current = obj;
    for (const key of keys) {
      if (current === null || current === undefined || !(key in current)) {
        return false;
      }
      current = current[key];
    }
    return true;
  },
  
  isPositiveNumber: (value: any) => {
    return typeof value === 'number' && value > 0;
  },
};

/**
 * Test configuration presets
 */
export const testConfigs = {
  minimal: {
    logLevel: 'silent' as const,
    timeout: 1000,
    concurrency: 1,
    maxRetries: 0,
  },
  
  standard: {
    logLevel: 'silent' as const,
    timeout: 5000,
    concurrency: 2,
    maxRetries: 1,
  },
  
  performance: {
    logLevel: 'silent' as const,
    timeout: 10000,
    concurrency: 10,
    maxRetries: 3,
  },
};
