/**
 * Cheerio extensions for enhanced DOM manipulation
 */

import { CheerioAPI, Cheerio, Element } from 'cheerio';

/**
 * Extract attribute or content from element
 */
function extractAttribute(element: Element, attribute: string | undefined, $: CheerioAPI): any {
  const attr = attribute || 'text';
  const $el = $(element);

  switch (attr) {
    case 'html':
      return $el.html();
    case 'outerHtml':
      return $.html(element);
    case 'text':
      return $el.text();
    case 'string':
      return $el.contents()
        .filter((_, el) => el.type === 'text')
        .text();
    case 'nextNode':
      const nextSibling = element.nextSibling;
      return nextSibling && nextSibling.type === 'text' 
        ? (nextSibling as any).data 
        : undefined;
    default:
      return $el.attr(attr);
  }
}

/**
 * Cheerio extension methods
 */
export interface CheerioExtensions {
  /**
   * Extract content from first element
   */
  extract(attribute?: string): any;

  /**
   * Extract content from all elements
   */
  extractAll(attribute?: string): any[];

  /**
   * Get direct text content (excluding child elements)
   */
  string(): string;

  /**
   * Get next text node value
   */
  nextNode(): string | undefined;
}

/**
 * Add extension methods to Cheerio prototype
 */
export function extendCheerio($: CheerioAPI): void {
  const proto = ($ as any).prototype || {};
  if (!($ as any).prototype) {
    ($ as any).prototype = proto;
  }

  // Extract content from first element
  proto.extract = function(attribute?: string): any {
    const element = this.get(0);
    if (element) {
      return extractAttribute(element, attribute, $);
    }
    return undefined;
  };

  // Extract content from all elements
  proto.extractAll = function(attribute?: string): any[] {
    return this.map((_, element) => {
      return extractAttribute(element, attribute, $);
    }).get();
  };

  // Get direct text content
  proto.string = function(): string {
    return this.contents()
      .filter((_, el) => el.type === 'text')
      .text();
  };

  // Get next text node value
  proto.nextNode = function(): string | undefined {
    const element = this.get(0);
    if (element) {
      const nextSibling = element.nextSibling;
      return nextSibling && nextSibling.type === 'text' 
        ? (nextSibling as any).data 
        : undefined;
    }
    return undefined;
  };
}

/**
 * Create extended Cheerio instance
 */
export function createExtendedCheerio(cheerio: any): CheerioAPI {
  const $ = cheerio as CheerioAPI;
  extendCheerio($);
  return $;
}

/**
 * Type guard to check if Cheerio has extensions
 */
export function hasExtensions($: any): $ is CheerioAPI & CheerioExtensions {
  return typeof $.prototype?.extract === 'function';
}

/**
 * Ensure Cheerio has extensions
 */
export function ensureExtensions($: CheerioAPI): CheerioAPI & CheerioExtensions {
  if (!hasExtensions($)) {
    extendCheerio($);
  }
  return $ as CheerioAPI & CheerioExtensions;
}
