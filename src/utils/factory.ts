/**
 * Factory Functions for Creating CrawlX Instances
 */

import { CrawlerOptions, DeepPartial } from '@/types';
import { ConfigFactory } from '@/config';
import { CrawlX } from '@/core/crawlx';

/**
 * Create a simple crawler instance for basic crawling
 */
export function createCrawler(options?: DeepPartial<CrawlerOptions>): CrawlX {
  return new CrawlX(options);
}

/**
 * Create a lightweight crawler for simple tasks
 */
export function createLightweightCrawler(options?: DeepPartial<CrawlerOptions>): CrawlX {
  const config = ConfigFactory.createLightweight(options);
  return createCrawler(config.getAllNested());
}

/**
 * Create a high-performance crawler for large-scale operations
 */
export function createHighPerformanceCrawler(options?: DeepPartial<CrawlerOptions>): CrawlX {
  const config = ConfigFactory.createHighPerformance(options);
  return createCrawler(config.getAllNested());
}

/**
 * Create a scraper optimized for data extraction
 */
export function createScraper(options?: DeepPartial<CrawlerOptions>): CrawlX {
  const scraperOptions: DeepPartial<CrawlerOptions> = {
    mode: 'lightweight',
    concurrency: 3,
    ...options,
  };

  return createCrawler(scraperOptions);
}

/**
 * Create a spider for following links and discovering content
 */
export function createSpider(options?: DeepPartial<CrawlerOptions>): CrawlX {
  const spiderOptions: DeepPartial<CrawlerOptions> = {
    mode: 'high-performance',
    concurrency: 10,
    plugins: {
      parse: { enabled: true },
      follow: {
        enabled: true,
        maxDepth: 5,
        sameDomainOnly: true,
        deduplicateUrls: true,
      },
      duplicateFilter: { enabled: true, maxCacheSize: 50000 },
      delay: { enabled: true, defaultDelay: 500 },
      rateLimit: { enabled: true },
    },
    ...options,
  };

  return createCrawler(spiderOptions);
}

/**
 * Create a monitor for checking website changes
 */
export function createMonitor(options?: DeepPartial<CrawlerOptions>): CrawlX {
  const monitorOptions: DeepPartial<CrawlerOptions> = {
    mode: 'lightweight',
    concurrency: 1,
    maxRetries: 1,
    plugins: {
      parse: { enabled: true },
      follow: { enabled: false },
      duplicateFilter: { enabled: false }, // Allow re-crawling same URLs
      delay: { enabled: true, defaultDelay: 5000 },
      rateLimit: { enabled: false },
    },
    ...options,
  };

  return createCrawler(monitorOptions);
}

/**
 * Create a validator for checking link health
 */
export function createValidator(options?: DeepPartial<CrawlerOptions>): CrawlX {
  const validatorOptions: DeepPartial<CrawlerOptions> = {
    mode: 'lightweight',
    concurrency: 20,
    timeout: 10000,
    maxRetries: 1,
    plugins: {
      parse: { enabled: false },
      follow: { enabled: false },
      duplicateFilter: { enabled: true },
      delay: { enabled: false },
      rateLimit: { enabled: true },
    },
    ...options,
  };

  return createCrawler(validatorOptions);
}

/**
 * Factory function type
 */
export type CrawlerFactory = (options?: DeepPartial<CrawlerOptions>) => CrawlX;

/**
 * Registry of crawler factories
 */
export const CrawlerFactories: Record<string, CrawlerFactory> = {
  default: createCrawler,
  lightweight: createLightweightCrawler,
  'high-performance': createHighPerformanceCrawler,
  scraper: createScraper,
  spider: createSpider,
  monitor: createMonitor,
  validator: createValidator,
};

/**
 * Create crawler by type name
 */
export function createCrawlerByType(
  type: keyof typeof CrawlerFactories,
  options?: DeepPartial<CrawlerOptions>
): CrawlX {
  const factory = CrawlerFactories[type];
  if (!factory) {
    throw new Error(`Unknown crawler type: ${type}`);
  }
  return factory(options);
}

/**
 * Register custom crawler factory
 */
export function registerCrawlerFactory(name: string, factory: CrawlerFactory): void {
  CrawlerFactories[name] = factory;
}

/**
 * Get available crawler types
 */
export function getAvailableCrawlerTypes(): string[] {
  return Object.keys(CrawlerFactories);
}

/**
 * Quick crawl function for one-off requests
 */
export async function quickCrawl(
  url: string,
  parseRule?: any,
  options?: DeepPartial<CrawlerOptions>
) {
  const crawler = createLightweightCrawler({
    ...options,
    plugins: {
      ...options?.plugins,
      follow: { enabled: false },
    },
  });

  try {
    const result = await crawler.crawl(url, parseRule ? { parse: parseRule } : {});
    await crawler.destroy();
    return result;
  } catch (error) {
    await crawler.destroy();
    throw error;
  }
}

/**
 * Batch crawl function for multiple URLs
 */
export async function batchCrawl(
  urls: string[],
  parseRule?: any,
  options?: DeepPartial<CrawlerOptions>
) {
  const crawler = createCrawler({
    ...options,
    concurrency: Math.min(urls.length, options?.concurrency || 5),
  });

  try {
    const results = await crawler.crawlMany(urls, parseRule ? { parse: parseRule } : {});
    await crawler.destroy();
    return results;
  } catch (error) {
    await crawler.destroy();
    throw error;
  }
}

/**
 * Create crawler from configuration file
 */
export function createCrawlerFromConfig(configPath: string): CrawlX {
  const config = ConfigFactory.fromFile(configPath);
  return createCrawler(config.getAllNested());
}

/**
 * Create crawler from environment variables
 */
export function createCrawlerFromEnv(prefix?: string): CrawlX {
  const config = ConfigFactory.fromEnv(prefix);
  return createCrawler(config.getAllNested());
}
