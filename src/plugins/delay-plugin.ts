/**
 * Delay Plugin - Adds delays between requests to respect rate limits
 */

import { Plugin } from '@/core/plugin';
import { TaskOptions, HttpRequest } from '@/types';

/**
 * Delay plugin configuration
 */
export interface DelayPluginConfig {
  enabled?: boolean;
  defaultDelay?: number;
  randomDelay?: boolean;
  randomRange?: [number, number];
  perDomainDelay?: Record<string, number>;
  respectRetryAfter?: boolean;
}

/**
 * Delay plugin for rate limiting requests
 */
export class DelayPlugin extends Plugin {
  private config: DelayPluginConfig;
  private lastRequestTimes = new Map<string, number>();

  constructor(config: DelayPluginConfig = {}) {
    super('delay', '1.0.0', 300); // High priority to run early
    
    this.config = {
      enabled: true,
      defaultDelay: 1000,
      randomDelay: false,
      randomRange: [500, 1500],
      perDomainDelay: {},
      respectRetryAfter: true,
      ...config,
    };
  }

  protected getDescription(): string {
    return 'Adds configurable delays between requests for rate limiting';
  }

  protected getAuthor(): string {
    return 'CrawlX Team';
  }

  protected getTags(): string[] {
    return ['delay', 'rate-limiting', 'politeness'];
  }

  /**
   * Initialize plugin
   */
  async onInit(): Promise<void> {
    if (this.context?.logger) {
      this.context.logger.info('Delay plugin initialized');
    }
  }

  /**
   * Add delay before request
   */
  async onRequest(request: HttpRequest): Promise<HttpRequest> {
    if (!this.enabled) return request;

    const domain = this.extractDomain(request.url);
    const delay = this.calculateDelay(request, domain);
    
    if (delay > 0) {
      await this.applyDelay(delay, domain);
    }

    return request;
  }

  /**
   * Calculate delay for request
   */
  private calculateDelay(request: HttpRequest, domain: string): number {
    // Check for task-specific delay
    if (typeof (request as any).delay === 'number') {
      return (request as any).delay;
    }

    // Check for domain-specific delay
    if (this.config.perDomainDelay![domain]) {
      return this.config.perDomainDelay![domain];
    }

    // Use default delay
    let delay = this.config.defaultDelay!;

    // Add randomization if enabled
    if (this.config.randomDelay) {
      const [min, max] = this.config.randomRange!;
      delay = Math.random() * (max - min) + min;
    }

    return delay;
  }

  /**
   * Apply delay with domain-specific tracking
   */
  private async applyDelay(delay: number, domain: string): Promise<void> {
    const lastRequestTime = this.lastRequestTimes.get(domain) || 0;
    const timeSinceLastRequest = Date.now() - lastRequestTime;
    
    if (timeSinceLastRequest < delay) {
      const actualDelay = delay - timeSinceLastRequest;
      
      if (this.context?.logger) {
        this.context.logger.debug(`Applying delay of ${actualDelay}ms for domain ${domain}`);
      }

      await new Promise(resolve => setTimeout(resolve, actualDelay));
    }

    this.lastRequestTimes.set(domain, Date.now());
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return 'unknown';
    }
  }

  /**
   * Set delay for specific domain
   */
  setDomainDelay(domain: string, delay: number): void {
    this.config.perDomainDelay![domain] = delay;
  }

  /**
   * Remove domain delay
   */
  removeDomainDelay(domain: string): void {
    delete this.config.perDomainDelay![domain];
  }

  /**
   * Clear all domain delays
   */
  clearDomainDelays(): void {
    this.config.perDomainDelay = {};
  }

  /**
   * Get last request time for domain
   */
  getLastRequestTime(domain: string): number | undefined {
    return this.lastRequestTimes.get(domain);
  }

  /**
   * Clear request history
   */
  clearRequestHistory(): void {
    this.lastRequestTimes.clear();
  }

  /**
   * Update plugin configuration
   */
  updateConfig(config: Partial<DelayPluginConfig>): void {
    Object.assign(this.config, config);
  }

  /**
   * Get plugin configuration
   */
  getConfig(): DelayPluginConfig {
    return { ...this.config };
  }

  /**
   * Get plugin statistics
   */
  getStats() {
    return {
      enabled: this.enabled,
      config: this.config,
      domainsTracked: this.lastRequestTimes.size,
      domainDelays: Object.keys(this.config.perDomainDelay!).length,
    };
  }
}
