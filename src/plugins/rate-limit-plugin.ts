/**
 * Rate Limit Plugin - Advanced rate limiting with token bucket algorithm
 */

import { Plugin } from '@/core/plugin';
import { TaskOptions, HttpRequest, HttpResponse } from '@/types';

/**
 * Rate limit plugin configuration
 */
export interface RateLimitPluginConfig {
  enabled?: boolean;
  globalLimit?: {
    requests: number;
    window: number; // in milliseconds
  };
  perDomainLimit?: {
    requests: number;
    window: number;
  };
  burstLimit?: number;
  respectRetryAfter?: boolean;
  customLimits?: Record<string, { requests: number; window: number }>;
}

/**
 * Token bucket for rate limiting
 */
class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private capacity: number,
    private refillRate: number, // tokens per second
    private refillInterval: number = 1000 // milliseconds
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  /**
   * Try to consume tokens
   */
  consume(tokens: number = 1): boolean {
    this.refill();
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    
    return false;
  }

  /**
   * Get available tokens
   */
  getAvailableTokens(): number {
    this.refill();
    return this.tokens;
  }

  /**
   * Get time until next token is available
   */
  getTimeUntilToken(): number {
    this.refill();
    
    if (this.tokens >= 1) {
      return 0;
    }
    
    return this.refillInterval / this.refillRate;
  }

  /**
   * Refill tokens based on time elapsed
   */
  private refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    
    if (timePassed >= this.refillInterval) {
      const tokensToAdd = Math.floor(timePassed / this.refillInterval) * this.refillRate;
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }
}

/**
 * Rate limit plugin using token bucket algorithm
 */
export class RateLimitPlugin extends Plugin {
  private config: RateLimitPluginConfig;
  private globalBucket?: TokenBucket;
  private domainBuckets = new Map<string, TokenBucket>();
  private retryAfterTimes = new Map<string, number>();

  constructor(config: RateLimitPluginConfig = {}) {
    super('rate-limit', '1.0.0', 350); // High priority
    
    this.config = {
      enabled: true,
      globalLimit: {
        requests: 100,
        window: 60000, // 1 minute
      },
      perDomainLimit: {
        requests: 10,
        window: 60000, // 1 minute
      },
      burstLimit: 5,
      respectRetryAfter: true,
      customLimits: {},
      ...config,
    };

    this.initializeBuckets();
  }

  protected getDescription(): string {
    return 'Advanced rate limiting using token bucket algorithm';
  }

  protected getAuthor(): string {
    return 'CrawlX Team';
  }

  protected getTags(): string[] {
    return ['rate-limiting', 'token-bucket', 'throttling'];
  }

  /**
   * Initialize token buckets
   */
  private initializeBuckets(): void {
    if (this.config.globalLimit) {
      const { requests, window } = this.config.globalLimit;
      const refillRate = requests / (window / 1000); // tokens per second
      this.globalBucket = new TokenBucket(requests, refillRate);
    }
  }

  /**
   * Initialize plugin
   */
  async onInit(): Promise<void> {
    if (this.context?.logger) {
      this.context.logger.info('Rate limit plugin initialized');
    }
  }

  /**
   * Check rate limits before request
   */
  async onRequest(request: HttpRequest): Promise<HttpRequest> {
    if (!this.enabled) return request;

    const domain = this.extractDomain(request.url);
    
    // Check retry-after header compliance
    if (this.config.respectRetryAfter && this.retryAfterTimes.has(domain)) {
      const retryAfter = this.retryAfterTimes.get(domain)!;
      if (Date.now() < retryAfter) {
        const waitTime = retryAfter - Date.now();
        if (this.context?.logger) {
          this.context.logger.debug(`Waiting ${waitTime}ms due to Retry-After header for ${domain}`);
        }
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        this.retryAfterTimes.delete(domain);
      }
    }

    // Check global rate limit
    if (this.globalBucket && !this.globalBucket.consume()) {
      const waitTime = this.globalBucket.getTimeUntilToken();
      if (this.context?.logger) {
        this.context.logger.debug(`Global rate limit reached, waiting ${waitTime}ms`);
      }
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    // Check domain-specific rate limit
    const domainBucket = this.getDomainBucket(domain);
    if (domainBucket && !domainBucket.consume()) {
      const waitTime = domainBucket.getTimeUntilToken();
      if (this.context?.logger) {
        this.context.logger.debug(`Domain rate limit reached for ${domain}, waiting ${waitTime}ms`);
      }
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    return request;
  }

  /**
   * Handle response and check for rate limit headers
   */
  async onResponse(response: HttpResponse): Promise<HttpResponse> {
    if (!this.enabled || !this.config.respectRetryAfter) return response;

    const domain = this.extractDomain(response.url);
    const retryAfter = response.headers['retry-after'];
    
    if (retryAfter) {
      let retryAfterMs: number;
      
      if (/^\d+$/.test(retryAfter)) {
        // Seconds
        retryAfterMs = parseInt(retryAfter, 10) * 1000;
      } else {
        // HTTP date
        const retryDate = new Date(retryAfter);
        retryAfterMs = retryDate.getTime() - Date.now();
      }
      
      if (retryAfterMs > 0) {
        this.retryAfterTimes.set(domain, Date.now() + retryAfterMs);
        
        if (this.context?.logger) {
          this.context.logger.info(`Retry-After header received for ${domain}: ${retryAfterMs}ms`);
        }
      }
    }

    return response;
  }

  /**
   * Get or create domain bucket
   */
  private getDomainBucket(domain: string): TokenBucket | undefined {
    if (!this.domainBuckets.has(domain)) {
      let limit = this.config.perDomainLimit;
      
      // Check for custom domain limits
      if (this.config.customLimits![domain]) {
        limit = this.config.customLimits![domain];
      }
      
      if (limit) {
        const { requests, window } = limit;
        const refillRate = requests / (window / 1000);
        const bucket = new TokenBucket(requests, refillRate);
        this.domainBuckets.set(domain, bucket);
        return bucket;
      }
    }
    
    return this.domainBuckets.get(domain);
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
   * Set custom rate limit for domain
   */
  setDomainLimit(domain: string, requests: number, window: number): void {
    this.config.customLimits![domain] = { requests, window };
    
    // Remove existing bucket to force recreation with new limits
    this.domainBuckets.delete(domain);
  }

  /**
   * Remove custom rate limit for domain
   */
  removeDomainLimit(domain: string): void {
    delete this.config.customLimits![domain];
    this.domainBuckets.delete(domain);
  }

  /**
   * Get available tokens for domain
   */
  getAvailableTokens(domain: string): number {
    const bucket = this.getDomainBucket(domain);
    return bucket ? bucket.getAvailableTokens() : 0;
  }

  /**
   * Get global available tokens
   */
  getGlobalAvailableTokens(): number {
    return this.globalBucket ? this.globalBucket.getAvailableTokens() : 0;
  }

  /**
   * Clear retry-after times
   */
  clearRetryAfterTimes(): void {
    this.retryAfterTimes.clear();
  }

  /**
   * Update plugin configuration
   */
  updateConfig(config: Partial<RateLimitPluginConfig>): void {
    Object.assign(this.config, config);
    
    // Reinitialize buckets if global limit changed
    if (config.globalLimit) {
      this.initializeBuckets();
    }
  }

  /**
   * Get plugin configuration
   */
  getConfig(): RateLimitPluginConfig {
    return { ...this.config };
  }

  /**
   * Get plugin statistics
   */
  getStats() {
    return {
      enabled: this.enabled,
      config: this.config,
      globalTokens: this.getGlobalAvailableTokens(),
      domainBuckets: this.domainBuckets.size,
      retryAfterDomains: this.retryAfterTimes.size,
      domainTokens: Array.from(this.domainBuckets.entries()).reduce((acc, [domain, bucket]) => {
        acc[domain] = bucket.getAvailableTokens();
        return acc;
      }, {} as Record<string, number>),
    };
  }
}
