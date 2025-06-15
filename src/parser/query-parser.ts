/**
 * Query Parser - Parses CSS selector queries with attributes and filters
 */

import { QueryInfo, FilterInfo } from '@/types';

/**
 * Regular expressions for parsing queries
 */
const SELECTOR_REGEX = /^([^@]*)(?:@\s*([\w-_:]+))?$/;
const FILTER_REGEX = /\s*\|(?!\=)\s*/;

/**
 * Parse a query string into structured information
 * 
 * @param query - The query string to parse
 * @returns Parsed query information
 * 
 * @example
 * ```typescript
 * parseQuery('[.item]@href | trim | slice:0,10')
 * // Returns: {
 * //   selector: '.item',
 * //   attribute: 'href',
 * //   filters: [{ name: 'trim', args: [] }, { name: 'slice', args: ['0', '10'] }],
 * //   getAll: true
 * // }
 * ```
 */
export function parseQuery(query: string): QueryInfo {
  if (typeof query !== 'string') {
    throw new Error(`Query should be string: ${query}`);
  }

  let str = query.trim();
  let getAll = false;

  // Check if it's an array selector [selector]
  if (str.startsWith('[') && str.includes(']')) {
    const closeBracketIndex = str.indexOf(']');
    const selectorWithBrackets = str.substring(0, closeBracketIndex + 1);
    const restOfQuery = str.substring(closeBracketIndex + 1);

    getAll = true;
    str = selectorWithBrackets.slice(1, -1).trim() + restOfQuery;
  }

  // Split by filter separator
  const parts = str.split(FILTER_REGEX);
  const selectorPart = parts.shift() || '';
  const filterParts = parts;

  // Parse selector and attribute
  const match = selectorPart.match(SELECTOR_REGEX) || [];
  const selector = match[1] ? match[1].trim() : match[1];
  const attribute = match[2];

  // Parse filters
  const filters = filterParts.length > 0 
    ? parseFilters(filterParts.join('|'))
    : [];

  return {
    selector,
    attribute,
    filters,
    getAll,
  };
}

/**
 * Parse filter string into filter information array
 * 
 * @param filterStr - The filter string to parse
 * @returns Array of filter information
 */
function parseFilters(filterStr: string): FilterInfo[] {
  return filterStr.split(/\s*\|\s*/).map(call => {
    const parts = call.split(':');
    const name = parts.shift() || '';
    const args = parseFilterArgs(parts.join(':'));

    return {
      name,
      args,
    };
  });
}

/**
 * Parse filter arguments from string
 * 
 * @param str - The argument string to parse
 * @returns Array of parsed arguments
 */
function parseFilterArgs(str: string): any[] {
  if (!str.trim()) return [];

  const args: any[] = [];
  const regex = /"([^"]*)"|'([^']*)'|([^ \t,]+)/g;
  let match;

  while ((match = regex.exec(str))) {
    const arg = match[2] || match[1] || match[0];
    
    // Try to parse as number
    if (/^\d+$/.test(arg)) {
      args.push(parseInt(arg, 10));
    } else if (/^\d+\.\d+$/.test(arg)) {
      args.push(parseFloat(arg));
    } else if (arg === 'true') {
      args.push(true);
    } else if (arg === 'false') {
      args.push(false);
    } else if (arg === 'null') {
      args.push(null);
    } else if (arg === 'undefined') {
      args.push(undefined);
    } else {
      args.push(arg);
    }
  }

  return args;
}

/**
 * Query Parser class for more advanced usage
 */
export class QueryParser {
  /**
   * Parse a query string
   */
  static parse(query: string): QueryInfo {
    return parseQuery(query);
  }

  /**
   * Validate a query string
   */
  static validate(query: string): boolean {
    try {
      parseQuery(query);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if query is an array selector
   */
  static isArraySelector(query: string): boolean {
    return query.trim().startsWith('[') && query.trim().endsWith(']');
  }

  /**
   * Extract selector from query
   */
  static getSelector(query: string): string | undefined {
    return parseQuery(query).selector;
  }

  /**
   * Extract attribute from query
   */
  static getAttribute(query: string): string | undefined {
    return parseQuery(query).attribute;
  }

  /**
   * Extract filters from query
   */
  static getFilters(query: string): FilterInfo[] {
    return parseQuery(query).filters;
  }
}
