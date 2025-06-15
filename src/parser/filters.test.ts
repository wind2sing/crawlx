/**
 * Filters tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Filters, builtinFilters } from './filters';

describe('Filters', () => {
  beforeEach(() => {
    Filters.reset(); // Reset to builtin filters before each test
  });

  describe('Builtin filters', () => {
    describe('Type conversion filters', () => {
      it('should convert to int', () => {
        expect(builtinFilters.int('123')).toBe(123);
        expect(builtinFilters.int('123.45')).toBe(123);
        expect(builtinFilters.int('abc123def')).toBe(123);
        expect(builtinFilters.int('no numbers', 0)).toBe(0);
      });

      it('should convert to float', () => {
        expect(builtinFilters.float('123.45')).toBe(123.45);
        expect(builtinFilters.float('123')).toBe(123);
        expect(builtinFilters.float('abc123.45def')).toBe(123.45);
        expect(builtinFilters.float('no numbers', 0)).toBe(0);
      });

      it('should convert to boolean', () => {
        expect(builtinFilters.bool('true')).toBe(true);
        expect(builtinFilters.bool('false')).toBe(true); // non-empty string is truthy
        expect(builtinFilters.bool('')).toBe(false);
        expect(builtinFilters.bool(0)).toBe(false);
        expect(builtinFilters.bool(1)).toBe(true);
      });

      it('should convert to date', () => {
        const date = builtinFilters.date('2023-12-25');
        expect(date).toBeInstanceOf(Date);
        expect(date.getFullYear()).toBe(2023);
        expect(date.getMonth()).toBe(11); // December is month 11
        expect(date.getDate()).toBe(25);
      });

      it('should parse complex date formats', () => {
        const date = builtinFilters.date('2023/12/25 15:30:45');
        expect(date).toBeInstanceOf(Date);
        expect(date.getFullYear()).toBe(2023);
      });
    });

    describe('String manipulation filters', () => {
      it('should trim whitespace', () => {
        expect(builtinFilters.trim('  hello  ')).toBe('hello');
        expect(builtinFilters.trim('hello')).toBe('hello');
        expect(builtinFilters.trim(123)).toBe(123); // non-string unchanged
      });

      it('should convert case', () => {
        expect(builtinFilters.upper('hello')).toBe('HELLO');
        expect(builtinFilters.lower('HELLO')).toBe('hello');
        expect(builtinFilters.upper(123)).toBe(123); // non-string unchanged
      });

      it('should slice strings and arrays', () => {
        expect(builtinFilters.slice('hello', 1, 3)).toBe('el');
        expect(builtinFilters.slice('hello', 1)).toBe('ello');
        expect(builtinFilters.slice([1, 2, 3, 4], 1, 3)).toEqual([2, 3]);
        expect(builtinFilters.slice(123, 1)).toBe(123); // non-sliceable unchanged
      });

      it('should reverse strings and arrays', () => {
        expect(builtinFilters.reverse('hello')).toBe('olleh');
        expect(builtinFilters.reverse([1, 2, 3])).toEqual([3, 2, 1]);
        expect(builtinFilters.reverse(123)).toBe(123); // non-reversible unchanged
      });

      it('should replace text', () => {
        expect(builtinFilters.replace('hello world', 'world', 'universe')).toBe('hello universe');
        expect(builtinFilters.replace('hello hello', 'hello', 'hi')).toBe('hi hi');
        expect(builtinFilters.replace(123, 'test', 'replace')).toBe(123); // non-string unchanged
      });

      it('should split strings', () => {
        expect(builtinFilters.split('a,b,c', ',')).toEqual(['a', 'b', 'c']);
        expect(builtinFilters.split('hello world', ' ')).toEqual(['hello', 'world']);
        expect(builtinFilters.split(123, ',')).toBe(123); // non-string unchanged
      });
    });

    describe('Array manipulation filters', () => {
      it('should join arrays', () => {
        expect(builtinFilters.join(['a', 'b', 'c'], ',')).toBe('a,b,c');
        expect(builtinFilters.join(['a', 'b', 'c'], ' | ')).toBe('a | b | c');
        expect(builtinFilters.join(['a', 'b', 'c'])).toBe('a,b,c'); // default separator
        expect(builtinFilters.join('hello', ',')).toBe('hello'); // non-array unchanged
      });

      it('should get first and last elements', () => {
        expect(builtinFilters.first([1, 2, 3])).toBe(1);
        expect(builtinFilters.first('hello')).toBe('h');
        expect(builtinFilters.first(123)).toBe(123); // non-indexable unchanged

        expect(builtinFilters.last([1, 2, 3])).toBe(3);
        expect(builtinFilters.last('hello')).toBe('o');
        expect(builtinFilters.last(123)).toBe(123); // non-indexable unchanged
      });

      it('should get length/count', () => {
        expect(builtinFilters.length([1, 2, 3])).toBe(3);
        expect(builtinFilters.length('hello')).toBe(5);
        expect(builtinFilters.length(123)).toBe(0); // non-countable returns 0

        expect(builtinFilters.count([1, 2, 3])).toBe(3);
        expect(builtinFilters.count('hello')).toBe(5);
      });

      it('should remove duplicates', () => {
        expect(builtinFilters.unique([1, 2, 2, 3, 1])).toEqual([1, 2, 3]);
        expect(builtinFilters.unique(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
        expect(builtinFilters.unique('hello')).toBe('hello'); // non-array unchanged
      });

      it('should sort arrays', () => {
        expect(builtinFilters.sort([3, 1, 2])).toEqual([1, 2, 3]);
        expect(builtinFilters.sort(['c', 'a', 'b'])).toEqual(['a', 'b', 'c']);
        expect(builtinFilters.sort('hello')).toBe('hello'); // non-array unchanged
      });

      it('should filter arrays', () => {
        expect(builtinFilters.filter([1, 0, 2, '', 3], 'truthy')).toEqual([1, 2, 3]);
        expect(builtinFilters.filter([1, 0, 2, '', 3], 'falsy')).toEqual([0, '']);
        expect(builtinFilters.filter('hello', 'truthy')).toBe('hello'); // non-array unchanged
      });
    });

    describe('Utility filters', () => {
      it('should provide default values', () => {
        expect(builtinFilters.default('', 'fallback')).toBe('fallback');
        expect(builtinFilters.default(null, 'fallback')).toBe('fallback');
        expect(builtinFilters.default(undefined, 'fallback')).toBe('fallback');
        expect(builtinFilters.default(0, 'fallback')).toBe('fallback');
        expect(builtinFilters.default('value', 'fallback')).toBe('value');
      });

      it('should extract numbers', () => {
        expect(builtinFilters.numbers('abc123def456')).toEqual([123, 456]);
        expect(builtinFilters.numbers('no numbers')).toEqual([]);
        expect(builtinFilters.numbers(123)).toEqual([]); // non-string returns empty
      });

      it('should extract URLs', () => {
        const text = 'Visit https://example.com and http://test.org for more info';
        expect(builtinFilters.urls(text)).toEqual(['https://example.com', 'http://test.org']);
        expect(builtinFilters.urls('no urls here')).toEqual([]);
        expect(builtinFilters.urls(123)).toEqual([]); // non-string returns empty
      });

      it('should parse file sizes', () => {
        expect(builtinFilters.size('1 KB')).toBe(1024);
        expect(builtinFilters.size('1.5 MB')).toBe(1572864);
        expect(builtinFilters.size('2 GB')).toBe(2147483648);
        expect(builtinFilters.size('500 bytes')).toBe(500);
        expect(builtinFilters.size('invalid')).toBe('invalid'); // invalid input unchanged
      });

      it('should extract text from Cheerio objects', () => {
        const mockCheerio = {
          text: () => 'extracted text',
        };
        expect(builtinFilters.text(mockCheerio)).toBe('extracted text');
        expect(builtinFilters.text('plain text')).toBe('plain text');
        expect(builtinFilters.text(123)).toBe('123');
      });
    });
  });

  describe('Filter registry', () => {
    it('should register and retrieve filters', () => {
      const customFilter = (value: string) => `custom: ${value}`;
      
      Filters.register('custom', customFilter);
      expect(Filters.has('custom')).toBe(true);
      expect(Filters.get('custom')).toBe(customFilter);
    });

    it('should register multiple filters', () => {
      const filters = {
        prefix: (value: string, prefix: string) => `${prefix}${value}`,
        suffix: (value: string, suffix: string) => `${value}${suffix}`,
      };

      Filters.registerMany(filters);
      expect(Filters.has('prefix')).toBe(true);
      expect(Filters.has('suffix')).toBe(true);
    });

    it('should remove filters', () => {
      Filters.register('temp', (x) => x);
      expect(Filters.has('temp')).toBe(true);
      
      expect(Filters.remove('temp')).toBe(true);
      expect(Filters.has('temp')).toBe(false);
      
      expect(Filters.remove('nonexistent')).toBe(false);
    });

    it('should get all filters', () => {
      const allFilters = Filters.getAll();
      expect(allFilters).toHaveProperty('trim');
      expect(allFilters).toHaveProperty('slice');
      expect(allFilters).toHaveProperty('upper');
      expect(typeof allFilters.trim).toBe('function');
    });

    it('should reset to builtin filters', () => {
      Filters.register('custom', (x) => x);
      expect(Filters.has('custom')).toBe(true);
      
      Filters.reset();
      expect(Filters.has('custom')).toBe(false);
      expect(Filters.has('trim')).toBe(true); // builtin still exists
    });
  });

  describe('Filter application', () => {
    it('should apply single filters', () => {
      expect(Filters.apply('trim', '  hello  ')).toBe('hello');
      expect(Filters.apply('upper', 'hello')).toBe('HELLO');
      expect(Filters.apply('slice', 'hello', 1, 3)).toBe('el');
    });

    it('should apply filter chains', () => {
      const result = Filters.applyChain('  HELLO WORLD  ', [
        { name: 'trim', args: [] },
        { name: 'lower', args: [] },
        { name: 'replace', args: ['world', 'universe'] },
        { name: 'upper', args: [] },
      ]);
      expect(result).toBe('HELLO UNIVERSE');
    });

    it('should throw for unknown filters', () => {
      expect(() => Filters.apply('unknown', 'test')).toThrow("Filter 'unknown' not found");
    });

    it('should handle filter errors', () => {
      Filters.register('errorFilter', () => {
        throw new Error('Filter error');
      });

      expect(() => Filters.apply('errorFilter', 'test')).toThrow("Error applying filter 'errorFilter': Error: Filter error");
    });
  });
});
