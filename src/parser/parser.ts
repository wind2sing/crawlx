/**
 * Core Parser - Main parsing engine for extracting data from HTML
 */

import { CheerioAPI } from 'cheerio';

import { ParseRule, ParseContext, FilterFunction, QueryInfo } from '@/types';
import { parseQuery } from './query-parser';
import { Filters } from './filters';
import { ensureExtensions } from './cheerio-extensions';

/**
 * Parse a single query against a Cheerio context
 */
function parseOne(
  query: string | Function,
  $: CheerioAPI,
  filters: Record<string, FilterFunction>
): any {
  // Handle function queries
  if (typeof query === 'function') {
    return query();
  }

  const queryInfo = parseQuery(query);
  let values: any[];

  // Extract values using selector
  if (queryInfo.selector) {
    values = $(queryInfo.selector).extractAll(queryInfo.attribute);
  } else {
    values = $().addBack().extractAll(queryInfo.attribute);
  }

  // Apply filters
  if (queryInfo.getAll) {
    // Apply filters to each value in array
    for (const filterInfo of queryInfo.filters) {
      const filterFn = filters[filterInfo.name];
      if (!filterFn) {
        throw new Error(`Filter '${filterInfo.name}' not found`);
      }
      values = values.map(val => filterFn(val, ...filterInfo.args));
    }
    return values;
  } else {
    // Apply filters to single value
    let value = values[0];
    for (const filterInfo of queryInfo.filters) {
      const filterFn = filters[filterInfo.name];
      if (!filterFn) {
        throw new Error(`Filter '${filterInfo.name}' not found`);
      }
      try {
        value = filterFn(value, ...filterInfo.args);
      } catch (error) {
        throw new Error(`Parse error in query: ${query} - ${error}`);
      }
    }
    return value;
  }
}

/**
 * Check if rule array should be divided into scope and rules
 */
function shouldDivide(rules: any[]): boolean {
  return rules.length > 1 && typeof rules[1] !== 'function';
}

/**
 * Main parse function
 */
export function parse(
  rule: ParseRule,
  $: CheerioAPI,
  customFilters?: Record<string, FilterFunction>
): any {
  // Ensure Cheerio has extensions
  $ = ensureExtensions($);

  // Merge custom filters with built-in filters
  const filters = {
    ...Filters.getAll(),
    ...customFilters,
  };

  if (Array.isArray(rule)) {
    if (shouldDivide(rule)) {
      // Scope division: ['[.quote]', {...}, func, func...]
      const [divider, ...restRules] = rule;
      const queryInfo = parseQuery(divider);

      if (queryInfo.getAll) {
        // Process each element in scope
        const results: any[] = [];
        $(queryInfo.selector || '').each((i, element) => {
          const $element = $(element);
          const scopedFinder = $element.find.bind($element);
          results[i] = parse(restRules, scopedFinder as any, filters);
        });
        return results;
      } else {
        // Process single element in scope
        const $element = $(queryInfo.selector || '').eq(0);
        if ($element.length) {
          const scopedFinder = $element.find.bind($element);
          return parse(restRules, scopedFinder as any, filters);
        }
        return undefined;
      }
    }

    // Function chain: [rule, func, func...]
    const [query, ...filterFunctions] = rule;
    let value = parse(query, $, filters);
    
    // Apply function filters
    return filterFunctions.reduce((currentValue, filterFn) => {
      if (typeof filterFn === 'function') {
        return filterFn(currentValue);
      }
      return currentValue;
    }, value);
  } else if (typeof rule === 'object' && rule !== null) {
    // Object parsing: {a: '...', b: [...]}
    const result: Record<string, any> = {};
    for (const [key, subRule] of Object.entries(rule)) {
      result[key] = parse(subRule, $, filters);
    }
    return result;
  } else {
    // Simple string query: '...'
    return parseOne(rule, $, filters);
  }
}

/**
 * Parser class for advanced usage
 */
export class Parser {
  private customFilters: Record<string, FilterFunction> = {};

  constructor(customFilters?: Record<string, FilterFunction>) {
    if (customFilters) {
      this.customFilters = { ...customFilters };
    }
  }

  /**
   * Add custom filter
   */
  addFilter(name: string, filter: FilterFunction): this {
    this.customFilters[name] = filter;
    return this;
  }

  /**
   * Add multiple custom filters
   */
  addFilters(filters: Record<string, FilterFunction>): this {
    Object.assign(this.customFilters, filters);
    return this;
  }

  /**
   * Parse rule against Cheerio context
   */
  parse(rule: ParseRule, $: CheerioAPI): any {
    return parse(rule, $, this.customFilters);
  }

  /**
   * Parse rule with context
   */
  parseWithContext(rule: ParseRule, context: ParseContext): any {
    return this.parse(rule, context.$);
  }

  /**
   * Create a scoped parser for specific element
   */
  createScoped(selector: string, $: CheerioAPI): Parser {
    const $scoped = $(selector);
    const scopedParser = new Parser(this.customFilters);
    
    // Override parse method to use scoped context
    const originalParse = scopedParser.parse.bind(scopedParser);
    scopedParser.parse = (rule: ParseRule) => {
      return originalParse(rule, $scoped.find.bind($scoped) as any);
    };

    return scopedParser;
  }

  /**
   * Validate a parse rule
   */
  validate(rule: ParseRule): boolean {
    try {
      // Basic validation - check if rule structure is valid
      if (typeof rule === 'string') {
        parseQuery(rule);
        return true;
      } else if (Array.isArray(rule)) {
        if (rule.length === 0) return false;
        return this.validate(rule[0]);
      } else if (typeof rule === 'object' && rule !== null) {
        return Object.values(rule).every(subRule => this.validate(subRule));
      } else if (typeof rule === 'function') {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Get available filters
   */
  getFilters(): Record<string, FilterFunction> {
    return {
      ...Filters.getAll(),
      ...this.customFilters,
    };
  }

  /**
   * Static parse method for quick usage
   */
  static parse(
    rule: ParseRule,
    $: CheerioAPI,
    customFilters?: Record<string, FilterFunction>
  ): any {
    return parse(rule, $, customFilters);
  }

  /**
   * Create parser with custom filters
   */
  static create(customFilters?: Record<string, FilterFunction>): Parser {
    return new Parser(customFilters);
  }
}
