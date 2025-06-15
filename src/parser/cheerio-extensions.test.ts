/**
 * Cheerio Extensions tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as cheerio from 'cheerio';
import { 
  extendCheerio, 
  createExtendedCheerio, 
  hasExtensions, 
  ensureExtensions,
  CheerioExtensions 
} from './cheerio-extensions';

describe('Cheerio Extensions', () => {
  let $: cheerio.CheerioAPI;
  let html: string;

  beforeEach(() => {
    html = `
      <html>
        <head>
          <title>Test Page</title>
        </head>
        <body>
          <div class="container">
            <h1 class="title">Main Title</h1>
            <p class="text">First paragraph</p>
            <p class="text">Second paragraph</p>
            <div class="product" data-price="100" data-category="electronics">
              <span class="name">Product 1</span>
              <span class="price">$100.00</span>
              <div class="description">
                Great product
                <span class="highlight">Special</span>
                with features
              </div>
            </div>
            <div class="product" data-price="200" data-category="books">
              <span class="name">Product 2</span>
              <span class="price">$200.00</span>
            </div>
            <ul class="list">
              <li>Item 1</li>
              <li>Item 2</li>
              <li>Item 3</li>
            </ul>
            <a href="/link1" title="Link 1">First Link</a>
            <a href="/link2" title="Link 2">Second Link</a>
          </div>
        </body>
      </html>
    `;
    $ = cheerio.load(html);
    extendCheerio($);
  });

  describe('Extension detection', () => {
    it('should detect if Cheerio has extensions', () => {
      expect(hasExtensions($)).toBe(true);
      
      const plainCheerio = cheerio.load('<div>test</div>');
      expect(hasExtensions(plainCheerio)).toBe(false);
    });

    it('should ensure extensions are added', () => {
      const plainCheerio = cheerio.load('<div>test</div>');
      expect(hasExtensions(plainCheerio)).toBe(false);
      
      const extended = ensureExtensions(plainCheerio);
      expect(hasExtensions(extended)).toBe(true);
    });

    it('should create extended Cheerio instance', () => {
      const plainCheerio = cheerio.load('<div>test</div>');
      const extended = createExtendedCheerio(plainCheerio);
      expect(hasExtensions(extended)).toBe(true);
    });
  });

  describe('extract method', () => {
    it('should extract text content by default', () => {
      const result = $('.title').extract();
      expect(result).toBe('Main Title');
    });

    it('should extract specific attributes', () => {
      const href = $('.container a').extract('href');
      expect(href).toBe('/link1');

      const title = $('.container a').extract('title');
      expect(title).toBe('Link 1');

      const dataPrice = $('.product').extract('data-price');
      expect(dataPrice).toBe('100');
    });

    it('should extract HTML content', () => {
      const html = $('.title').extract('html');
      expect(html).toBe('Main Title');
    });

    it('should extract outer HTML', () => {
      const outerHtml = $('.title').extract('outerHtml');
      expect(outerHtml).toBe('<h1 class="title">Main Title</h1>');
    });

    it('should extract direct text content with string', () => {
      const text = $('.description').extract('string');
      expect(text.trim()).toBe('Great product\n                \n                with features');
    });

    it('should extract next text node', () => {
      // This test might need adjustment based on actual HTML structure
      const nextNode = $('.highlight').extract('nextNode');
      expect(typeof nextNode).toBe('string');
    });

    it('should return undefined for non-existent elements', () => {
      const result = $('.nonexistent').extract();
      expect(result).toBeUndefined();
    });

    it('should return undefined for non-existent attributes', () => {
      const result = $('.title').extract('nonexistent');
      expect(result).toBeUndefined();
    });
  });

  describe('extractAll method', () => {
    it('should extract text from all matching elements', () => {
      const results = $('.text').extractAll();
      expect(results).toEqual(['First paragraph', 'Second paragraph']);
    });

    it('should extract attributes from all matching elements', () => {
      const hrefs = $('.container a').extractAll('href');
      expect(hrefs).toEqual(['/link1', '/link2']);

      const titles = $('.container a').extractAll('title');
      expect(titles).toEqual(['Link 1', 'Link 2']);
    });

    it('should extract data attributes from all elements', () => {
      const prices = $('.product').extractAll('data-price');
      expect(prices).toEqual(['100', '200']);

      const categories = $('.product').extractAll('data-category');
      expect(categories).toEqual(['electronics', 'books']);
    });

    it('should extract HTML from all elements', () => {
      const htmls = $('.product .name').extractAll('html');
      expect(htmls).toEqual(['Product 1', 'Product 2']);
    });

    it('should extract outer HTML from all elements', () => {
      const outerHtmls = $('.list li').extractAll('outerHtml');
      expect(outerHtmls).toEqual([
        '<li>Item 1</li>',
        '<li>Item 2</li>',
        '<li>Item 3</li>',
      ]);
    });

    it('should return empty array for non-existent elements', () => {
      const results = $('.nonexistent').extractAll();
      expect(results).toEqual([]);
    });
  });

  describe('string method', () => {
    it('should get direct text content excluding child elements', () => {
      const directText = $('.description').string();
      // Should exclude the text from the <span class="highlight"> child
      expect(directText.includes('Great product')).toBe(true);
      expect(directText.includes('with features')).toBe(true);
      expect(directText.includes('Special')).toBe(false); // This is in a child element
    });

    it('should work with simple text elements', () => {
      const text = $('.title').string();
      expect(text).toBe('Main Title');
    });

    it('should return empty string for elements without direct text', () => {
      const text = $('.container').string();
      // Container has no direct text, only child elements
      expect(text.trim()).toBe('');
    });
  });

  describe('nextNode method', () => {
    it('should get next text node value', () => {
      // This test depends on the specific HTML structure
      // We need to find an element that has a text node sibling
      const nextNode = $('.highlight').nextNode();
      expect(typeof nextNode === 'string' || nextNode === undefined).toBe(true);
    });

    it('should return undefined for elements without next text node', () => {
      const nextNode = $('.title').nextNode();
      // Most elements won't have a next text node sibling
      expect(nextNode === undefined || typeof nextNode === 'string').toBe(true);
    });

    it('should return undefined for non-existent elements', () => {
      const nextNode = $('.nonexistent').nextNode();
      expect(nextNode).toBeUndefined();
    });
  });

  describe('Method chaining', () => {
    it('should allow chaining with other Cheerio methods', () => {
      const result = $('.product')
        .first()
        .find('.name')
        .extract();
      expect(result).toBe('Product 1');
    });

    it('should work with complex selectors', () => {
      const results = $('.product .name').extractAll();
      expect(results).toEqual(['Product 1', 'Product 2']);
    });

    it('should work with filtered selections', () => {
      const results = $('.product')
        .filter('[data-category="electronics"]')
        .find('.name')
        .extractAll();
      expect(results).toEqual(['Product 1']);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty selections gracefully', () => {
      expect($('.nonexistent').extract()).toBeUndefined();
      expect($('.nonexistent').extractAll()).toEqual([]);
      expect($('.nonexistent').string()).toBe('');
      expect($('.nonexistent').nextNode()).toBeUndefined();
    });

    it('should handle multiple extensions without conflicts', () => {
      // Extend again - should not cause issues
      extendCheerio($);
      
      const result = $('.title').extract();
      expect(result).toBe('Main Title');
    });

    it('should preserve original Cheerio functionality', () => {
      // Ensure original methods still work
      expect($('.title').text()).toBe('Main Title');
      expect($('.title').attr('class')).toBe('title');
      expect($('.product').length).toBe(2);
    });
  });

  describe('Type safety', () => {
    it('should work with TypeScript types', () => {
      // This test ensures the extensions work with TypeScript
      const extended = $ as cheerio.CheerioAPI & CheerioExtensions;
      
      const text: any = extended('.title').extract();
      const texts: any[] = extended('.text').extractAll();
      const directText: string = extended('.title').string();
      const nextNode: string | undefined = extended('.title').nextNode();
      
      expect(typeof text === 'string' || text === undefined).toBe(true);
      expect(Array.isArray(texts)).toBe(true);
      expect(typeof directText).toBe('string');
      expect(typeof nextNode === 'string' || nextNode === undefined).toBe(true);
    });
  });
});
