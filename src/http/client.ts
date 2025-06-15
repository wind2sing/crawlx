/**
 * HTTP Client Factory - Creates appropriate client based on mode
 */

import * as cheerio from 'cheerio';

import { CrawlerMode, HttpClientOptions, HttpRequest, HttpResponse } from '@/types';
import { BaseHttpClient } from './base-client';
import { LightweightClient } from './lightweight-client';
import { HighPerformanceClient } from './high-performance-client';
import { extendCheerio } from '../parser/cheerio-extensions';

/**
 * HTTP Client with automatic Cheerio integration
 */
export class HttpClient extends BaseHttpClient {
  private client: BaseHttpClient;
  private mode: CrawlerMode;

  constructor(mode: CrawlerMode = 'lightweight', options: HttpClientOptions = {}) {
    super(options);
    this.mode = mode;
    this.client = this.createClient(mode, options);
    
    // Forward events from underlying client
    this.client.on('request', (request) => this.emit('request', request));
    this.client.on('response', (response) => this.emit('response', response));
    this.client.on('error', (error) => this.emit('error', error));
    this.client.on('destroy', () => this.emit('destroy'));
  }

  /**
   * Create appropriate client based on mode
   */
  private createClient(mode: CrawlerMode, options: HttpClientOptions): BaseHttpClient {
    switch (mode) {
      case 'lightweight':
        return new LightweightClient(options);
      case 'high-performance':
        return new HighPerformanceClient(options);
      default:
        throw new Error(`Unknown client mode: ${mode}`);
    }
  }

  /**
   * Make HTTP request
   */
  async request(request: HttpRequest): Promise<HttpResponse> {
    return this.client.request(request);
  }

  /**
   * Make request and return Cheerio instance
   */
  async requestWithCheerio(request: HttpRequest): Promise<HttpResponse & { $: cheerio.CheerioAPI }> {
    const response = await this.request(request);
    
    // Only parse HTML content
    const contentType = response.headers['content-type'] || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xml')) {
      throw new Error(`Cannot parse non-HTML content: ${contentType}`);
    }

    const html = response.body.toString('utf8');
    const $ = cheerio.load(html);
    extendCheerio($);

    return {
      ...response,
      $,
    };
  }

  /**
   * GET request with Cheerio
   */
  async getWithCheerio(url: string, options?: Partial<HttpRequest>): Promise<HttpResponse & { $: cheerio.CheerioAPI }> {
    return this.requestWithCheerio({
      url,
      method: 'GET',
      headers: {},
      timeout: this.options.timeout,
      ...options,
    });
  }

  /**
   * Switch client mode
   */
  switchMode(mode: CrawlerMode): void {
    if (mode === this.mode) return;
    
    this.client.destroy();
    this.mode = mode;
    this.client = this.createClient(mode, this.options);
    
    // Re-attach event listeners
    this.client.on('request', (request) => this.emit('request', request));
    this.client.on('response', (response) => this.emit('response', response));
    this.client.on('error', (error) => this.emit('error', error));
    this.client.on('destroy', () => this.emit('destroy'));
  }

  /**
   * Get current mode
   */
  getMode(): CrawlerMode {
    return this.mode;
  }

  /**
   * Get client statistics
   */
  getStats() {
    return {
      mode: this.mode,
      ...this.client.getStats(),
    };
  }

  /**
   * Destroy client
   */
  destroy(): void {
    this.client.destroy();
  }

  /**
   * Update options and recreate client if necessary
   */
  updateOptions(options: Partial<HttpClientOptions>): void {
    super.updateOptions(options);
    
    // Recreate client with new options
    this.client.destroy();
    this.client = this.createClient(this.mode, this.options);
    
    // Re-attach event listeners
    this.client.on('request', (request) => this.emit('request', request));
    this.client.on('response', (response) => this.emit('response', response));
    this.client.on('error', (error) => this.emit('error', error));
    this.client.on('destroy', () => this.emit('destroy'));
  }

  /**
   * Create HTTP client instance
   */
  static create(mode: CrawlerMode = 'lightweight', options: HttpClientOptions = {}): HttpClient {
    return new HttpClient(mode, options);
  }

  /**
   * Create lightweight client
   */
  static createLightweight(options: HttpClientOptions = {}): HttpClient {
    return new HttpClient('lightweight', options);
  }

  /**
   * Create high-performance client
   */
  static createHighPerformance(options: HttpClientOptions = {}): HttpClient {
    return new HttpClient('high-performance', options);
  }
}

/**
 * Utility functions for HTTP operations
 */
export class HttpUtils {
  /**
   * Check if URL is valid
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Normalize URL
   */
  static normalizeUrl(url: string, baseUrl?: string): string {
    try {
      return new URL(url, baseUrl).toString();
    } catch {
      throw new Error(`Invalid URL: ${url}`);
    }
  }

  /**
   * Extract domain from URL
   */
  static getDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      throw new Error(`Invalid URL: ${url}`);
    }
  }

  /**
   * Check if URL is same domain
   */
  static isSameDomain(url1: string, url2: string): boolean {
    try {
      return new URL(url1).hostname === new URL(url2).hostname;
    } catch {
      return false;
    }
  }

  /**
   * Build query string from object
   */
  static buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    }
    
    return searchParams.toString();
  }

  /**
   * Parse query string to object
   */
  static parseQueryString(queryString: string): Record<string, string> {
    const params: Record<string, string> = {};
    const searchParams = new URLSearchParams(queryString);
    
    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }
    
    return params;
  }

  /**
   * Check if response is successful
   */
  static isSuccessResponse(response: HttpResponse): boolean {
    return response.statusCode >= 200 && response.statusCode < 300;
  }

  /**
   * Check if response is redirect
   */
  static isRedirectResponse(response: HttpResponse): boolean {
    return response.statusCode >= 300 && response.statusCode < 400;
  }

  /**
   * Check if response is client error
   */
  static isClientErrorResponse(response: HttpResponse): boolean {
    return response.statusCode >= 400 && response.statusCode < 500;
  }

  /**
   * Check if response is server error
   */
  static isServerErrorResponse(response: HttpResponse): boolean {
    return response.statusCode >= 500 && response.statusCode < 600;
  }

  /**
   * Get content type from response
   */
  static getContentType(response: HttpResponse): string {
    return response.headers['content-type'] || '';
  }

  /**
   * Check if response is HTML
   */
  static isHtmlResponse(response: HttpResponse): boolean {
    const contentType = this.getContentType(response);
    return contentType.includes('text/html');
  }

  /**
   * Check if response is JSON
   */
  static isJsonResponse(response: HttpResponse): boolean {
    const contentType = this.getContentType(response);
    return contentType.includes('application/json');
  }

  /**
   * Parse JSON response
   */
  static parseJsonResponse(response: HttpResponse): any {
    if (!this.isJsonResponse(response)) {
      throw new Error('Response is not JSON');
    }
    
    try {
      return JSON.parse(response.body.toString('utf8'));
    } catch (error) {
      throw new Error(`Failed to parse JSON response: ${error}`);
    }
  }
}
