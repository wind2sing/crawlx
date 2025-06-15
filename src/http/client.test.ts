/**
 * HTTP Client tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { HttpClient, HttpUtils } from './client';
import { LightweightClient } from './lightweight-client';
import { HighPerformanceClient } from './high-performance-client';

describe('HttpClient', () => {
  let client: HttpClient;

  afterEach(() => {
    if (client) {
      client.destroy();
    }
  });

  describe('Client creation', () => {
    it('should create lightweight client by default', () => {
      client = new HttpClient();
      expect(client.getMode()).toBe('lightweight');
    });

    it('should create high-performance client when specified', () => {
      client = new HttpClient('high-performance');
      expect(client.getMode()).toBe('high-performance');
    });

    it('should create client with factory methods', () => {
      const lightweightClient = HttpClient.createLightweight();
      expect(lightweightClient.getMode()).toBe('lightweight');
      lightweightClient.destroy();

      const highPerfClient = HttpClient.createHighPerformance();
      expect(highPerfClient.getMode()).toBe('high-performance');
      highPerfClient.destroy();
    });
  });

  describe('Mode switching', () => {
    it('should switch between modes', () => {
      client = new HttpClient('lightweight');
      expect(client.getMode()).toBe('lightweight');

      client.switchMode('high-performance');
      expect(client.getMode()).toBe('high-performance');

      client.switchMode('lightweight');
      expect(client.getMode()).toBe('lightweight');
    });

    it('should not recreate client when switching to same mode', () => {
      client = new HttpClient('lightweight');
      const originalStats = client.getStats();
      
      client.switchMode('lightweight');
      expect(client.getStats()).toEqual(originalStats);
    });
  });

  describe('Request methods', () => {
    beforeEach(() => {
      client = new HttpClient('lightweight');
    });

    it('should have all HTTP methods', () => {
      expect(typeof client.get).toBe('function');
      expect(typeof client.post).toBe('function');
      expect(typeof client.put).toBe('function');
      expect(typeof client.delete).toBe('function');
      expect(typeof client.patch).toBe('function');
    });

    it('should validate URLs', async () => {
      await expect(client.get('invalid-url')).rejects.toThrow('Invalid URL');
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      client = new HttpClient('lightweight');
    });

    it('should provide statistics', () => {
      const stats = client.getStats();
      expect(stats).toHaveProperty('mode');
      expect(stats).toHaveProperty('activeRequests');
      expect(stats).toHaveProperty('totalRequests');
      expect(stats).toHaveProperty('totalBytes');
      expect(stats).toHaveProperty('averageResponseTime');
    });
  });
});

describe('LightweightClient', () => {
  let client: LightweightClient;

  afterEach(() => {
    if (client) {
      client.destroy();
    }
  });

  it('should create client with default options', () => {
    client = new LightweightClient();
    const options = client.getOptions();
    expect(options.timeout).toBe(30000);
    expect(options.userAgent).toBe('CrawlX/2.0.0');
  });

  it('should create client with custom options', () => {
    client = new LightweightClient({
      timeout: 10000,
      userAgent: 'Custom Agent',
    });
    const options = client.getOptions();
    expect(options.timeout).toBe(10000);
    expect(options.userAgent).toBe('Custom Agent');
  });

  it('should provide statistics', () => {
    client = new LightweightClient();
    const stats = client.getStats();
    expect(stats.activeRequests).toBe(0);
    expect(stats.totalRequests).toBe(0);
    expect(stats.totalBytes).toBe(0);
    expect(stats.averageResponseTime).toBe(0);
  });
});

describe('HighPerformanceClient', () => {
  let client: HighPerformanceClient;

  afterEach(() => {
    if (client) {
      client.destroy();
    }
  });

  it('should create client with connection pooling', () => {
    client = new HighPerformanceClient();
    const stats = client.getStats();
    expect(stats).toHaveProperty('connectionPoolSize');
    expect(stats).toHaveProperty('cacheHits');
    expect(stats).toHaveProperty('cacheSize');
  });

  it('should provide connection pool status', () => {
    client = new HighPerformanceClient();
    const poolStatus = client.getConnectionPoolStatus();
    expect(poolStatus).toHaveProperty('http');
    expect(poolStatus).toHaveProperty('https');
    expect(poolStatus.http).toHaveProperty('sockets');
    expect(poolStatus.http).toHaveProperty('freeSockets');
    expect(poolStatus.http).toHaveProperty('requests');
  });

  it('should clear cache', () => {
    client = new HighPerformanceClient();
    client.clearCache();
    const stats = client.getStats();
    expect(stats.cacheSize).toBe(0);
  });
});

describe('HttpUtils', () => {
  describe('URL validation', () => {
    it('should validate URLs correctly', () => {
      expect(HttpUtils.isValidUrl('https://example.com')).toBe(true);
      expect(HttpUtils.isValidUrl('http://example.com')).toBe(true);
      expect(HttpUtils.isValidUrl('invalid-url')).toBe(false);
      expect(HttpUtils.isValidUrl('')).toBe(false);
    });

    it('should normalize URLs', () => {
      expect(HttpUtils.normalizeUrl('/path', 'https://example.com')).toBe('https://example.com/path');
      expect(HttpUtils.normalizeUrl('https://example.com/path')).toBe('https://example.com/path');
    });

    it('should extract domain from URL', () => {
      expect(HttpUtils.getDomain('https://example.com/path')).toBe('example.com');
      expect(HttpUtils.getDomain('http://subdomain.example.com')).toBe('subdomain.example.com');
    });

    it('should check same domain', () => {
      expect(HttpUtils.isSameDomain('https://example.com/path1', 'https://example.com/path2')).toBe(true);
      expect(HttpUtils.isSameDomain('https://example.com', 'https://other.com')).toBe(false);
    });
  });

  describe('Query string handling', () => {
    it('should build query string from object', () => {
      const params = { foo: 'bar', baz: 123, empty: null };
      const queryString = HttpUtils.buildQueryString(params);
      expect(queryString).toBe('foo=bar&baz=123');
    });

    it('should parse query string to object', () => {
      const queryString = 'foo=bar&baz=123';
      const params = HttpUtils.parseQueryString(queryString);
      expect(params).toEqual({ foo: 'bar', baz: '123' });
    });
  });

  describe('Response checking', () => {
    it('should check response status types', () => {
      const successResponse = { statusCode: 200 } as any;
      const redirectResponse = { statusCode: 301 } as any;
      const clientErrorResponse = { statusCode: 404 } as any;
      const serverErrorResponse = { statusCode: 500 } as any;

      expect(HttpUtils.isSuccessResponse(successResponse)).toBe(true);
      expect(HttpUtils.isRedirectResponse(redirectResponse)).toBe(true);
      expect(HttpUtils.isClientErrorResponse(clientErrorResponse)).toBe(true);
      expect(HttpUtils.isServerErrorResponse(serverErrorResponse)).toBe(true);
    });

    it('should check content types', () => {
      const htmlResponse = { headers: { 'content-type': 'text/html' } } as any;
      const jsonResponse = { headers: { 'content-type': 'application/json' } } as any;

      expect(HttpUtils.isHtmlResponse(htmlResponse)).toBe(true);
      expect(HttpUtils.isJsonResponse(jsonResponse)).toBe(true);
      expect(HttpUtils.isHtmlResponse(jsonResponse)).toBe(false);
      expect(HttpUtils.isJsonResponse(htmlResponse)).toBe(false);
    });

    it('should parse JSON response', () => {
      const jsonResponse = {
        headers: { 'content-type': 'application/json' },
        body: Buffer.from('{"foo": "bar"}'),
      } as any;

      const parsed = HttpUtils.parseJsonResponse(jsonResponse);
      expect(parsed).toEqual({ foo: 'bar' });
    });

    it('should throw error for invalid JSON', () => {
      const invalidJsonResponse = {
        headers: { 'content-type': 'application/json' },
        body: Buffer.from('invalid json'),
      } as any;

      expect(() => HttpUtils.parseJsonResponse(invalidJsonResponse)).toThrow();
    });
  });
});
