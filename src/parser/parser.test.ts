/**
 * Parser tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as cheerio from 'cheerio';

import { Parser } from './parser';
import { extendCheerio } from './cheerio-extensions';

describe('Parser', () => {
  let $: cheerio.CheerioAPI;

  beforeEach(() => {
    const html = `
      <html>
        <body>
          <div class="container">
            <h1 class="title">Test Title</h1>
            <div class="content">
              <p class="text">First paragraph</p>
              <p class="text">Second paragraph</p>
              <a href="/link1" class="link">Link 1</a>
              <a href="/link2" class="link">Link 2</a>
            </div>
            <div class="product" data-price="100">
              <span class="name">Product 1</span>
              <span class="price">$100.00</span>
            </div>
            <div class="product" data-price="200">
              <span class="name">Product 2</span>
              <span class="price">$200.00</span>
            </div>
          </div>
        </body>
      </html>
    `;
    $ = cheerio.load(html);
    extendCheerio($);
  });

  describe('Basic parsing', () => {
    it('should parse simple text selector', () => {
      const result = Parser.parse('.title', $);
      expect(result).toBe('Test Title');
    });

    it('should parse attribute selector', () => {
      const result = Parser.parse('.link@href', $);
      expect(result).toBe('/link1');
    });

    it('should parse array selector', () => {
      const result = Parser.parse('[.text]', $);
      expect(result).toEqual(['First paragraph', 'Second paragraph']);
    });

    it('should parse array attribute selector', () => {
      const result = Parser.parse('[.link@href]', $);
      expect(result).toEqual(['/link1', '/link2']);
    });
  });

  describe('Filter parsing', () => {
    it('should apply single filter', () => {
      const result = Parser.parse('.price | trim', $);
      expect(result).toBe('$100.00');
    });

    it('should apply multiple filters', () => {
      const result = Parser.parse('.price | trim | slice:1', $);
      expect(result).toBe('100.00');
    });

    it('should apply filters to arrays', () => {
      const result = Parser.parse('[.price] | slice:0,1', $);
      expect(result).toEqual(['$100.00']);
    });
  });

  describe('Object parsing', () => {
    it('should parse object structure', () => {
      const result = Parser.parse({
        title: '.title',
        links: '[.link@href]',
      }, $);

      expect(result).toEqual({
        title: 'Test Title',
        links: ['/link1', '/link2'],
      });
    });

    it('should parse nested object structure', () => {
      const result = Parser.parse({
        header: {
          title: '.title',
          content: '.content .text',
        },
        links: '[.link@href]',
      }, $);

      expect(result).toEqual({
        header: {
          title: 'Test Title',
          content: 'First paragraph',
        },
        links: ['/link1', '/link2'],
      });
    });
  });

  describe('Scope division', () => {
    it('should parse with scope division', () => {
      const result = Parser.parse([
        '[.product]',
        {
          name: '.name',
          price: '.price',
          dataPrice: '@data-price',
        },
      ], $);

      expect(result).toEqual([
        {
          name: 'Product 1',
          price: '$100.00',
          dataPrice: '100',
        },
        {
          name: 'Product 2',
          price: '$200.00',
          dataPrice: '200',
        },
      ]);
    });

    it('should parse with single scope', () => {
      const result = Parser.parse([
        '.product',
        {
          name: '.name',
          price: '.price',
        },
      ], $);

      expect(result).toEqual({
        name: 'Product 1',
        price: '$100.00',
      });
    });
  });

  describe('Function filters', () => {
    it('should apply function filters', () => {
      const result = Parser.parse([
        '.price',
        (text: string) => text.replace('$', ''),
        (text: string) => parseFloat(text),
      ], $);

      expect(result).toBe(100);
    });

    it('should combine query filters and function filters', () => {
      const result = Parser.parse([
        '.price | slice:1',
        (text: string) => parseFloat(text),
      ], $);

      expect(result).toBe(100);
    });
  });

  describe('Custom filters', () => {
    it('should use custom filters', () => {
      const customFilters = {
        currency: (value: string) => value.replace('$', ''),
      };

      const result = Parser.parse('.price | currency', $, customFilters);
      expect(result).toBe('100.00');
    });

    it('should use parser instance with custom filters', () => {
      const parser = new Parser({
        currency: (value: string) => value.replace('$', ''),
      });

      const result = parser.parse('.price | currency', $);
      expect(result).toBe('100.00');
    });
  });

  describe('Error handling', () => {
    it('should throw error for unknown filter', () => {
      expect(() => {
        Parser.parse('.price | unknownFilter', $);
      }).toThrow("Filter 'unknownFilter' not found");
    });

    it('should handle empty selectors gracefully', () => {
      const result = Parser.parse('.nonexistent', $);
      expect(result).toBeUndefined();
    });
  });

  describe('Validation', () => {
    it('should validate simple string rules', () => {
      const parser = new Parser();
      expect(parser.validate('.title')).toBe(true);
      expect(parser.validate('.title@href')).toBe(true);
      expect(parser.validate('[.title]')).toBe(true);
    });

    it('should validate object rules', () => {
      const parser = new Parser();
      expect(parser.validate({
        title: '.title',
        links: '[.link@href]',
      })).toBe(true);
    });

    it('should validate array rules', () => {
      const parser = new Parser();
      expect(parser.validate(['.title', (x: any) => x])).toBe(true);
      expect(parser.validate(['[.product]', { name: '.name' }])).toBe(true);
    });

    it('should reject invalid rules', () => {
      const parser = new Parser();
      expect(parser.validate(null as any)).toBe(false);
      expect(parser.validate(123 as any)).toBe(false);
      expect(parser.validate([])).toBe(false);
    });
  });
});
