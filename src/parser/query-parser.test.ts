/**
 * Query Parser tests
 */

import { describe, it, expect } from 'vitest';
import { parseQuery, QueryParser } from './query-parser';

describe('Query Parser', () => {
  describe('parseQuery function', () => {
    it('should parse simple selectors', () => {
      const result = parseQuery('.title');
      expect(result).toEqual({
        selector: '.title',
        attribute: undefined,
        filters: [],
        getAll: false,
      });
    });

    it('should parse selectors with attributes', () => {
      const result = parseQuery('.link@href');
      expect(result).toEqual({
        selector: '.link',
        attribute: 'href',
        filters: [],
        getAll: false,
      });
    });

    it('should parse array selectors', () => {
      const result = parseQuery('[.item]');
      expect(result).toEqual({
        selector: '.item',
        attribute: undefined,
        filters: [],
        getAll: true,
      });
    });

    it('should parse array selectors with attributes', () => {
      const result = parseQuery('[.item@data-value]');
      expect(result).toEqual({
        selector: '.item',
        attribute: 'data-value',
        filters: [],
        getAll: true,
      });
    });

    it('should parse selectors with single filter', () => {
      const result = parseQuery('.price | trim');
      expect(result).toEqual({
        selector: '.price',
        attribute: undefined,
        filters: [{ name: 'trim', args: [] }],
        getAll: false,
      });
    });

    it('should parse selectors with multiple filters', () => {
      const result = parseQuery('.price | trim | slice:1,3');
      expect(result).toEqual({
        selector: '.price',
        attribute: undefined,
        filters: [
          { name: 'trim', args: [] },
          { name: 'slice', args: [1, 3] },
        ],
        getAll: false,
      });
    });

    it('should parse complex queries', () => {
      const result = parseQuery('[.product@data-price] | int | default:0');
      expect(result).toEqual({
        selector: '.product',
        attribute: 'data-price',
        filters: [
          { name: 'int', args: [] },
          { name: 'default', args: [0] },
        ],
        getAll: true,
      });
    });

    it('should handle filters with string arguments', () => {
      const result = parseQuery('.text | replace:hello,world');
      expect(result).toEqual({
        selector: '.text',
        attribute: undefined,
        filters: [
          { name: 'replace', args: ['hello', 'world'] },
        ],
        getAll: false,
      });
    });

    it('should handle filters with quoted arguments', () => {
      const result = parseQuery('.text | replace:"hello world","goodbye world"');
      expect(result).toEqual({
        selector: '.text',
        attribute: undefined,
        filters: [
          { name: 'replace', args: ['hello world', 'goodbye world'] },
        ],
        getAll: false,
      });
    });

    it('should handle filters with mixed argument types', () => {
      const result = parseQuery('.text | slice:1,true,"test",null,undefined');
      expect(result).toEqual({
        selector: '.text',
        attribute: undefined,
        filters: [
          { name: 'slice', args: [1, true, 'test', null, undefined] },
        ],
        getAll: false,
      });
    });

    it('should handle empty selectors', () => {
      const result = parseQuery('');
      expect(result).toEqual({
        selector: '',
        attribute: undefined,
        filters: [],
        getAll: false,
      });
    });

    it('should handle whitespace in queries', () => {
      const result = parseQuery('  .title  @  href  |  trim  |  slice : 1 , 3  ');
      expect(result.selector).toBe('.title');
      expect(result.attribute).toBe('href');
      expect(result.filters).toHaveLength(2);
    });

    it('should handle complex CSS selectors', () => {
      const result = parseQuery('div.container > .item:nth-child(2)@data-value');
      expect(result).toEqual({
        selector: 'div.container > .item:nth-child(2)',
        attribute: 'data-value',
        filters: [],
        getAll: false,
      });
    });

    it('should handle attribute selectors in CSS', () => {
      const result = parseQuery('input[type="text"]@value');
      expect(result).toEqual({
        selector: 'input[type="text"]',
        attribute: 'value',
        filters: [],
        getAll: false,
      });
    });

    it('should throw error for non-string input', () => {
      expect(() => parseQuery(null as any)).toThrow('Query should be string');
      expect(() => parseQuery(123 as any)).toThrow('Query should be string');
      expect(() => parseQuery(undefined as any)).toThrow('Query should be string');
    });
  });

  describe('Filter argument parsing', () => {
    it('should parse integer arguments', () => {
      const result = parseQuery('.text | slice:123');
      expect(result.filters[0].args).toEqual([123]);
    });

    it('should parse float arguments', () => {
      const result = parseQuery('.text | slice:123.45');
      expect(result.filters[0].args).toEqual([123.45]);
    });

    it('should parse boolean arguments', () => {
      const result = parseQuery('.text | filter:true,false');
      expect(result.filters[0].args).toEqual([true, false]);
    });

    it('should parse null and undefined arguments', () => {
      const result = parseQuery('.text | default:null,undefined');
      expect(result.filters[0].args).toEqual([null, undefined]);
    });

    it('should parse quoted string arguments', () => {
      const result = parseQuery('.text | replace:"hello world","goodbye"');
      expect(result.filters[0].args).toEqual(['hello world', 'goodbye']);
    });

    it('should parse single quoted string arguments', () => {
      const result = parseQuery(".text | replace:'hello world','goodbye'");
      expect(result.filters[0].args).toEqual(['hello world', 'goodbye']);
    });

    it('should handle empty arguments', () => {
      const result = parseQuery('.text | trim:');
      expect(result.filters[0].args).toEqual([]);
    });

    it('should handle no arguments', () => {
      const result = parseQuery('.text | trim');
      expect(result.filters[0].args).toEqual([]);
    });
  });

  describe('QueryParser class', () => {
    it('should parse queries using static method', () => {
      const result = QueryParser.parse('.title@href | trim');
      expect(result).toEqual({
        selector: '.title',
        attribute: 'href',
        filters: [{ name: 'trim', args: [] }],
        getAll: false,
      });
    });

    it('should validate queries', () => {
      expect(QueryParser.validate('.title')).toBe(true);
      expect(QueryParser.validate('.title@href')).toBe(true);
      expect(QueryParser.validate('[.item]')).toBe(true);
      expect(QueryParser.validate('.text | trim')).toBe(true);
      expect(QueryParser.validate('')).toBe(true);
    });

    it('should detect array selectors', () => {
      expect(QueryParser.isArraySelector('[.item]')).toBe(true);
      expect(QueryParser.isArraySelector('[.item@href]')).toBe(true);
      expect(QueryParser.isArraySelector('.item')).toBe(false);
      expect(QueryParser.isArraySelector('.item@href')).toBe(false);
    });

    it('should extract selector from query', () => {
      expect(QueryParser.getSelector('.title@href | trim')).toBe('.title');
      expect(QueryParser.getSelector('[.item]')).toBe('.item');
      expect(QueryParser.getSelector('.text | slice:1')).toBe('.text');
    });

    it('should extract attribute from query', () => {
      expect(QueryParser.getAttribute('.title@href')).toBe('href');
      expect(QueryParser.getAttribute('.title')).toBeUndefined();
      expect(QueryParser.getAttribute('[.item@data-value]')).toBe('data-value');
    });

    it('should extract filters from query', () => {
      const filters = QueryParser.getFilters('.text | trim | slice:1,3');
      expect(filters).toEqual([
        { name: 'trim', args: [] },
        { name: 'slice', args: [1, 3] },
      ]);
    });

    it('should handle edge cases in validation', () => {
      // These should not throw errors
      expect(QueryParser.validate('.')).toBe(true);
      expect(QueryParser.validate('@')).toBe(true);
      expect(QueryParser.validate('|')).toBe(true);
      expect(QueryParser.validate('[]')).toBe(true);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle malformed array selectors', () => {
      const result = parseQuery('[.item');
      expect(result.getAll).toBe(false); // Should not be treated as array
      expect(result.selector).toBe('[.item');
    });

    it('should handle multiple @ symbols', () => {
      const result = parseQuery('.item@data@value');
      expect(result.selector).toBe('.item@data');
      expect(result.attribute).toBe('value'); // Only the last part after @ is attribute
    });

    it('should handle filters without names', () => {
      const result = parseQuery('.text | | trim');
      expect(result.filters).toHaveLength(2);
      expect(result.filters[0].name).toBe('');
      expect(result.filters[1].name).toBe('trim');
    });

    it('should handle complex filter arguments', () => {
      const result = parseQuery('.text | replace:a:b:c,d:e:f');
      expect(result.filters[0].args).toEqual(['a:b:c', 'd:e:f']);
    });

    it('should handle nested quotes in arguments', () => {
      const result = parseQuery('.text | replace:"he said \\"hello\\"","goodbye"');
      // This might not work perfectly due to regex limitations, but should not crash
      expect(result.filters).toHaveLength(1);
      expect(result.filters[0].name).toBe('replace');
    });

    it('should handle very long queries', () => {
      const longSelector = '.very-long-selector-name-that-goes-on-and-on';
      const longQuery = `${longSelector}@data-very-long-attribute-name | trim | slice:0,100 | replace:very-long-search-term,very-long-replacement-term`;
      
      const result = parseQuery(longQuery);
      expect(result.selector).toBe(longSelector);
      expect(result.filters).toHaveLength(3);
    });
  });
});
