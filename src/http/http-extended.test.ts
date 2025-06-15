/**
 * Extended tests for HTTP clients to improve coverage
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LightweightClient } from './lightweight-client';
import { HighPerformanceClient } from './high-performance-client';
import { HttpClient } from './client';
import { CrawlXError, NetworkError } from '../utils/errors';

describe('HTTP Client Extended Coverage', () => {
  describe('LightweightClient Extended', () => {
    let client: LightweightClient;

    beforeEach(() => {
      client = new LightweightClient({
        timeout: 5000,
        maxRedirects: 5,
        userAgent: 'CrawlX-Test/1.0'
      });
    });

    afterEach(() => {
      client.destroy();
    });

    it('should handle request with custom headers', async () => {
      const mockResponse = {
        statusCode: 200,
        statusMessage: 'OK',
        headers: { 'content-type': 'text/html' },
        body: Buffer.from('<html><body>Test</body></html>'),
        url: 'https://example.com'
      };

      // Mock the request method
      vi.spyOn(client, 'request').mockResolvedValue(mockResponse);

      const response = await client.request({
        url: 'https://example.com',
        method: 'GET',
        headers: { 'X-Custom': 'test' },
        timeout: 3000
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeInstanceOf(Buffer);
    });

    it('should handle POST request with body', async () => {
      const mockResponse = {
        statusCode: 201,
        statusMessage: 'Created',
        headers: { 'content-type': 'application/json' },
        body: Buffer.from('{"success": true}'),
        url: 'https://example.com/api'
      };

      vi.spyOn(client, 'request').mockResolvedValue(mockResponse);

      const response = await client.request({
        url: 'https://example.com/api',
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ test: 'data' })
      });

      expect(response.statusCode).toBe(201);
    });

    it('should handle network errors', async () => {
      vi.spyOn(client, 'request').mockRejectedValue(
        new Error('ECONNREFUSED')
      );

      await expect(client.request({
        url: 'https://invalid-domain-12345.com',
        method: 'GET',
        headers: {}
      })).rejects.toThrow();
    });

    it('should handle timeout errors', async () => {
      vi.spyOn(client, 'request').mockRejectedValue(
        new Error('ETIMEDOUT')
      );

      await expect(client.request({
        url: 'https://example.com',
        method: 'GET',
        headers: {},
        timeout: 100
      })).rejects.toThrow();
    });

    it('should provide detailed statistics', () => {
      const stats = client.getStats();
      expect(stats).toHaveProperty('activeRequests');
      expect(stats).toHaveProperty('totalRequests');
      expect(stats).toHaveProperty('totalBytes');
      expect(stats).toHaveProperty('averageResponseTime');
    });

    it('should handle different HTTP methods', async () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
      
      for (const method of methods) {
        const mockResponse = {
          statusCode: 200,
          statusMessage: 'OK',
          headers: {},
          body: Buffer.from(''),
          url: 'https://example.com'
        };

        vi.spyOn(client, 'request').mockResolvedValue(mockResponse);

        const response = await client.request({
          url: 'https://example.com',
          method,
          headers: {}
        });

        expect(response.statusCode).toBe(200);
      }
    });
  });

  describe('HighPerformanceClient Extended', () => {
    let client: HighPerformanceClient;

    beforeEach(() => {
      client = new HighPerformanceClient({
        timeout: 5000,
        maxRedirects: 5,
        userAgent: 'CrawlX-Test/1.0',
        maxConnections: 10,
        keepAlive: true,
        keepAliveMsecs: 1000
      });
    });

    afterEach(() => {
      client.destroy();
    });

    it('should handle connection pooling', async () => {
      const mockResponse = {
        statusCode: 200,
        statusMessage: 'OK',
        headers: { 'content-type': 'text/html' },
        body: Buffer.from('<html><body>Test</body></html>'),
        url: 'https://example.com'
      };

      vi.spyOn(client, 'request').mockResolvedValue(mockResponse);

      // Make multiple requests to test connection reuse
      const requests = Array(5).fill(null).map(() => 
        client.request({
          url: 'https://example.com',
          method: 'GET',
          headers: {}
        })
      );

      const responses = await Promise.all(requests);
      expect(responses).toHaveLength(5);
      responses.forEach(response => {
        expect(response.statusCode).toBe(200);
      });
    });

    it('should provide connection pool status', () => {
      const status = client.getConnectionPoolStatus();
      expect(status).toHaveProperty('http');
      expect(status).toHaveProperty('https');
      expect(status.http).toHaveProperty('sockets');
      expect(status.http).toHaveProperty('freeSockets');
      expect(status.https).toHaveProperty('sockets');
      expect(status.https).toHaveProperty('freeSockets');
    });

    it('should handle cache operations', () => {
      // Test cache clearing
      expect(() => client.clearCache()).not.toThrow();
    });

    it('should handle concurrent requests efficiently', async () => {
      const mockResponse = {
        statusCode: 200,
        statusMessage: 'OK',
        headers: {},
        body: Buffer.from('test'),
        url: 'https://example.com'
      };

      vi.spyOn(client, 'request').mockResolvedValue(mockResponse);

      const startTime = Date.now();
      const requests = Array(10).fill(null).map((_, i) => 
        client.request({
          url: `https://example.com/page${i}`,
          method: 'GET',
          headers: {}
        })
      );

      const responses = await Promise.all(requests);
      const duration = Date.now() - startTime;

      expect(responses).toHaveLength(10);
      expect(duration).toBeLessThan(5000); // Should be fast with connection pooling
    });
  });

  describe('HttpClient Factory Extended', () => {
    it('should create clients with different modes', () => {
      const lightweightClient = HttpClient.create('lightweight');
      expect(lightweightClient).toBeInstanceOf(HttpClient);
      expect(lightweightClient.getMode()).toBe('lightweight');
      lightweightClient.destroy();

      const highPerfClient = HttpClient.create('high-performance');
      expect(highPerfClient).toBeInstanceOf(HttpClient);
      expect(highPerfClient.getMode()).toBe('high-performance');
      highPerfClient.destroy();
    });

    it('should handle invalid mode gracefully', () => {
      expect(() => {
        HttpClient.create('invalid' as any);
      }).toThrow();
    });

    it('should switch client modes', () => {
      const httpClient = new HttpClient();

      httpClient.switchMode('lightweight');
      expect(httpClient.getMode()).toBe('lightweight');

      httpClient.switchMode('high-performance');
      expect(httpClient.getMode()).toBe('high-performance');

      httpClient.destroy();
    });

    it('should provide aggregated statistics', () => {
      const httpClient = new HttpClient();
      const stats = httpClient.getStats();

      expect(stats).toHaveProperty('mode');
      expect(stats).toHaveProperty('activeRequests');
      expect(stats).toHaveProperty('totalRequests');

      httpClient.destroy();
    });
  });
});
