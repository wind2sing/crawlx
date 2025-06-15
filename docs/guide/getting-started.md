# Getting Started with CrawlX

This guide will help you get up and running with CrawlX quickly.

## Installation

```bash
npm install crawlx
```

## Quick Start

### Basic Crawling

The simplest way to use CrawlX is with the `quickCrawl` function:

```typescript
import { quickCrawl } from 'crawlx';

const result = await quickCrawl('https://example.com', {
  title: 'title',
  description: 'meta[name="description"]@content'
});

console.log(result.parsed);
// Output: { title: "Example Domain", description: "..." }
```

### Creating a Crawler Instance

For more control, create a crawler instance:

```typescript
import { CrawlX } from 'crawlx';

const crawler = new CrawlX({
  concurrency: 5,
  timeout: 10000,
  userAgent: 'MyBot/1.0'
});

const result = await crawler.crawl('https://example.com');
console.log(result.response.statusCode); // 200

await crawler.destroy(); // Clean up resources
```

## Data Extraction

CrawlX uses CSS selectors for data extraction:

### Simple Selectors

```typescript
const parseRule = {
  title: 'title',                    // Text content
  links: '[a@href]',                 // Attribute values
  images: ['img@src'],               // Arrays
  price: '.price | trim | number'    // With filters
};

const result = await crawler.crawl('https://shop.example.com', {
  parse: parseRule
});
```

### Nested Data Structures

```typescript
const parseRule = {
  products: {
    _scope: '.product',              // Scope to product elements
    name: '.name',
    price: '.price | trim | number',
    image: 'img@src',
    details: {
      _scope: '.details',
      description: '.desc',
      specs: ['.spec']
    }
  }
};
```

### Custom Functions

```typescript
const parseRule = {
  title: 'title',
  url: () => window.location.href,
  timestamp: () => new Date().toISOString(),
  productCount: ($) => $('.product').length
};
```

## Factory Functions

CrawlX provides factory functions for common use cases:

### Lightweight Crawler

```typescript
import { createLightweightCrawler } from 'crawlx';

const crawler = createLightweightCrawler({
  concurrency: 2,
  timeout: 5000
});
```

### Scraper

```typescript
import { createScraper } from 'crawlx';

const scraper = createScraper();
const result = await scraper.crawl('https://example.com', {
  parse: {
    title: 'title',
    content: '.content'
  }
});
```

### Spider (Link Following)

```typescript
import { createSpider } from 'crawlx';

const spider = createSpider({
  plugins: {
    follow: {
      maxDepth: 3,
      sameDomainOnly: true
    }
  }
});

const results = await spider.crawlMany(['https://example.com'], {
  parse: { title: 'title' },
  follow: '[a@href]'  // Follow all links
});
```

## Configuration

### Basic Configuration

```typescript
const crawler = new CrawlX({
  mode: 'high-performance',
  concurrency: 10,
  timeout: 30000,
  maxRetries: 3,
  userAgent: 'MyBot/1.0',
  headers: {
    'Accept': 'text/html,application/xhtml+xml'
  }
});
```

### Plugin Configuration

```typescript
const crawler = new CrawlX({
  plugins: {
    delay: {
      enabled: true,
      defaultDelay: 1000,
      randomDelay: true
    },
    rateLimit: {
      enabled: true,
      globalLimit: { requests: 100, window: 60000 }
    },
    retry: {
      enabled: true,
      maxRetries: 3,
      exponentialBackoff: true
    }
  }
});
```

### Environment Variables

```bash
CRAWLX_MODE=high-performance
CRAWLX_CONCURRENCY=10
CRAWLX_TIMEOUT=30000
CRAWLX_PLUGINS_DELAY_ENABLED=true
CRAWLX_PLUGINS_DELAY_DEFAULT_DELAY=1000
```

### Configuration Presets

```typescript
import { ConfigPresets } from 'crawlx';

// Development preset
const devCrawler = ConfigPresets.development();

// Production preset
const prodCrawler = ConfigPresets.production();

// Testing preset
const testCrawler = ConfigPresets.testing();
```

## Event Handling

```typescript
const crawler = new CrawlX();

crawler.on('task-start', (task) => {
  console.log(`Starting: ${task.url}`);
});

crawler.on('task-complete', (result) => {
  console.log(`Completed: ${result.response.url}`);
});

crawler.on('data-extracted', (data, url) => {
  console.log(`Data from ${url}:`, data);
});

crawler.on('task-error', (error, task) => {
  console.error(`Failed ${task.url}:`, error.message);
});
```

## Error Handling

```typescript
import { CrawlXError, NetworkError, TimeoutError } from 'crawlx';

try {
  const result = await crawler.crawl('https://example.com');
} catch (error) {
  if (error instanceof NetworkError) {
    console.log('Network error:', error.statusCode);
  } else if (error instanceof TimeoutError) {
    console.log('Timeout after:', error.timeout);
  } else if (error instanceof CrawlXError) {
    console.log('CrawlX error:', error.code, error.context);
  }
}
```

## Custom Plugins

```typescript
class CustomPlugin {
  name = 'custom';
  version = '1.0.0';
  priority = 100;

  async onTaskComplete(result) {
    // Add custom processing
    result.customData = {
      processedAt: new Date().toISOString(),
      urlLength: result.response.url.length
    };
    return result;
  }
}

const crawler = new CrawlX();
crawler.addPlugin(new CustomPlugin());
```

## Best Practices

### 1. Resource Management

Always clean up resources:

```typescript
const crawler = new CrawlX();
try {
  const result = await crawler.crawl('https://example.com');
  // Process result
} finally {
  await crawler.destroy();
}
```

### 2. Error Handling

Handle errors gracefully:

```typescript
const crawler = new CrawlX({
  maxRetries: 3,
  timeout: 10000
});

crawler.on('task-error', (error, task) => {
  console.error(`Failed to crawl ${task.url}:`, error.message);
});
```

### 3. Rate Limiting

Be respectful to target websites:

```typescript
const crawler = new CrawlX({
  plugins: {
    delay: {
      enabled: true,
      defaultDelay: 1000  // 1 second between requests
    },
    rateLimit: {
      enabled: true,
      perDomainLimit: { requests: 10, window: 60000 }
    }
  }
});
```

### 4. Memory Management

For large-scale crawling:

```typescript
const crawler = new CrawlX({
  mode: 'high-performance',
  concurrency: 20,
  scheduler: {
    maxQueueSize: 1000,
    resourceLimits: {
      maxMemoryUsage: 1073741824  // 1GB
    }
  }
});
```

## Next Steps

- Read the [API Documentation](../api/README.md)
- Explore [Advanced Examples](./examples.md)
- Learn about [Plugin Development](./plugins.md)
- Check out [Performance Tuning](./performance.md)
