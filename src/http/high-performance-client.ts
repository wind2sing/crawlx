/**
 * High Performance HTTP Client - Advanced client with connection pooling and optimizations
 */

import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';

import { HttpRequest, HttpResponse } from '@/types';
import { BaseHttpClient } from './base-client';

/**
 * High performance HTTP client with connection pooling and advanced features
 * Ideal for large-scale crawling operations
 */
export class HighPerformanceClient extends BaseHttpClient {
  private httpAgent: http.Agent;
  private httpsAgent: https.Agent;
  private stats = {
    activeRequests: 0,
    totalRequests: 0,
    totalBytes: 0,
    totalResponseTime: 0,
    connectionPoolSize: 0,
    cacheHits: 0,
  };
  private responseCache = new Map<string, { response: HttpResponse; timestamp: number }>();
  private readonly cacheMaxAge = 5 * 60 * 1000; // 5 minutes

  constructor(options = {}) {
    super(options);
    
    // Create agents with connection pooling
    this.httpAgent = new http.Agent({
      keepAlive: this.options.keepAlive,
      maxSockets: this.options.maxSockets,
      maxFreeSockets: Math.floor(this.options.maxSockets / 2),
      timeout: this.options.timeout,
    });

    this.httpsAgent = new https.Agent({
      keepAlive: this.options.keepAlive,
      maxSockets: this.options.maxSockets,
      maxFreeSockets: Math.floor(this.options.maxSockets / 2),
      timeout: this.options.timeout,
      rejectUnauthorized: false, // For crawling, we might need to accept self-signed certs
    });

    // Cleanup cache periodically
    setInterval(() => this.cleanupCache(), 60000); // Every minute
  }

  /**
   * Make HTTP request with advanced features
   */
  async request(request: HttpRequest): Promise<HttpResponse> {
    this.validateUrl(request.url);
    
    // Check cache for GET requests
    if (request.method === 'GET') {
      const cached = this.getCachedResponse(request.url);
      if (cached) {
        this.stats.cacheHits++;
        return cached;
      }
    }

    const url = new URL(request.url);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    const agent = isHttps ? this.httpsAgent : this.httpAgent;
    
    const timing = this.createTiming();
    const headers = this.prepareHeaders(request);
    
    this.stats.activeRequests++;
    this.stats.totalRequests++;
    
    this.emit('request', request);

    return new Promise((resolve, reject) => {
      const timeoutHandler = this.createTimeoutHandler(request.timeout);
      let redirectCount = 0;
      const redirectUrls: string[] = [];

      const makeRequest = (currentUrl: string): void => {
        const currentUrlObj = new URL(currentUrl);
        
        const requestOptions: http.RequestOptions = {
          hostname: currentUrlObj.hostname,
          port: currentUrlObj.port || (isHttps ? 443 : 80),
          path: currentUrlObj.pathname + currentUrlObj.search,
          method: request.method,
          headers,
          agent,
          timeout: request.timeout,
        };

        const req = client.request(requestOptions, (res) => {
          timing.firstByte = Date.now();
          
          // Handle redirects
          if (this.options.followRedirects && this.isRedirect(res.statusCode || 0)) {
            const location = res.headers.location;
            if (location && redirectCount < this.options.maxRedirects) {
              redirectCount++;
              redirectUrls.push(currentUrl);
              
              // Resolve relative URLs
              const redirectUrl = new URL(location, currentUrl).toString();
              makeRequest(redirectUrl);
              return;
            }
          }

          const chunks: Buffer[] = [];
          let totalBytes = 0;

          res.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
            totalBytes += chunk.length;
          });

          res.on('end', () => {
            this.clearTimeoutHandler(timeoutHandler);
            timing.download = Date.now();
            this.finalizeTiming(timing);
            
            const body = Buffer.concat(chunks);
            this.stats.totalBytes += totalBytes;
            this.stats.totalResponseTime += timing.total;
            this.stats.activeRequests--;

            const response: HttpResponse = {
              statusCode: res.statusCode || 0,
              statusMessage: res.statusMessage || '',
              headers: this.normalizeHeaders(res.headers),
              body,
              url: currentUrl,
              redirectUrls,
              timing,
            };

            // Cache successful GET responses
            if (request.method === 'GET' && res.statusCode === 200) {
              this.cacheResponse(request.url, response);
            }

            this.emit('response', response);
            resolve(response);
          });

          res.on('error', (error) => {
            this.clearTimeoutHandler(timeoutHandler);
            this.stats.activeRequests--;
            this.emit('error', error);
            reject(error);
          });
        });

        req.on('error', (error) => {
          this.clearTimeoutHandler(timeoutHandler);
          this.stats.activeRequests--;
          this.emit('error', error);
          reject(error);
        });

        req.on('timeout', () => {
          req.destroy();
          this.stats.activeRequests--;
          const error = new Error(`Request timeout after ${request.timeout}ms`);
          this.emit('error', error);
          reject(error);
        });

        // Handle timeout promise
        timeoutHandler.promise.catch((error) => {
          req.destroy();
          this.stats.activeRequests--;
          this.emit('error', error);
          reject(error);
        });

        // Write request body if present
        if (request.body) {
          if (Buffer.isBuffer(request.body)) {
            req.write(request.body);
          } else {
            req.write(request.body, 'utf8');
          }
        }

        req.end();
      };

      makeRequest(request.url);
    });
  }

  /**
   * Check if status code is a redirect
   */
  private isRedirect(statusCode: number): boolean {
    return [301, 302, 303, 307, 308].includes(statusCode);
  }

  /**
   * Normalize response headers
   */
  private normalizeHeaders(headers: http.IncomingHttpHeaders): Record<string, string> {
    const normalized: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(headers)) {
      if (value !== undefined) {
        normalized[key.toLowerCase()] = Array.isArray(value) ? value.join(', ') : String(value);
      }
    }
    
    return normalized;
  }

  /**
   * Cache response
   */
  private cacheResponse(url: string, response: HttpResponse): void {
    this.responseCache.set(url, {
      response: { ...response },
      timestamp: Date.now(),
    });
  }

  /**
   * Get cached response
   */
  private getCachedResponse(url: string): HttpResponse | null {
    const cached = this.responseCache.get(url);
    if (cached && Date.now() - cached.timestamp < this.cacheMaxAge) {
      return { ...cached.response };
    }
    return null;
  }

  /**
   * Cleanup expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [url, cached] of this.responseCache.entries()) {
      if (now - cached.timestamp > this.cacheMaxAge) {
        this.responseCache.delete(url);
      }
    }
  }

  /**
   * Get client statistics
   */
  getStats() {
    return {
      activeRequests: this.stats.activeRequests,
      totalRequests: this.stats.totalRequests,
      totalBytes: this.stats.totalBytes,
      averageResponseTime: this.stats.totalRequests > 0 
        ? this.stats.totalResponseTime / this.stats.totalRequests 
        : 0,
      connectionPoolSize: this.httpAgent.getCurrentConnections?.() || 0,
      cacheHits: this.stats.cacheHits,
      cacheSize: this.responseCache.size,
    };
  }

  /**
   * Clear response cache
   */
  clearCache(): void {
    this.responseCache.clear();
  }

  /**
   * Destroy client and cleanup resources
   */
  destroy(): void {
    this.httpAgent.destroy();
    this.httpsAgent.destroy();
    this.responseCache.clear();
    this.emit('destroy');
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      activeRequests: 0,
      totalRequests: 0,
      totalBytes: 0,
      totalResponseTime: 0,
      connectionPoolSize: 0,
      cacheHits: 0,
    };
  }

  /**
   * Get connection pool status
   */
  getConnectionPoolStatus() {
    return {
      http: {
        sockets: Object.keys(this.httpAgent.sockets).length,
        freeSockets: Object.keys(this.httpAgent.freeSockets || {}).length,
        requests: Object.keys(this.httpAgent.requests || {}).length,
      },
      https: {
        sockets: Object.keys(this.httpsAgent.sockets).length,
        freeSockets: Object.keys(this.httpsAgent.freeSockets || {}).length,
        requests: Object.keys(this.httpsAgent.requests || {}).length,
      },
    };
  }
}
