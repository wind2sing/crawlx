# Plugin Development Guide

Learn how to create custom plugins for CrawlX to extend its functionality.

## Plugin Architecture

CrawlX uses a hook-based plugin system where plugins can intercept and modify the crawling process at various stages.

### Plugin Interface

```typescript
interface PluginInterface {
  name: string;
  version: string;
  priority: number;
  
  // Lifecycle hooks
  onInit?(): Promise<void>;
  onDestroy?(): Promise<void>;
  
  // Task hooks
  onTaskCreate?(task: TaskOptions): Promise<TaskOptions>;
  onTaskStart?(task: TaskOptions): Promise<void>;
  onTaskComplete?(result: TaskResult): Promise<TaskResult>;
  onTaskError?(error: Error, task: TaskOptions): Promise<void>;
  
  // HTTP hooks
  onRequest?(request: HttpRequest): Promise<HttpRequest>;
  onResponse?(response: HttpResponse): Promise<HttpResponse>;
}
```

## Basic Plugin Example

### Simple Logging Plugin

```typescript
class LoggingPlugin {
  name = 'logging';
  version = '1.0.0';
  priority = 50;

  async onTaskStart(task: TaskOptions): Promise<void> {
    console.log(`[${new Date().toISOString()}] Starting: ${task.url}`);
  }

  async onTaskComplete(result: TaskResult): Promise<TaskResult> {
    const { url, statusCode } = result.response;
    console.log(`[${new Date().toISOString()}] Completed: ${url} (${statusCode})`);
    return result;
  }

  async onTaskError(error: Error, task: TaskOptions): Promise<void> {
    console.error(`[${new Date().toISOString()}] Error: ${task.url} - ${error.message}`);
  }
}

// Usage
const crawler = new CrawlX();
crawler.addPlugin(new LoggingPlugin());
```

## Advanced Plugin Examples

### Custom Headers Plugin

```typescript
class CustomHeadersPlugin {
  name = 'custom-headers';
  version = '1.0.0';
  priority = 100;

  constructor(private headers: Record<string, string>) {}

  async onRequest(request: HttpRequest): Promise<HttpRequest> {
    return {
      ...request,
      headers: {
        ...request.headers,
        ...this.headers
      }
    };
  }
}

// Usage
const crawler = new CrawlX();
crawler.addPlugin(new CustomHeadersPlugin({
  'X-API-Key': 'your-api-key',
  'X-Custom-Header': 'custom-value'
}));
```

### Response Caching Plugin

```typescript
import { createHash } from 'crypto';

class CachingPlugin {
  name = 'caching';
  version = '1.0.0';
  priority = 200;
  
  private cache = new Map<string, HttpResponse>();
  private maxCacheSize: number;
  private ttl: number;

  constructor(options: { maxCacheSize?: number; ttl?: number } = {}) {
    this.maxCacheSize = options.maxCacheSize || 1000;
    this.ttl = options.ttl || 300000; // 5 minutes
  }

  private getCacheKey(request: HttpRequest): string {
    const key = `${request.method || 'GET'}:${request.url}`;
    return createHash('md5').update(key).digest('hex');
  }

  async onRequest(request: HttpRequest): Promise<HttpRequest> {
    const cacheKey = this.getCacheKey(request);
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      // Return cached response by modifying request to skip actual HTTP call
      request._cached = cached;
    }
    
    return request;
  }

  async onResponse(response: HttpResponse): Promise<HttpResponse> {
    if (!response._fromCache) {
      const cacheKey = this.getCacheKey(response.request);
      
      // Manage cache size
      if (this.cache.size >= this.maxCacheSize) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
      
      this.cache.set(cacheKey, {
        ...response,
        timestamp: Date.now()
      });
    }
    
    return response;
  }
}
```

### Data Validation Plugin

```typescript
class ValidationPlugin {
  name = 'validation';
  version = '1.0.0';
  priority = 75;

  constructor(private schema: any) {}

  async onTaskComplete(result: TaskResult): Promise<TaskResult> {
    if (result.parsed) {
      const validation = this.validateData(result.parsed, this.schema);
      
      result.metadata = {
        ...result.metadata,
        validation: {
          valid: validation.valid,
          errors: validation.errors
        }
      };

      if (!validation.valid) {
        console.warn(`Validation failed for ${result.response.url}:`, validation.errors);
      }
    }
    
    return result;
  }

  private validateData(data: any, schema: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Simple validation logic
    for (const [key, rules] of Object.entries(schema)) {
      const value = data[key];
      
      if (rules.required && (value === undefined || value === null)) {
        errors.push(`Required field missing: ${key}`);
      }
      
      if (value !== undefined && rules.type && typeof value !== rules.type) {
        errors.push(`Type mismatch for ${key}: expected ${rules.type}, got ${typeof value}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Usage
const schema = {
  title: { required: true, type: 'string' },
  price: { required: true, type: 'number' },
  description: { required: false, type: 'string' }
};

const crawler = new CrawlX();
crawler.addPlugin(new ValidationPlugin(schema));
```

### Screenshot Plugin

```typescript
class ScreenshotPlugin {
  name = 'screenshot';
  version = '1.0.0';
  priority = 25;

  constructor(private options: { 
    enabled?: boolean;
    path?: string;
    fullPage?: boolean;
  } = {}) {}

  async onTaskComplete(result: TaskResult): Promise<TaskResult> {
    if (!this.options.enabled) return result;

    try {
      // This would require a headless browser like Puppeteer
      // const screenshot = await this.takeScreenshot(result.response.url);
      
      result.metadata = {
        ...result.metadata,
        screenshot: {
          path: `${this.options.path}/${this.getFilename(result.response.url)}`,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.warn(`Screenshot failed for ${result.response.url}:`, error);
    }
    
    return result;
  }

  private getFilename(url: string): string {
    const urlObj = new URL(url);
    const timestamp = Date.now();
    return `${urlObj.hostname}-${timestamp}.png`;
  }
}
```

### Rate Limiting Plugin

```typescript
class AdvancedRateLimitPlugin {
  name = 'advanced-rate-limit';
  version = '1.0.0';
  priority = 150;

  private buckets = new Map<string, TokenBucket>();

  constructor(private config: {
    globalLimit: { tokens: number; refillRate: number };
    domainLimits: Record<string, { tokens: number; refillRate: number }>;
  }) {}

  async onTaskStart(task: TaskOptions): Promise<void> {
    const domain = new URL(task.url).hostname;
    
    // Check global rate limit
    const globalBucket = this.getBucket('global', this.config.globalLimit);
    await this.waitForToken(globalBucket);
    
    // Check domain-specific rate limit
    const domainConfig = this.config.domainLimits[domain];
    if (domainConfig) {
      const domainBucket = this.getBucket(domain, domainConfig);
      await this.waitForToken(domainBucket);
    }
  }

  private getBucket(key: string, config: { tokens: number; refillRate: number }): TokenBucket {
    if (!this.buckets.has(key)) {
      this.buckets.set(key, new TokenBucket(config.tokens, config.refillRate));
    }
    return this.buckets.get(key)!;
  }

  private async waitForToken(bucket: TokenBucket): Promise<void> {
    while (!bucket.consume()) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private capacity: number,
    private refillRate: number // tokens per second
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  consume(): boolean {
    this.refill();
    
    if (this.tokens >= 1) {
      this.tokens--;
      return true;
    }
    
    return false;
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = timePassed * this.refillRate;
    
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}
```

## Plugin Configuration

### Configurable Plugin

```typescript
interface MetricsPluginConfig {
  enabled: boolean;
  collectTiming: boolean;
  collectMemory: boolean;
  outputFile?: string;
}

class MetricsPlugin {
  name = 'metrics';
  version = '1.0.0';
  priority = 10;

  private metrics: any[] = [];

  constructor(private config: MetricsPluginConfig) {}

  async onTaskStart(task: TaskOptions): Promise<void> {
    if (!this.config.enabled) return;

    task._startTime = Date.now();
    if (this.config.collectMemory) {
      task._startMemory = process.memoryUsage();
    }
  }

  async onTaskComplete(result: TaskResult): Promise<TaskResult> {
    if (!this.config.enabled) return result;

    const metric: any = {
      url: result.response.url,
      statusCode: result.response.statusCode,
      timestamp: new Date().toISOString()
    };

    if (this.config.collectTiming && result.task._startTime) {
      metric.duration = Date.now() - result.task._startTime;
    }

    if (this.config.collectMemory && result.task._startMemory) {
      const endMemory = process.memoryUsage();
      metric.memoryDelta = {
        heapUsed: endMemory.heapUsed - result.task._startMemory.heapUsed,
        rss: endMemory.rss - result.task._startMemory.rss
      };
    }

    this.metrics.push(metric);

    if (this.config.outputFile && this.metrics.length % 100 === 0) {
      await this.writeMetrics();
    }

    return result;
  }

  async onDestroy(): Promise<void> {
    if (this.config.outputFile) {
      await this.writeMetrics();
    }
  }

  private async writeMetrics(): Promise<void> {
    const fs = await import('fs/promises');
    await fs.writeFile(
      this.config.outputFile!,
      JSON.stringify(this.metrics, null, 2)
    );
  }
}
```

## Plugin Best Practices

### 1. Error Handling

```typescript
class RobustPlugin {
  name = 'robust';
  version = '1.0.0';
  priority = 50;

  async onTaskComplete(result: TaskResult): Promise<TaskResult> {
    try {
      // Plugin logic here
      return this.processResult(result);
    } catch (error) {
      console.error(`Plugin ${this.name} failed:`, error);
      // Return original result on error
      return result;
    }
  }

  private processResult(result: TaskResult): TaskResult {
    // Actual processing logic
    return result;
  }
}
```

### 2. Async Operations

```typescript
class AsyncPlugin {
  name = 'async';
  version = '1.0.0';
  priority = 50;

  async onTaskComplete(result: TaskResult): Promise<TaskResult> {
    // Perform async operations
    const enrichedData = await this.enrichData(result.parsed);
    
    return {
      ...result,
      parsed: enrichedData
    };
  }

  private async enrichData(data: any): Promise<any> {
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));
    return { ...data, enriched: true };
  }
}
```

### 3. Resource Cleanup

```typescript
class ResourcePlugin {
  name = 'resource';
  version = '1.0.0';
  priority = 50;

  private connections: any[] = [];

  async onInit(): Promise<void> {
    // Initialize resources
    this.connections.push(/* some connection */);
  }

  async onDestroy(): Promise<void> {
    // Clean up resources
    await Promise.all(
      this.connections.map(conn => conn.close())
    );
    this.connections = [];
  }
}
```

## Plugin Testing

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('CustomPlugin', () => {
  let plugin: CustomPlugin;

  beforeEach(() => {
    plugin = new CustomPlugin();
  });

  it('should process task correctly', async () => {
    const mockTask = {
      url: 'https://example.com',
      method: 'GET'
    };

    const result = await plugin.onTaskStart(mockTask);
    expect(result).toBeDefined();
  });

  it('should handle errors gracefully', async () => {
    const mockResult = {
      task: { url: 'https://example.com' },
      response: { statusCode: 200 },
      parsed: null
    };

    const result = await plugin.onTaskComplete(mockResult);
    expect(result).toEqual(mockResult);
  });
});
```

## Publishing Plugins

### Package Structure

```
my-crawlx-plugin/
├── src/
│   ├── index.ts
│   └── plugin.ts
├── dist/
├── package.json
├── README.md
└── tsconfig.json
```

### Package.json

```json
{
  "name": "crawlx-plugin-example",
  "version": "1.0.0",
  "description": "Example plugin for CrawlX",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "keywords": ["crawlx", "plugin", "web-scraping"],
  "peerDependencies": {
    "crawlx": "^2.0.0"
  }
}
```

This guide provides a comprehensive overview of plugin development for CrawlX. Plugins allow you to extend the crawler's functionality while maintaining clean separation of concerns.
