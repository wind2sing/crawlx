/**
 * Built-in filters for data transformation
 */

import { FilterFunction } from '@/types';

/**
 * Built-in filter functions
 */
export const builtinFilters: Record<string, FilterFunction> = {
  /**
   * Convert value to integer
   */
  int: (value: any, defaultValue?: any): number => {
    const fallback = typeof defaultValue === 'undefined' ? value : defaultValue;
    const match = String(value).match(/\d+/);
    return parseInt(match?.[0] || String(fallback), 10);
  },

  /**
   * Convert value to float
   */
  float: (value: any, defaultValue?: any): number => {
    const fallback = typeof defaultValue === 'undefined' ? value : defaultValue;
    const match = String(value).match(/[+-]?([0-9]*[.])?[0-9]+/);
    return parseFloat(match?.[0] || String(fallback));
  },

  /**
   * Convert value to boolean
   */
  bool: (value: any): boolean => {
    return Boolean(value);
  },

  /**
   * Trim whitespace from string
   */
  trim: (value: any): any => {
    return typeof value === 'string' ? value.trim() : value;
  },

  /**
   * Slice string or array
   */
  slice: (value: any, start: number, end?: number): any => {
    if (typeof value === 'string' || Array.isArray(value)) {
      return value.slice(start, end);
    }
    return value;
  },

  /**
   * Reverse string
   */
  reverse: (value: any): any => {
    if (typeof value === 'string') {
      return value.split('').reverse().join('');
    }
    if (Array.isArray(value)) {
      return [...value].reverse();
    }
    return value;
  },

  /**
   * Parse date
   */
  date: (value: any, append?: string): Date => {
    let dateStr = String(value);
    if (append && typeof dateStr === 'string') {
      dateStr += append;
    }

    let result = new Date(dateStr);
    
    // If invalid date, try to parse with regex
    if (isNaN(result.getTime())) {
      const match = dateStr.match(/(\d{4})\D*(\d{2})\D*(\d{2})\D*(\d{2}:\d{2}(:\d{2})?)?/);
      if (match) {
        const [, year, month, day, time] = match;
        result = new Date(`${year}-${month}-${day} ${time || ''} ${append || ''}`);
      }
    }

    return result;
  },

  /**
   * Parse file size to bytes
   */
  size: (input: any): number | any => {
    if (typeof input !== 'string') return input;

    const parsed = input.toString().match(/.*?([0-9\.,]+)(?:\s*)?(\w*).*/);
    if (!parsed) {
      return input;
    }

    const amount = parsed[1].replace(',', '.');
    const unit = parsed[2];

    if (isNaN(parseFloat(amount)) || !unit.match(/\D*/)) {
      return input;
    }

    if (unit === '') return Math.round(Number(amount));

    const increments = [
      [['b', 'bit', 'bits'], 1 / 8],
      [['B', 'Byte', 'Bytes', 'bytes'], 1],
      [['Kb'], 128],
      [['k', 'K', 'kb', 'KB', 'KiB', 'Ki', 'ki'], 1024],
      [['Mb'], 131072],
      [['m', 'M', 'mb', 'MB', 'MiB', 'Mi', 'mi'], Math.pow(1024, 2)],
      [['Gb'], 1.342e8],
      [['g', 'G', 'gb', 'GB', 'GiB', 'Gi', 'gi'], Math.pow(1024, 3)],
      [['Tb'], 1.374e11],
      [['t', 'T', 'tb', 'TB', 'TiB', 'Ti', 'ti'], Math.pow(1024, 4)],
      [['Pb'], 1.407e14],
      [['p', 'P', 'pb', 'PB', 'PiB', 'Pi', 'pi'], Math.pow(1024, 5)],
      [['Eb'], 1.441e17],
      [['e', 'E', 'eb', 'EB', 'EiB', 'Ei', 'ei'], Math.pow(1024, 6)],
    ] as const;

    for (const [units, multiplier] of increments) {
      if (units.includes(unit as any)) {
        return Math.round(parseFloat(amount) * multiplier);
      }
    }

    return input;
  },

  /**
   * Convert to uppercase
   */
  upper: (value: any): any => {
    return typeof value === 'string' ? value.toUpperCase() : value;
  },

  /**
   * Convert to lowercase
   */
  lower: (value: any): any => {
    return typeof value === 'string' ? value.toLowerCase() : value;
  },

  /**
   * Replace text
   */
  replace: (value: any, search: string, replacement: string): any => {
    if (typeof value === 'string') {
      return value.replace(new RegExp(search, 'g'), replacement);
    }
    return value;
  },

  /**
   * Split string
   */
  split: (value: any, separator: string): any => {
    return typeof value === 'string' ? value.split(separator) : value;
  },

  /**
   * Join array
   */
  join: (value: any, separator: string = ','): any => {
    return Array.isArray(value) ? value.join(separator) : value;
  },

  /**
   * Get first element
   */
  first: (value: any): any => {
    if (Array.isArray(value)) {
      return value[0];
    }
    if (typeof value === 'string') {
      return value[0];
    }
    return value;
  },

  /**
   * Get last element
   */
  last: (value: any): any => {
    if (Array.isArray(value)) {
      return value[value.length - 1];
    }
    if (typeof value === 'string') {
      return value[value.length - 1];
    }
    return value;
  },

  /**
   * Get length
   */
  length: (value: any): number => {
    if (Array.isArray(value) || typeof value === 'string') {
      return value.length;
    }
    return 0;
  },

  /**
   * Remove duplicates from array
   */
  unique: (value: any): any => {
    if (Array.isArray(value)) {
      return [...new Set(value)];
    }
    return value;
  },

  /**
   * Sort array
   */
  sort: (value: any): any => {
    if (Array.isArray(value)) {
      return [...value].sort();
    }
    return value;
  },

  /**
   * Filter array by condition
   */
  filter: (value: any, condition: string): any => {
    if (Array.isArray(value)) {
      return value.filter(item => {
        // Simple condition evaluation
        if (condition === 'truthy') return Boolean(item);
        if (condition === 'falsy') return !Boolean(item);
        return true;
      });
    }
    return value;
  },

  /**
   * Default value if empty
   */
  default: (value: any, defaultValue: any): any => {
    return value || defaultValue;
  },

  /**
   * Extract numbers from string
   */
  numbers: (value: any): number[] => {
    if (typeof value === 'string') {
      const matches = value.match(/\d+/g);
      return matches ? matches.map(Number) : [];
    }
    return [];
  },

  /**
   * Extract URLs from string
   */
  urls: (value: any): string[] => {
    if (typeof value === 'string') {
      const urlRegex = /https?:\/\/[^\s]+/g;
      return value.match(urlRegex) || [];
    }
    return [];
  },
};

/**
 * Filter registry for managing custom filters
 */
export class Filters {
  private static filters: Record<string, FilterFunction> = { ...builtinFilters };

  /**
   * Register a custom filter
   */
  static register(name: string, filter: FilterFunction): void {
    this.filters[name] = filter;
  }

  /**
   * Register multiple filters
   */
  static registerMany(filters: Record<string, FilterFunction>): void {
    Object.assign(this.filters, filters);
  }

  /**
   * Get a filter by name
   */
  static get(name: string): FilterFunction | undefined {
    return this.filters[name];
  }

  /**
   * Get all filters
   */
  static getAll(): Record<string, FilterFunction> {
    return { ...this.filters };
  }

  /**
   * Check if filter exists
   */
  static has(name: string): boolean {
    return name in this.filters;
  }

  /**
   * Remove a filter
   */
  static remove(name: string): boolean {
    if (name in this.filters) {
      delete this.filters[name];
      return true;
    }
    return false;
  }

  /**
   * Reset to builtin filters only
   */
  static reset(): void {
    this.filters = { ...builtinFilters };
  }

  /**
   * Apply a filter to a value
   */
  static apply(name: string, value: any, ...args: any[]): any {
    const filter = this.get(name);
    if (!filter) {
      throw new Error(`Filter '${name}' not found`);
    }
    try {
      return filter(value, ...args);
    } catch (error) {
      throw new Error(`Error applying filter '${name}': ${error}`);
    }
  }

  /**
   * Apply multiple filters in sequence
   */
  static applyChain(value: any, filters: Array<{ name: string; args: any[] }>): any {
    return filters.reduce((currentValue, { name, args }) => {
      return this.apply(name, currentValue, ...args);
    }, value);
  }
}
