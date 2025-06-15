/**
 * Base HTTP Client - Abstract base class for HTTP clients
 */

import { EventEmitter } from 'events';

import { HttpRequest, HttpResponse, HttpClientOptions } from '@/types';

/**
 * Abstract base class for HTTP clients
 */
export abstract class BaseHttpClient extends EventEmitter {
  protected options: Required<HttpClientOptions>;

  constructor(options: HttpClientOptions = {}) {
    super();
    
    this.options = {
      timeout: options.timeout ?? 30000,
      userAgent: options.userAgent ?? 'CrawlX/2.0.0',
      headers: options.headers ?? {},
      proxy: options.proxy ?? '',
      followRedirects: options.followRedirects ?? true,
      maxRedirects: options.maxRedirects ?? 10,
      cookies: options.cookies ?? false,
      keepAlive: options.keepAlive ?? true,
      maxSockets: options.maxSockets ?? 50,
    };
  }

  /**
   * Make HTTP request
   */
  abstract request(request: HttpRequest): Promise<HttpResponse>;

  /**
   * GET request
   */
  async get(url: string, options?: Partial<HttpRequest>): Promise<HttpResponse> {
    return this.request({
      url,
      method: 'GET',
      headers: {},
      timeout: this.options.timeout,
      ...options,
    });
  }

  /**
   * POST request
   */
  async post(url: string, body?: string | Buffer, options?: Partial<HttpRequest>): Promise<HttpResponse> {
    return this.request({
      url,
      method: 'POST',
      headers: {},
      body,
      timeout: this.options.timeout,
      ...options,
    });
  }

  /**
   * PUT request
   */
  async put(url: string, body?: string | Buffer, options?: Partial<HttpRequest>): Promise<HttpResponse> {
    return this.request({
      url,
      method: 'PUT',
      headers: {},
      body,
      timeout: this.options.timeout,
      ...options,
    });
  }

  /**
   * DELETE request
   */
  async delete(url: string, options?: Partial<HttpRequest>): Promise<HttpResponse> {
    return this.request({
      url,
      method: 'DELETE',
      headers: {},
      timeout: this.options.timeout,
      ...options,
    });
  }

  /**
   * PATCH request
   */
  async patch(url: string, body?: string | Buffer, options?: Partial<HttpRequest>): Promise<HttpResponse> {
    return this.request({
      url,
      method: 'PATCH',
      headers: {},
      body,
      timeout: this.options.timeout,
      ...options,
    });
  }

  /**
   * Update client options
   */
  updateOptions(options: Partial<HttpClientOptions>): void {
    Object.assign(this.options, options);
  }

  /**
   * Get current options
   */
  getOptions(): Required<HttpClientOptions> {
    return { ...this.options };
  }

  /**
   * Destroy client and cleanup resources
   */
  abstract destroy(): void;

  /**
   * Get client statistics
   */
  abstract getStats(): {
    activeRequests: number;
    totalRequests: number;
    totalBytes: number;
    averageResponseTime: number;
  };

  /**
   * Prepare request headers
   */
  protected prepareHeaders(request: HttpRequest): Record<string, string> {
    const headers = {
      'User-Agent': this.options.userAgent,
      ...this.options.headers,
      ...request.headers,
    };

    // Add content-length for requests with body
    if (request.body) {
      const bodyLength = Buffer.isBuffer(request.body) 
        ? request.body.length 
        : Buffer.byteLength(request.body, 'utf8');
      headers['Content-Length'] = String(bodyLength);
    }

    return headers;
  }

  /**
   * Validate URL
   */
  protected validateUrl(url: string): void {
    try {
      new URL(url);
    } catch (error) {
      throw new Error(`Invalid URL: ${url}`);
    }
  }

  /**
   * Create timing object
   */
  protected createTiming() {
    const start = Date.now();
    return {
      start,
      dns: undefined as number | undefined,
      tcp: undefined as number | undefined,
      tls: undefined as number | undefined,
      request: start,
      firstByte: undefined as number | undefined,
      download: undefined as number | undefined,
      total: 0,
    };
  }

  /**
   * Finalize timing
   */
  protected finalizeTiming(timing: ReturnType<typeof this.createTiming>) {
    timing.total = Date.now() - timing.start;
    return timing;
  }

  /**
   * Handle request timeout
   */
  protected createTimeoutHandler(timeout: number): {
    timeoutId: NodeJS.Timeout;
    promise: Promise<never>;
  } {
    let timeoutId: NodeJS.Timeout;
    
    const promise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`Request timeout after ${timeout}ms`));
      }, timeout);
    });

    return { timeoutId: timeoutId!, promise };
  }

  /**
   * Clear timeout
   */
  protected clearTimeoutHandler(timeoutHandler: { timeoutId: NodeJS.Timeout }) {
    clearTimeout(timeoutHandler.timeoutId);
  }
}
