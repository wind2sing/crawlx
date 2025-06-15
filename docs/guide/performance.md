# Performance Tuning Guide

Learn how to optimize CrawlX for maximum performance and efficiency.

## Performance Modes

### Lightweight Mode

Optimized for simple tasks and minimal resource usage:

```typescript
const crawler = new CrawlX({
  mode: 'lightweight',
  concurrency: 2,
  timeout: 5000,
  plugins: {
    parse: { enabled: true },
    delay: { enabled: true, defaultDelay: 1000 }
  }
});
```

**Best for:**
- Single page scraping
- Small-scale operations
- Development and testing
- Resource-constrained environments

### High-Performance Mode

Optimized for large-scale crawling operations:

```typescript
const crawler = new CrawlX({
  mode: 'high-performance',
  concurrency: 20,
  timeout: 10000,
  plugins: {
    parse: { enabled: true },
    duplicateFilter: { enabled: true, maxCacheSize: 100000 },
    rateLimit: { enabled: true }
  }
});
```

**Best for:**
- Large-scale crawling
- Production environments
- High-throughput requirements
- Batch processing

## Concurrency Optimization

### Finding the Right Concurrency Level

```typescript
// Start conservative
const crawler = new CrawlX({ concurrency: 5 });

// Monitor performance
crawler.on('task-complete', () => {
  const stats = crawler.getStats();
  console.log(`Queue size: ${stats.scheduler.queueSize}`);
  console.log(`Active tasks: ${stats.scheduler.activeTasks}`);
});

// Adjust based on results
if (stats.scheduler.queueSize > 1000) {
  crawler.updateConfig({ concurrency: 10 });
}
```

### Concurrency Guidelines

| Scenario | Recommended Concurrency |
|----------|------------------------|
| Single domain | 2-5 |
| Multiple domains | 10-20 |
| API endpoints | 20-50 |
| Local testing | 1-2 |

### Dynamic Concurrency Adjustment

```typescript
class AdaptiveConcurrencyPlugin {
  name = 'adaptive-concurrency';
  version = '1.0.0';
  priority = 200;

  private errorRate = 0;
  private successCount = 0;
  private errorCount = 0;

  async onTaskComplete(result: TaskResult): Promise<TaskResult> {
    this.successCount++;
    this.adjustConcurrency();
    return result;
  }

  async onTaskError(error: Error, task: TaskOptions): Promise<void> {
    this.errorCount++;
    this.adjustConcurrency();
  }

  private adjustConcurrency(): void {
    const totalRequests = this.successCount + this.errorCount;
    if (totalRequests < 100) return; // Wait for enough data

    this.errorRate = this.errorCount / totalRequests;
    const currentConcurrency = crawler.getConfig().get('concurrency');

    if (this.errorRate > 0.1 && currentConcurrency > 1) {
      // Too many errors, reduce concurrency
      crawler.updateConfig({ concurrency: Math.max(1, currentConcurrency - 1) });
    } else if (this.errorRate < 0.05 && currentConcurrency < 20) {
      // Low error rate, increase concurrency
      crawler.updateConfig({ concurrency: currentConcurrency + 1 });
    }

    // Reset counters
    this.successCount = 0;
    this.errorCount = 0;
  }
}
```

## Memory Optimization

### Memory-Efficient Configuration

```typescript
const crawler = new CrawlX({
  scheduler: {
    maxQueueSize: 1000, // Limit queue size
    resourceLimits: {
      maxMemoryUsage: 512 * 1024 * 1024, // 512MB
      maxCpuUsage: 80 // 80%
    }
  },
  plugins: {
    duplicateFilter: {
      enabled: true,
      maxCacheSize: 10000 // Limit cache size
    }
  }
});
```

### Memory Monitoring

```typescript
class MemoryMonitorPlugin {
  name = 'memory-monitor';
  version = '1.0.0';
  priority = 10;

  private checkInterval: NodeJS.Timeout;

  async onInit(): Promise<void> {
    this.checkInterval = setInterval(() => {
      const usage = process.memoryUsage();
      const usageMB = usage.heapUsed / 1024 / 1024;
      
      console.log(`Memory usage: ${usageMB.toFixed(2)} MB`);
      
      if (usageMB > 500) { // 500MB threshold
        console.warn('High memory usage detected');
        // Trigger garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }
    }, 5000);
  }

  async onDestroy(): Promise<void> {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }
}
```

### Streaming Large Responses

```typescript
class StreamingPlugin {
  name = 'streaming';
  version = '1.0.0';
  priority = 100;

  async onResponse(response: HttpResponse): Promise<HttpResponse> {
    // For large responses, process in chunks
    if (response.headers['content-length'] && 
        parseInt(response.headers['content-length']) > 10 * 1024 * 1024) {
      
      // Process response in streaming fashion
      response._streaming = true;
    }
    
    return response;
  }
}
```

## Network Optimization

### Connection Pooling

```typescript
const crawler = new CrawlX({
  httpClient: {
    keepAlive: true,
    maxSockets: 50,
    maxFreeSockets: 10,
    timeout: 30000,
    freeSocketTimeout: 15000
  }
});
```

### Request Optimization

```typescript
const crawler = new CrawlX({
  headers: {
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Cache-Control': 'no-cache'
  },
  timeout: 10000,
  maxRetries: 2
});
```

### DNS Optimization

```typescript
import { lookup } from 'dns';
import { promisify } from 'util';

class DNSCachePlugin {
  name = 'dns-cache';
  version = '1.0.0';
  priority = 200;

  private cache = new Map<string, string>();
  private dnsLookup = promisify(lookup);

  async onRequest(request: HttpRequest): Promise<HttpRequest> {
    const url = new URL(request.url);
    const hostname = url.hostname;

    if (!this.cache.has(hostname)) {
      try {
        const result = await this.dnsLookup(hostname);
        this.cache.set(hostname, result.address);
      } catch (error) {
        console.warn(`DNS lookup failed for ${hostname}:`, error);
      }
    }

    return request;
  }
}
```

## Parser Optimization

### Efficient Selectors

```typescript
// Inefficient - searches entire document
const badRule = {
  title: 'title',
  content: 'p' // Too broad
};

// Efficient - targeted selectors
const goodRule = {
  title: 'head > title',
  content: 'article.main-content p'
};
```

### Scoped Parsing

```typescript
// Process large lists efficiently
const efficientRule = {
  products: {
    _scope: '.product-grid .product', // Limit scope first
    name: '.product-name',
    price: '.price',
    // Only parse what you need
  }
};
```

### Custom Optimized Filters

```typescript
import { Parser } from 'crawlx';

const parser = new Parser();

// Optimized number filter
parser.addFilter('fastNumber', (value) => {
  if (typeof value === 'number') return value;
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
});

// Optimized text cleaning
parser.addFilter('fastTrim', (value) => {
  return typeof value === 'string' ? value.trim() : value;
});
```

## Caching Strategies

### Response Caching

```typescript
class SmartCachePlugin {
  name = 'smart-cache';
  version = '1.0.0';
  priority = 150;

  private cache = new Map();
  private maxSize = 1000;
  private ttl = 300000; // 5 minutes

  async onRequest(request: HttpRequest): Promise<HttpRequest> {
    const cacheKey = this.getCacheKey(request);
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.ttl) {
      request._cached = cached.response;
    }

    return request;
  }

  async onResponse(response: HttpResponse): Promise<HttpResponse> {
    if (!response._fromCache) {
      this.addToCache(response);
    }
    return response;
  }

  private getCacheKey(request: HttpRequest): string {
    return `${request.method || 'GET'}:${request.url}`;
  }

  private addToCache(response: HttpResponse): void {
    if (this.cache.size >= this.maxSize) {
      // LRU eviction
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(this.getCacheKey(response.request), {
      response,
      timestamp: Date.now()
    });
  }
}
```

### Persistent Caching

```typescript
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';

class PersistentCachePlugin {
  name = 'persistent-cache';
  version = '1.0.0';
  priority = 150;

  constructor(private cacheDir: string = './cache') {}

  async onInit(): Promise<void> {
    await fs.mkdir(this.cacheDir, { recursive: true });
  }

  async onRequest(request: HttpRequest): Promise<HttpRequest> {
    const cacheFile = this.getCacheFile(request);
    
    try {
      const cached = await fs.readFile(cacheFile, 'utf8');
      const data = JSON.parse(cached);
      
      if (Date.now() - data.timestamp < 3600000) { // 1 hour
        request._cached = data.response;
      }
    } catch {
      // Cache miss
    }

    return request;
  }

  async onResponse(response: HttpResponse): Promise<HttpResponse> {
    if (!response._fromCache) {
      const cacheFile = this.getCacheFile(response.request);
      const data = {
        response,
        timestamp: Date.now()
      };
      
      await fs.writeFile(cacheFile, JSON.stringify(data));
    }

    return response;
  }

  private getCacheFile(request: HttpRequest): string {
    const hash = createHash('md5')
      .update(`${request.method || 'GET'}:${request.url}`)
      .digest('hex');
    return join(this.cacheDir, `${hash}.json`);
  }
}
```

## Monitoring and Profiling

### Performance Metrics

```typescript
class PerformancePlugin {
  name = 'performance';
  version = '1.0.0';
  priority = 5;

  private metrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalTime: 0,
    averageTime: 0,
    minTime: Infinity,
    maxTime: 0
  };

  async onTaskStart(task: TaskOptions): Promise<void> {
    task._startTime = process.hrtime.bigint();
  }

  async onTaskComplete(result: TaskResult): Promise<TaskResult> {
    this.updateMetrics(result.task, true);
    return result;
  }

  async onTaskError(error: Error, task: TaskOptions): Promise<void> {
    this.updateMetrics(task, false);
  }

  private updateMetrics(task: TaskOptions, success: boolean): void {
    if (!task._startTime) return;

    const duration = Number(process.hrtime.bigint() - task._startTime) / 1000000; // ms
    
    this.metrics.totalRequests++;
    this.metrics.totalTime += duration;
    this.metrics.averageTime = this.metrics.totalTime / this.metrics.totalRequests;
    this.metrics.minTime = Math.min(this.metrics.minTime, duration);
    this.metrics.maxTime = Math.max(this.metrics.maxTime, duration);

    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    // Log metrics every 100 requests
    if (this.metrics.totalRequests % 100 === 0) {
      console.log('Performance Metrics:', this.metrics);
    }
  }
}
```

## Best Practices Summary

### 1. Choose the Right Mode
- Use lightweight mode for simple tasks
- Use high-performance mode for large-scale operations

### 2. Optimize Concurrency
- Start with conservative values
- Monitor and adjust based on performance
- Consider target server capacity

### 3. Manage Memory
- Set appropriate limits
- Monitor memory usage
- Use streaming for large responses

### 4. Cache Strategically
- Cache responses when appropriate
- Implement TTL for cache entries
- Consider persistent caching for long-running operations

### 5. Monitor Performance
- Track key metrics
- Set up alerts for performance degradation
- Profile regularly to identify bottlenecks

### 6. Respect Target Servers
- Implement appropriate delays
- Use rate limiting
- Follow robots.txt guidelines

By following these optimization strategies, you can achieve maximum performance while maintaining reliability and respecting target servers.
