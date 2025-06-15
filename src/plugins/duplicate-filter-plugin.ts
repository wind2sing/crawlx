/**
 * Duplicate Filter Plugin - Prevents duplicate URL requests
 */

import { Plugin } from '@/core/plugin';
import { TaskOptions } from '@/types';

/**
 * Duplicate filter plugin configuration
 */
export interface DuplicateFilterPluginConfig {
  enabled?: boolean;
  normalizeUrls?: boolean;
  ignoreQuery?: boolean;
  ignoreFragment?: boolean;
  ignoreCase?: boolean;
  customNormalizer?: (url: string) => string;
  maxCacheSize?: number;
}

/**
 * URL fingerprint for deduplication
 */
export interface UrlFingerprint {
  original: string;
  normalized: string;
  timestamp: number;
  count: number;
}

/**
 * Duplicate filter plugin for preventing duplicate requests
 */
export class DuplicateFilterPlugin extends Plugin {
  private config: DuplicateFilterPluginConfig;
  private seenUrls = new Map<string, UrlFingerprint>();

  constructor(config: DuplicateFilterPluginConfig = {}) {
    super('duplicate-filter', '1.0.0', 400); // Very high priority to run first
    
    this.config = {
      enabled: true,
      normalizeUrls: true,
      ignoreQuery: false,
      ignoreFragment: true,
      ignoreCase: true,
      maxCacheSize: 10000,
      ...config,
    };
  }

  protected getDescription(): string {
    return 'Filters out duplicate URLs to prevent redundant requests';
  }

  protected getAuthor(): string {
    return 'CrawlX Team';
  }

  protected getTags(): string[] {
    return ['deduplication', 'filtering', 'optimization'];
  }

  /**
   * Initialize plugin
   */
  async onInit(): Promise<void> {
    if (this.context?.logger) {
      this.context.logger.info('Duplicate filter plugin initialized');
    }
  }

  /**
   * Filter duplicate tasks
   */
  async onTaskCreate(task: TaskOptions): Promise<TaskOptions> {
    if (!this.enabled) return task;

    const normalizedUrl = this.normalizeUrl(task.url);
    
    if (this.seenUrls.has(normalizedUrl)) {
      const fingerprint = this.seenUrls.get(normalizedUrl)!;
      fingerprint.count++;
      
      if (this.context?.logger) {
        this.context.logger.debug(`Duplicate URL filtered: ${task.url} (seen ${fingerprint.count} times)`);
      }

      // Throw error to prevent task execution
      throw new Error(`Duplicate URL: ${task.url}`);
    }

    // Record URL as seen
    this.seenUrls.set(normalizedUrl, {
      original: task.url,
      normalized: normalizedUrl,
      timestamp: Date.now(),
      count: 1,
    });

    // Cleanup cache if it gets too large
    this.cleanupCache();

    return task;
  }

  /**
   * Normalize URL for comparison
   */
  private normalizeUrl(url: string): string {
    if (this.config.customNormalizer) {
      return this.config.customNormalizer(url);
    }

    try {
      const urlObj = new URL(url);
      
      // Apply normalization options
      if (this.config.ignoreQuery) {
        urlObj.search = '';
      }
      
      if (this.config.ignoreFragment) {
        urlObj.hash = '';
      }

      let normalized = urlObj.toString();
      
      if (this.config.ignoreCase) {
        normalized = normalized.toLowerCase();
      }

      // Remove trailing slash for consistency
      if (normalized.endsWith('/') && normalized !== urlObj.origin + '/') {
        normalized = normalized.slice(0, -1);
      }

      return normalized;
    } catch {
      // If URL parsing fails, return original URL
      return this.config.ignoreCase ? url.toLowerCase() : url;
    }
  }

  /**
   * Cleanup cache when it exceeds max size
   */
  private cleanupCache(): void {
    if (this.seenUrls.size > this.config.maxCacheSize!) {
      // Remove oldest entries (simple LRU-like behavior)
      const entries = Array.from(this.seenUrls.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, Math.floor(this.config.maxCacheSize! * 0.1));
      for (const [key] of toRemove) {
        this.seenUrls.delete(key);
      }

      if (this.context?.logger) {
        this.context.logger.debug(`Cleaned up ${toRemove.length} entries from duplicate filter cache`);
      }
    }
  }

  /**
   * Check if URL has been seen
   */
  hasSeen(url: string): boolean {
    const normalizedUrl = this.normalizeUrl(url);
    return this.seenUrls.has(normalizedUrl);
  }

  /**
   * Get URL fingerprint
   */
  getFingerprint(url: string): UrlFingerprint | undefined {
    const normalizedUrl = this.normalizeUrl(url);
    return this.seenUrls.get(normalizedUrl);
  }

  /**
   * Add URL to seen list without creating task
   */
  markAsSeen(url: string): void {
    const normalizedUrl = this.normalizeUrl(url);
    
    if (this.seenUrls.has(normalizedUrl)) {
      this.seenUrls.get(normalizedUrl)!.count++;
    } else {
      this.seenUrls.set(normalizedUrl, {
        original: url,
        normalized: normalizedUrl,
        timestamp: Date.now(),
        count: 1,
      });
    }
  }

  /**
   * Remove URL from seen list
   */
  removeSeen(url: string): boolean {
    const normalizedUrl = this.normalizeUrl(url);
    return this.seenUrls.delete(normalizedUrl);
  }

  /**
   * Clear all seen URLs
   */
  clearSeen(): void {
    this.seenUrls.clear();
  }

  /**
   * Get all seen URLs
   */
  getSeenUrls(): UrlFingerprint[] {
    return Array.from(this.seenUrls.values());
  }

  /**
   * Get seen URLs by pattern
   */
  getSeenUrlsByPattern(pattern: RegExp): UrlFingerprint[] {
    return this.getSeenUrls().filter(fingerprint => 
      pattern.test(fingerprint.original) || pattern.test(fingerprint.normalized)
    );
  }

  /**
   * Export seen URLs for persistence
   */
  exportSeenUrls(): string {
    const data = Array.from(this.seenUrls.entries()).map(([key, value]) => ({
      key,
      ...value,
    }));
    return JSON.stringify(data);
  }

  /**
   * Import seen URLs from persistence
   */
  importSeenUrls(data: string): void {
    try {
      const parsed = JSON.parse(data);
      this.seenUrls.clear();
      
      for (const item of parsed) {
        this.seenUrls.set(item.key, {
          original: item.original,
          normalized: item.normalized,
          timestamp: item.timestamp,
          count: item.count,
        });
      }
    } catch (error) {
      if (this.context?.logger) {
        this.context.logger.error(`Failed to import seen URLs: ${error}`);
      }
    }
  }

  /**
   * Update plugin configuration
   */
  updateConfig(config: Partial<DuplicateFilterPluginConfig>): void {
    Object.assign(this.config, config);
  }

  /**
   * Get plugin configuration
   */
  getConfig(): DuplicateFilterPluginConfig {
    return { ...this.config };
  }

  /**
   * Get plugin statistics
   */
  getStats() {
    const fingerprints = this.getSeenUrls();
    const totalRequests = fingerprints.reduce((sum, fp) => sum + fp.count, 0);
    const duplicateRequests = totalRequests - fingerprints.length;
    
    return {
      enabled: this.enabled,
      config: this.config,
      uniqueUrls: fingerprints.length,
      totalRequests,
      duplicateRequests,
      duplicateRate: totalRequests > 0 ? (duplicateRequests / totalRequests) * 100 : 0,
      cacheSize: this.seenUrls.size,
      oldestEntry: fingerprints.length > 0 
        ? Math.min(...fingerprints.map(fp => fp.timestamp))
        : null,
      newestEntry: fingerprints.length > 0 
        ? Math.max(...fingerprints.map(fp => fp.timestamp))
        : null,
    };
  }
}
