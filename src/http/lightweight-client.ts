/**
 * Lightweight HTTP Client - Simple client using Node.js built-in modules
 */

import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';

import { HttpRequest, HttpResponse } from '@/types';
import { BaseHttpClient } from './base-client';

/**
 * Lightweight HTTP client using Node.js built-in modules
 * Perfect for simple crawling tasks with minimal dependencies
 */
export class LightweightClient extends BaseHttpClient {
  private stats = {
    activeRequests: 0,
    totalRequests: 0,
    totalBytes: 0,
    totalResponseTime: 0,
  };

  /**
   * Make HTTP request using Node.js built-in modules
   */
  async request(request: HttpRequest): Promise<HttpResponse> {
    this.validateUrl(request.url);
    
    const url = new URL(request.url);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const timing = this.createTiming();
    const headers = this.prepareHeaders(request);
    
    this.stats.activeRequests++;
    this.stats.totalRequests++;
    
    this.emit('request', request);

    return new Promise((resolve, reject) => {
      const timeoutHandler = this.createTimeoutHandler(request.timeout);
      
      const requestOptions: http.RequestOptions = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: request.method,
        headers,
        timeout: request.timeout,
      };

      const req = client.request(requestOptions, (res) => {
        timing.firstByte = Date.now();
        
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
            url: request.url,
            redirectUrls: [], // Simple client doesn't track redirects
            timing,
          };

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
    });
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
    };
  }

  /**
   * Destroy client (no-op for lightweight client)
   */
  destroy(): void {
    // Lightweight client doesn't maintain persistent connections
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
    };
  }
}
