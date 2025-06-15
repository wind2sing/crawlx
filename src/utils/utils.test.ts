/**
 * Utilities tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Logger, ConsoleTransport, MemoryTransport } from './logger';
import { CrawlXError, NetworkError, ErrorUtils } from './errors';
import { UrlUtils, validateUrl } from './url-utils';
import { mergeConfig, deepClone, getNestedValue, setNestedValue } from './config-utils';

describe('Logger', () => {
  let logger: Logger;
  let memoryTransport: MemoryTransport;

  beforeEach(() => {
    memoryTransport = new MemoryTransport();
    logger = new Logger({
      level: 'debug',
      transports: [memoryTransport],
    });
  });

  afterEach(async () => {
    await logger.close();
  });

  describe('Basic logging', () => {
    it('should log messages at different levels', () => {
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      const entries = memoryTransport.getEntries();
      expect(entries).toHaveLength(4);
      expect(entries[0].level).toBe('debug');
      expect(entries[1].level).toBe('info');
      expect(entries[2].level).toBe('warn');
      expect(entries[3].level).toBe('error');
    });

    it('should respect log level filtering', () => {
      logger.setLevel('warn');
      
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      const entries = memoryTransport.getEntries();
      expect(entries).toHaveLength(2);
      expect(entries[0].level).toBe('warn');
      expect(entries[1].level).toBe('error');
    });

    it('should include context in log entries', () => {
      logger.info('Test message', { userId: 123, action: 'test' });

      const entries = memoryTransport.getEntries();
      expect(entries[0].context).toEqual({ userId: 123, action: 'test' });
    });

    it('should include error objects', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', error);

      const entries = memoryTransport.getEntries();
      expect(entries[0].error).toBe(error);
    });
  });

  describe('Child loggers', () => {
    it('should create child logger with additional context', () => {
      const child = logger.child({ component: 'parser' });
      child.info('Child message');

      const entries = memoryTransport.getEntries();
      expect(entries[0].context).toEqual({ component: 'parser' });
    });

    it('should merge context from parent and child', () => {
      logger = new Logger({
        level: 'debug',
        transports: [memoryTransport],
        defaultContext: { app: 'crawlx' },
      });

      const child = logger.child({ component: 'parser' });
      child.info('Child message', { action: 'parse' });

      const entries = memoryTransport.getEntries();
      expect(entries[0].context).toEqual({
        app: 'crawlx',
        component: 'parser',
        action: 'parse',
      });
    });
  });

  describe('Factory methods', () => {
    it('should create console logger', () => {
      const consoleLogger = Logger.createConsole('info');
      expect(consoleLogger.getLevel()).toBe('info');
    });

    it('should create memory logger for testing', () => {
      const testLogger = Logger.create({
        level: 'debug',
        transports: [new MemoryTransport()],
      });
      expect(testLogger.getLevel()).toBe('debug');
    });
  });
});

describe('Error System', () => {
  describe('CrawlXError', () => {
    it('should create error with code and context', () => {
      const error = new CrawlXError('Test error', 'TEST_ERROR', { key: 'value' });
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.context).toEqual({ key: 'value' });
      expect(error.recoverable).toBe(false);
    });

    it('should serialize to JSON', () => {
      const error = new CrawlXError('Test error', 'TEST_ERROR', { key: 'value' });
      const json = error.toJSON();
      
      expect(json.name).toBe('CrawlXError');
      expect(json.message).toBe('Test error');
      expect(json.code).toBe('TEST_ERROR');
      expect(json.context).toEqual({ key: 'value' });
    });
  });

  describe('NetworkError', () => {
    it('should create network error with URL and status code', () => {
      const error = new NetworkError('Request failed', 'https://example.com', 404);
      
      expect(error.url).toBe('https://example.com');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.recoverable).toBe(true);
    });
  });

  describe('ErrorUtils', () => {
    it('should check if error is recoverable', () => {
      const recoverableError = new NetworkError('Timeout', 'https://example.com');
      const nonRecoverableError = new CrawlXError('Config error', 'CONFIG_ERROR');
      
      expect(ErrorUtils.isRecoverable(recoverableError)).toBe(true);
      expect(ErrorUtils.isRecoverable(nonRecoverableError)).toBe(false);
    });

    it('should extract error codes', () => {
      const crawlxError = new CrawlXError('Test', 'TEST_ERROR');
      const genericError = new Error('Generic error');
      
      expect(ErrorUtils.getErrorCode(crawlxError)).toBe('TEST_ERROR');
      expect(ErrorUtils.getErrorCode(genericError)).toBe('UNKNOWN_ERROR');
    });

    it('should wrap unknown errors', () => {
      const wrapped = ErrorUtils.wrap('String error');
      
      expect(wrapped).toBeInstanceOf(CrawlXError);
      expect(wrapped.message).toBe('String error');
      expect(wrapped.code).toBe('UNKNOWN_ERROR');
    });
  });
});

describe('URL Utils', () => {
  describe('URL validation', () => {
    it('should validate URLs correctly', () => {
      expect(UrlUtils.isValidUrl('https://example.com')).toBe(true);
      expect(UrlUtils.isValidUrl('http://example.com')).toBe(true);
      expect(UrlUtils.isValidUrl('invalid-url')).toBe(false);
      expect(UrlUtils.isValidUrl('')).toBe(false);
    });

    it('should validate URL with detailed validation', () => {
      const valid = validateUrl('https://example.com');
      const invalid = validateUrl('invalid-url');
      
      expect(valid.valid).toBe(true);
      expect(invalid.valid).toBe(false);
      expect(invalid.error).toBeDefined();
    });
  });

  describe('URL normalization', () => {
    it('should normalize URLs consistently', () => {
      const url = 'HTTPS://Example.COM/Path/?b=2&a=1#fragment';
      const normalized = UrlUtils.normalize(url, {
        lowercase: true,
        sortQuery: true,
        removeFragment: true,
      });
      
      expect(normalized).toBe('https://example.com/path?a=1&b=2');
    });

    it('should remove trailing slashes', () => {
      const normalized = UrlUtils.normalize('https://example.com/path/', {
        removeTrailingSlash: true,
      });
      
      expect(normalized).toBe('https://example.com/path');
    });
  });

  describe('URL parsing', () => {
    it('should extract domain from URL', () => {
      expect(UrlUtils.getDomain('https://example.com/path')).toBe('example.com');
      expect(UrlUtils.getDomain('invalid-url')).toBe('');
    });

    it('should check same domain', () => {
      expect(UrlUtils.isSameDomain('https://example.com/a', 'https://example.com/b')).toBe(true);
      expect(UrlUtils.isSameDomain('https://example.com', 'https://other.com')).toBe(false);
    });

    it('should extract file extensions', () => {
      expect(UrlUtils.getExtension('https://example.com/file.pdf')).toBe('pdf');
      expect(UrlUtils.getExtension('https://example.com/path/')).toBe('');
    });
  });

  describe('URL resolution', () => {
    it('should resolve relative URLs', () => {
      const resolved = UrlUtils.resolve('/path', 'https://example.com');
      expect(resolved).toBe('https://example.com/path');
    });

    it('should handle absolute URLs', () => {
      const resolved = UrlUtils.resolve('https://other.com/path', 'https://example.com');
      expect(resolved).toBe('https://other.com/path');
    });
  });

  describe('URL classification', () => {
    it('should identify image URLs', () => {
      expect(UrlUtils.isImageUrl('https://example.com/image.jpg')).toBe(true);
      expect(UrlUtils.isImageUrl('https://example.com/page.html')).toBe(false);
    });

    it('should identify document URLs', () => {
      expect(UrlUtils.isDocumentUrl('https://example.com/doc.pdf')).toBe(true);
      expect(UrlUtils.isDocumentUrl('https://example.com/page.html')).toBe(false);
    });

    it('should identify feed URLs', () => {
      expect(UrlUtils.isFeedUrl('https://example.com/feed')).toBe(true);
      expect(UrlUtils.isFeedUrl('https://example.com/rss.xml')).toBe(true);
      expect(UrlUtils.isFeedUrl('https://example.com/page.html')).toBe(false);
    });
  });
});

describe('Config Utils', () => {
  describe('Deep merge', () => {
    it('should merge objects deeply', () => {
      const target = {
        a: 1,
        b: { c: 2, d: 3 },
        e: [1, 2],
      };

      const source = {
        b: { d: 4, f: 5 },
        g: 6,
      };

      const merged = mergeConfig(target, source);

      expect(merged).toEqual({
        a: 1,
        b: { c: 2, d: 4, f: 5 },
        e: [1, 2],
        g: 6,
      });
    });
  });

  describe('Deep clone', () => {
    it('should clone objects deeply', () => {
      const original = {
        a: 1,
        b: { c: 2 },
        d: [1, 2, { e: 3 }],
      };

      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.b).not.toBe(original.b);
      expect(cloned.d).not.toBe(original.d);
    });
  });

  describe('Nested property access', () => {
    const obj = {
      a: {
        b: {
          c: 'value',
        },
      },
    };

    it('should get nested values', () => {
      expect(getNestedValue(obj, 'a.b.c')).toBe('value');
      expect(getNestedValue(obj, 'a.b.x', 'default')).toBe('default');
    });

    it('should set nested values', () => {
      const target = {};
      setNestedValue(target, 'a.b.c', 'value');
      expect(target).toEqual({ a: { b: { c: 'value' } } });
    });
  });
});
