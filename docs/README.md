# CrawlX Documentation

Welcome to the comprehensive documentation for CrawlX 2.0 - the modern, powerful web crawling and scraping library for Node.js.

## 📚 Table of Contents

### Getting Started
- [Installation & Quick Start](./guide/getting-started.md) - Get up and running quickly
- [Basic Examples](./guide/examples.md) - Common use cases and patterns
- [Configuration Guide](./guide/configuration.md) - Complete configuration reference

### Core Concepts
- [Architecture Overview](./concepts/architecture.md) - Understanding CrawlX's design
- [Parsing System](./concepts/parsing.md) - CSS selectors and data extraction
- [Plugin System](./concepts/plugins.md) - Extensibility and customization
- [Task Scheduling](./concepts/scheduling.md) - Concurrency and resource management

### Guides
- [Advanced Examples](./guide/examples.md) - Real-world scraping scenarios
- [Plugin Development](./guide/plugins.md) - Creating custom plugins
- [Performance Tuning](./guide/performance.md) - Optimization strategies
- [Error Handling](./guide/error-handling.md) - Robust error management
- [Testing](./guide/testing.md) - Testing your crawlers

### API Reference
- [Core API](./api/README.md) - Complete API documentation
- [Types](./api/types.md) - TypeScript type definitions
- [Factory Functions](./api/factories.md) - Convenience functions
- [Configuration Schema](./api/configuration.md) - Configuration options

### Advanced Topics
- [Custom HTTP Clients](./advanced/http-clients.md) - Implementing custom clients
- [Data Pipelines](./advanced/pipelines.md) - Processing crawled data
- [Monitoring & Observability](./advanced/monitoring.md) - Production monitoring
- [Deployment](./advanced/deployment.md) - Production deployment strategies

### Migration & Compatibility
- [Migration from v1.x](./migration/from-v1.md) - Upgrading guide
- [Breaking Changes](./migration/breaking-changes.md) - What's changed
- [Compatibility](./migration/compatibility.md) - Browser and Node.js support

## 🚀 Quick Start

### Installation

```bash
npm install crawlx
```

### Basic Usage

```typescript
import { quickCrawl } from 'crawlx';

// Simple data extraction
const result = await quickCrawl('https://example.com', {
  title: 'title',
  description: 'meta[name="description"]@content'
});

console.log(result.parsed);
```

### Factory Functions

```typescript
import { createScraper, createSpider } from 'crawlx';

// Create a scraper for data extraction
const scraper = createScraper();
const data = await scraper.crawl('https://example.com', {
  parse: { title: 'title', links: '[a@href]' }
});

// Create a spider for link following
const spider = createSpider();
const results = await spider.crawlMany(['https://example.com'], {
  parse: { title: 'title' },
  follow: '[a@href]'
});
```

## 🏗️ Architecture Overview

CrawlX 2.0 is built with a modular architecture:

```
┌─────────────────┐
│   CrawlX Core   │ ← Main orchestrator
├─────────────────┤
│ Plugin Manager  │ ← Extensibility layer
├─────────────────┤
│ Task Scheduler  │ ← Concurrency & queuing
├─────────────────┤
│  HTTP Client    │ ← Network layer
├─────────────────┤
│ Parser Engine   │ ← Data extraction
├─────────────────┤
│ Config Manager  │ ← Configuration
└─────────────────┘
```

### Key Components

- **CrawlX Core**: Main crawler class that orchestrates all operations
- **Plugin Manager**: Handles plugin lifecycle and hook execution
- **Task Scheduler**: Manages task queuing, prioritization, and resource limits
- **HTTP Client**: Handles HTTP requests with multiple modes (lightweight/high-performance)
- **Parser Engine**: CSS selector-based parsing with filters and transformations
- **Config Manager**: Schema-based configuration with validation and environment support

## 🧩 Plugin System

CrawlX features a powerful plugin system with built-in plugins:

- **ParsePlugin**: Data extraction and parsing
- **FollowPlugin**: Link following and discovery
- **RetryPlugin**: Automatic retry with exponential backoff
- **DelayPlugin**: Request delays and politeness
- **DuplicateFilterPlugin**: URL deduplication
- **RateLimitPlugin**: Advanced rate limiting

### Custom Plugin Example

```typescript
class CustomPlugin {
  name = 'custom';
  version = '1.0.0';
  priority = 100;

  async onTaskComplete(result) {
    result.customData = { processed: true };
    return result;
  }
}

const crawler = new CrawlX();
crawler.addPlugin(new CustomPlugin());
```

## 📊 Data Extraction

Powerful CSS selector-based parsing with filters:

```typescript
const parseRule = {
  // Simple selectors
  title: 'title',
  links: '[a@href]',
  
  // Nested structures
  products: {
    _scope: '.product',
    name: '.name',
    price: '.price | trim | number',
    details: {
      _scope: '.details',
      description: '.desc',
      specs: ['.spec']
    }
  },
  
  // Custom functions
  timestamp: () => new Date().toISOString(),
  productCount: ($) => $('.product').length
};
```

## ⚡ Performance Features

- **Dual Modes**: Lightweight and high-performance modes
- **Smart Concurrency**: Configurable concurrent request handling
- **Connection Pooling**: Efficient HTTP connection management
- **Caching**: Response caching with TTL support
- **Rate Limiting**: Token bucket-based rate limiting
- **Memory Management**: Resource monitoring and limits

## 🛡️ Error Handling

Comprehensive error handling with custom error types:

```typescript
import { CrawlXError, NetworkError, TimeoutError } from 'crawlx';

try {
  const result = await crawler.crawl('https://example.com');
} catch (error) {
  if (error instanceof NetworkError) {
    console.log('Network error:', error.statusCode);
  } else if (error instanceof TimeoutError) {
    console.log('Timeout after:', error.timeout);
  }
}
```

## 📈 Monitoring

Built-in statistics and monitoring:

```typescript
const stats = crawler.getStats();
console.log({
  isRunning: stats.isRunning,
  results: stats.results,
  scheduler: stats.scheduler,
  httpClient: stats.httpClient,
  plugins: stats.plugins
});
```

## 🔧 Configuration

Flexible configuration with multiple sources:

```typescript
// Code configuration
const crawler = new CrawlX({
  mode: 'high-performance',
  concurrency: 10,
  plugins: {
    delay: { enabled: true, defaultDelay: 1000 }
  }
});

// Environment variables
CRAWLX_MODE=high-performance
CRAWLX_CONCURRENCY=10
CRAWLX_PLUGINS_DELAY_ENABLED=true

// Configuration presets
import { ConfigPresets } from 'crawlx';
const prodCrawler = ConfigPresets.production();
```

## 📖 Learning Path

### Beginner
1. [Getting Started](./guide/getting-started.md)
2. [Basic Examples](./guide/examples.md)
3. [Configuration Guide](./guide/configuration.md)

### Intermediate
1. [Advanced Examples](./guide/examples.md)
2. [Plugin Development](./guide/plugins.md)
3. [Performance Tuning](./guide/performance.md)

### Advanced
1. [Custom HTTP Clients](./advanced/http-clients.md)
2. [Data Pipelines](./advanced/pipelines.md)
3. [Production Deployment](./advanced/deployment.md)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](../CONTRIBUTING.md) for details.

## 📄 License

CrawlX is released under the [MIT License](../LICENSE).

## 🆘 Support

- [GitHub Issues](https://github.com/crawlx/crawlx/issues) - Bug reports and feature requests
- [GitHub Discussions](https://github.com/crawlx/crawlx/discussions) - Community support
- [Documentation](https://crawlx.dev/docs) - Comprehensive guides and API reference

---

**Ready to start crawling?** Check out the [Getting Started Guide](./guide/getting-started.md) to begin your journey with CrawlX!
