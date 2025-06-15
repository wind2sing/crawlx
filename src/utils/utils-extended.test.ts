/**
 * Extended tests for utility functions to improve coverage
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Logger } from './logger';
import { CrawlXError, NetworkError, ErrorUtils, ConfigurationError } from './errors';
import { UrlUtils } from './url-utils';
import { mergeConfig, deepClone, getNestedValue, setNestedValue } from './config-utils';
import { createLightweightCrawler, createScraper } from './factory';

describe('Utils Extended Coverage', () => {
  describe('Logger Extended', () => {
    let logger: Logger;

    beforeEach(() => {
      logger = new Logger({ level: 'debug' });
    });

    it('should handle different log levels', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      expect(consoleSpy).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
      errorSpy.mockRestore();
    });

    it('should filter logs based on level', () => {
      const silentLogger = new Logger({ level: 'error' });
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      silentLogger.debug('Should not appear');
      silentLogger.info('Should not appear');
      silentLogger.warn('Should not appear');

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should include context in log entries', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      logger.info('Test message', { userId: 123, action: 'test' });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test message')
      );

      consoleSpy.mockRestore();
    });

    it('should create child loggers with inherited context', () => {
      const child = logger.child({ module: 'http' });
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      child.info('Child message');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Child message')
      );

      consoleSpy.mockRestore();
    });

    it('should handle error objects in logs', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const testError = new Error('Test error');

      logger.error('Error occurred', testError);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error occurred')
      );

      errorSpy.mockRestore();
    });

    it('should create memory logger for testing', () => {
      const { MemoryTransport } = require('./logger');
      const memoryTransport = new MemoryTransport();
      const memoryLogger = new Logger({
        level: 'debug',
        transports: [memoryTransport]
      });

      memoryLogger.info('Test message');
      memoryLogger.error('Error message');

      const logs = memoryTransport.getEntries();
      expect(logs).toHaveLength(2);
      expect(logs[0]).toMatchObject({
        level: 'info',
        message: 'Test message'
      });
      expect(logs[1]).toMatchObject({
        level: 'error',
        message: 'Error message'
      });
    });
  });

  describe('Error System Extended', () => {
    it('should create NetworkError with code and context', () => {
      const error = new NetworkError('Test error', 'https://example.com', 500, {
        retries: 3
      });

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.url).toBe('https://example.com');
      expect(error.statusCode).toBe(500);
      expect(error.context).toMatchObject({
        retries: 3
      });
    });

    it('should serialize NetworkError to JSON', () => {
      const error = new NetworkError('Test error', 'https://example.com', 500, { test: true });
      const json = error.toJSON();

      expect(json).toEqual({
        name: 'NetworkError',
        message: 'Test error',
        code: 'NETWORK_ERROR',
        context: expect.objectContaining({ test: true }),
        timestamp: expect.any(Number),
        recoverable: true,
        stack: expect.any(String)
      });
    });

    it('should create NetworkError with URL and status', () => {
      const error = new NetworkError('Request failed', 'https://example.com', 500);

      expect(error.message).toBe('Request failed');
      expect(error.url).toBe('https://example.com');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('NETWORK_ERROR');
    });

    it('should check if errors are recoverable', () => {
      const networkError = new Error('ECONNREFUSED');
      const timeoutError = new Error('ETIMEDOUT');
      const notFoundError = new Error('404 Not Found');
      const syntaxError = new SyntaxError('Invalid JSON');

      expect(ErrorUtils.isRecoverable(networkError)).toBe(true);
      expect(ErrorUtils.isRecoverable(timeoutError)).toBe(true);
      expect(ErrorUtils.isRecoverable(notFoundError)).toBe(false);
      expect(ErrorUtils.isRecoverable(syntaxError)).toBe(false);
    });

    it('should extract error codes', () => {
      const configError = new ConfigurationError('Test');
      const networkError = new NetworkError('Network fail', 'https://example.com', 500);
      const genericError = new Error('Generic error');

      expect(ErrorUtils.getErrorCode(configError)).toBe('CONFIGURATION_ERROR');
      expect(ErrorUtils.getErrorCode(networkError)).toBe('NETWORK_ERROR');
      expect(ErrorUtils.getErrorCode(genericError)).toBe('UNKNOWN_ERROR');
    });

    it('should wrap unknown errors', () => {
      const originalError = new Error('Original error');
      const wrappedError = ErrorUtils.wrap(originalError, { test: true });

      expect(wrappedError).toBeInstanceOf(CrawlXError);
      expect(wrappedError.code).toBe('WRAPPED_ERROR');
      expect(wrappedError.context).toMatchObject({ test: true });
      expect(wrappedError.message).toContain('Original error');
    });
  });

  describe('UrlUtils Extended', () => {
    it('should validate URLs with detailed validation', () => {
      const validUrl = 'https://example.com/path?query=value#fragment';
      const invalidUrl = 'not-a-url';
      const httpUrl = 'http://example.com';
      const ftpUrl = 'ftp://example.com';

      expect(UrlUtils.isValidUrl(validUrl)).toBe(true);
      expect(UrlUtils.isValidUrl(invalidUrl)).toBe(false);
      expect(UrlUtils.isValidUrl(httpUrl)).toBe(true);
      expect(UrlUtils.isValidUrl(ftpUrl)).toBe(false); // Only HTTP/HTTPS allowed
    });

    it('should normalize URLs consistently', () => {
      const urls = [
        'https://Example.com/Path/',
        'https://example.com/path',
        'https://example.com/path?',
        'https://example.com/path#'
      ];

      const normalized = urls.map(url => UrlUtils.normalize(url, {
        removeFragment: true,
        removeQuery: true,
        removeTrailingSlash: true,
        lowercase: true
      }));

      // All should normalize to the same URL
      expect(normalized.every(url => url === normalized[0])).toBe(true);
    });

    it('should extract domains correctly', () => {
      expect(UrlUtils.getDomain('https://example.com/path')).toBe('example.com');
      expect(UrlUtils.getDomain('https://sub.example.com')).toBe('sub.example.com');
      expect(UrlUtils.getDomain('https://example.com:8080')).toBe('example.com');
    });

    it('should check same domain correctly', () => {
      const baseUrl = 'https://example.com';
      
      expect(UrlUtils.isSameDomain(baseUrl, 'https://example.com/page')).toBe(true);
      expect(UrlUtils.isSameDomain(baseUrl, 'https://sub.example.com')).toBe(false);
      expect(UrlUtils.isSameDomain(baseUrl, 'https://other.com')).toBe(false);
    });

    it('should extract file extensions', () => {
      expect(UrlUtils.getExtension('https://example.com/file.pdf')).toBe('pdf');
      expect(UrlUtils.getExtension('https://example.com/image.jpg')).toBe('jpg');
      expect(UrlUtils.getExtension('https://example.com/page')).toBe('');
      expect(UrlUtils.getExtension('https://example.com/file.tar.gz')).toBe('gz');
    });

    it('should resolve relative URLs', () => {
      const baseUrl = 'https://example.com/path/page.html';

      expect(UrlUtils.resolve('/absolute', baseUrl)).toBe('https://example.com/absolute');
      expect(UrlUtils.resolve('relative', baseUrl)).toBe('https://example.com/path/relative');
      expect(UrlUtils.resolve('../parent', baseUrl)).toBe('https://example.com/parent');
      expect(UrlUtils.resolve('https://other.com', baseUrl)).toBe('https://other.com');
    });

    it('should classify URLs by type', () => {
      expect(UrlUtils.isImageUrl('https://example.com/image.jpg')).toBe(true);
      expect(UrlUtils.isImageUrl('https://example.com/image.png')).toBe(true);
      expect(UrlUtils.isImageUrl('https://example.com/page.html')).toBe(false);

      expect(UrlUtils.isDocumentUrl('https://example.com/doc.pdf')).toBe(true);
      expect(UrlUtils.isDocumentUrl('https://example.com/sheet.xlsx')).toBe(true);
      expect(UrlUtils.isDocumentUrl('https://example.com/image.jpg')).toBe(false);

      expect(UrlUtils.isFeedUrl('https://example.com/feed.xml')).toBe(true);
      expect(UrlUtils.isFeedUrl('https://example.com/rss.xml')).toBe(true);
      expect(UrlUtils.isFeedUrl('https://example.com/page.html')).toBe(false);
    });
  });

  describe('ConfigUtils Extended', () => {
    it('should merge objects deeply', () => {
      const obj1 = {
        a: 1,
        b: { c: 2, d: 3 },
        e: [1, 2]
      };

      const obj2 = {
        b: { d: 4, f: 5 },
        e: [3, 4],
        g: 6
      };

      const merged = mergeConfig(obj1, obj2);

      expect(merged).toEqual({
        a: 1,
        b: { c: 2, d: 4, f: 5 },
        e: [3, 4],
        g: 6
      });
    });

    it('should clone objects deeply', () => {
      const original = {
        a: 1,
        b: { c: 2, d: [3, 4] },
        e: new Date('2023-01-01')
      };

      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.b).not.toBe(original.b);
      expect(cloned.b.d).not.toBe(original.b.d);
    });

    it('should get nested values', () => {
      const obj = {
        a: {
          b: {
            c: 'value'
          }
        }
      };

      expect(getNestedValue(obj, 'a.b.c')).toBe('value');
      expect(getNestedValue(obj, 'a.b.d', 'default')).toBe('default');
      expect(getNestedValue(obj, 'x.y.z')).toBeUndefined();
    });

    it('should set nested values', () => {
      const obj = {};

      setNestedValue(obj, 'a.b.c', 'value');
      expect(obj).toEqual({
        a: {
          b: {
            c: 'value'
          }
        }
      });
    });
  });

  describe('Factory Functions Extended', () => {
    it('should create lightweight crawler with default options', () => {
      const crawler = createLightweightCrawler();
      
      expect(crawler).toBeDefined();
      expect(crawler.getConfig().get('mode')).toBe('lightweight');
      expect(crawler.getConfig().get('concurrency')).toBe(2);
      
      crawler.destroy();
    });

    it('should create lightweight crawler with custom options', () => {
      const crawler = createLightweightCrawler({
        concurrency: 5,
        timeout: 10000
      });
      
      expect(crawler.getConfig().get('concurrency')).toBe(5);
      expect(crawler.getConfig().get('timeout')).toBe(10000);
      
      crawler.destroy();
    });

    it('should create scraper with appropriate configuration', () => {
      const scraper = createScraper();
      
      expect(scraper).toBeDefined();
      expect(scraper.getConfig().get('concurrency')).toBe(3);
      
      // Should have parsing and following plugins
      const stats = scraper.getStats();
      expect(stats.plugins.total).toBeGreaterThan(3);
      
      scraper.destroy();
    });

    it('should create scraper with custom options', () => {
      const scraper = createScraper({
        concurrency: 10,
        maxRetries: 5
      });
      
      expect(scraper.getConfig().get('concurrency')).toBe(10);
      expect(scraper.getConfig().get('maxRetries')).toBe(5);
      
      scraper.destroy();
    });
  });
});
