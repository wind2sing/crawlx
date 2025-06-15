/**
 * Parser module exports
 */

export { Parser, parse } from './parser';
export { QueryParser, parseQuery } from './query-parser';
export { Filters, builtinFilters } from './filters';
export { 
  extendCheerio, 
  createExtendedCheerio, 
  ensureExtensions,
  type CheerioExtensions 
} from './cheerio-extensions';

// Re-export types
export type { 
  ParseRule, 
  ParseContext, 
  FilterFunction, 
  QueryInfo, 
  FilterInfo 
} from '@/types';
