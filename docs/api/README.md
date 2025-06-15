# CrawlX API Documentation

Complete API reference for CrawlX 2.0.

## Table of Contents

- [Core Classes](#core-classes)
  - [CrawlX](#crawlx)
  - [Parser](#parser)
  - [HttpClient](#httpclient)
  - [TaskScheduler](#taskscheduler)
  - [PluginManager](#pluginmanager)
- [Factory Functions](#factory-functions)
- [Configuration](#configuration)
- [Plugins](#plugins)
- [Utilities](#utilities)
- [Types](#types)

## Core Classes

### CrawlX

The main crawler class that orchestrates all crawling operations.

#### Constructor

```typescript
new CrawlX(options?: DeepPartial<CrawlerOptions>)
```

#### Methods

##### `crawl(url: string, options?: Partial<TaskOptions>): Promise<TaskResult>`

Crawl a single URL.

**Parameters:**
- `url` - The URL to crawl
- `options` - Optional task configuration

**Returns:** Promise resolving to TaskResult

**Example:**
```typescript
const crawler = new CrawlX();
const result = await crawler.crawl('https://example.com', {
  parse: { title: 'title' }
});
```

##### `crawlMany(urls: string[], options?: Partial<TaskOptions>): Promise<TaskResult[]>`

Crawl multiple URLs concurrently.

**Parameters:**
- `urls` - Array of URLs to crawl
- `options` - Optional task configuration

**Returns:** Promise resolving to array of TaskResults

##### `getStats(): CrawlerStats`

Get current crawler statistics.

**Returns:** Object containing crawler statistics

##### `getConfig(): Config`

Get the current configuration instance.

**Returns:** Config instance

##### `updateConfig(updates: DeepPartial<CrawlerOptions>): void`

Update crawler configuration at runtime.

**Parameters:**
- `updates` - Configuration updates to apply

##### `addPlugin(plugin: PluginInterface): void`

Add a custom plugin to the crawler.

**Parameters:**
- `plugin` - Plugin instance to add

##### `removePlugin(name: string): boolean`

Remove a plugin by name.

**Parameters:**
- `name` - Name of the plugin to remove

**Returns:** True if plugin was removed, false if not found

##### `destroy(): Promise<void>`

Destroy the crawler and clean up resources.

#### Events

The CrawlX class extends EventEmitter and emits the following events:

- `crawl-start` - Emitted when crawling starts
- `crawl-complete` - Emitted when crawling completes
- `crawl-error` - Emitted when crawling fails
- `task-queued` - Emitted when a task is queued
- `task-start` - Emitted when a task starts
- `task-complete` - Emitted when a task completes
- `task-error` - Emitted when a task fails
- `url-discovered` - Emitted when a new URL is discovered
- `data-extracted` - Emitted when data is extracted

### Parser

CSS selector-based parser with filter support.

#### Constructor

```typescript
new Parser(options?: ParserOptions)
```

#### Methods

##### `parse(html: string | CheerioAPI, rule: ParseRule): any`

Parse HTML using the provided rule.

**Parameters:**
- `html` - HTML string or Cheerio instance
- `rule` - Parse rule definition

**Returns:** Parsed data

##### `addFilter(name: string, filter: FilterFunction): void`

Add a custom filter function.

**Parameters:**
- `name` - Filter name
- `filter` - Filter function

##### `getFilters(): Record<string, FilterFunction>`

Get all available filters.

**Returns:** Object containing all filters

### HttpClient

HTTP client with multiple modes and Cheerio integration.

#### Static Methods

##### `HttpClient.create(mode: CrawlerMode, options?: HttpClientOptions): HttpClient`

Create an HTTP client instance.

**Parameters:**
- `mode` - Client mode ('lightweight' or 'high-performance')
- `options` - Client configuration options

**Returns:** HttpClient instance

#### Methods

##### `request(options: HttpRequest): Promise<HttpResponse>`

Make an HTTP request.

##### `requestWithCheerio(options: HttpRequest): Promise<HttpResponse>`

Make an HTTP request with automatic Cheerio parsing.

##### `getStats(): HttpClientStats`

Get client statistics.

##### `destroy(): void`

Destroy the client and clean up resources.

## Factory Functions

### `createCrawler(options?: DeepPartial<CrawlerOptions>): CrawlX`

Create a basic crawler instance.

### `createLightweightCrawler(options?: DeepPartial<CrawlerOptions>): CrawlX`

Create a lightweight crawler optimized for simple tasks.

### `createHighPerformanceCrawler(options?: DeepPartial<CrawlerOptions>): CrawlX`

Create a high-performance crawler for large-scale operations.

### `createScraper(options?: DeepPartial<CrawlerOptions>): CrawlX`

Create a scraper optimized for data extraction.

### `createSpider(options?: DeepPartial<CrawlerOptions>): CrawlX`

Create a spider for following links and discovering content.

### `createMonitor(options?: DeepPartial<CrawlerOptions>): CrawlX`

Create a monitor for checking website changes.

### `createValidator(options?: DeepPartial<CrawlerOptions>): CrawlX`

Create a validator for checking link health.

### `quickCrawl(url: string, parseRule?: any, options?: DeepPartial<CrawlerOptions>): Promise<TaskResult>`

Quick one-off crawling function.

### `batchCrawl(urls: string[], parseRule?: any, options?: DeepPartial<CrawlerOptions>): Promise<TaskResult[]>`

Batch crawl multiple URLs.

## Configuration

### Config Class

Configuration management with validation and environment variable support.

#### Methods

##### `get<T>(path: string, defaultValue?: T): T`

Get configuration value by path.

##### `set<T>(path: string, value: T, source?: ConfigSource): void`

Set configuration value.

##### `has(path: string): boolean`

Check if configuration path exists.

##### `validate(): { valid: boolean; errors: string[] }`

Validate configuration against schema.

### ConfigFactory

Factory for creating configuration instances.

#### Static Methods

##### `ConfigFactory.create(initialConfig?, options?): Config`

Create configuration with various sources.

##### `ConfigFactory.createLightweight(overrides?): Config`

Create lightweight configuration.

##### `ConfigFactory.createHighPerformance(overrides?): Config`

Create high-performance configuration.

### ConfigPresets

Pre-configured crawler instances for common use cases.

- `ConfigPresets.development()` - Development preset
- `ConfigPresets.production()` - Production preset
- `ConfigPresets.testing()` - Testing preset
- `ConfigPresets.scraping()` - Scraping preset

## Plugins

### Built-in Plugins

#### ParsePlugin

Handles data extraction and parsing.

#### FollowPlugin

Handles link following and discovery.

#### RetryPlugin

Handles automatic retry with backoff.

#### DelayPlugin

Handles request delays and politeness.

#### DuplicateFilterPlugin

Handles URL deduplication.

#### RateLimitPlugin

Handles advanced rate limiting.

### Plugin Development

#### Plugin Interface

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

## Utilities

### Logger

Structured logging with multiple transports.

### ErrorManager

Error handling and recovery.

### UrlUtils

URL manipulation utilities.

### ConfigUtils

Configuration management utilities.

## Types

### Core Types

```typescript
interface CrawlerOptions {
  mode?: CrawlerMode;
  concurrency?: number;
  timeout?: number;
  maxRetries?: number;
  userAgent?: string;
  headers?: Record<string, string>;
  // ... more options
}

interface TaskOptions {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  parse?: ParseRule;
  follow?: FollowRule;
  // ... more options
}

interface TaskResult {
  task: TaskOptions;
  response: HttpResponse;
  parsed?: any;
  followed?: TaskOptions[];
  metadata?: Record<string, any>;
}
```

### Parse Rules

```typescript
type ParseRule = 
  | string                    // Simple selector
  | string[]                  // Array selector
  | ParseRuleObject           // Object with nested rules
  | ParseRuleFunction;        // Custom function

interface ParseRuleObject {
  _scope?: string;            // Scope selector
  [key: string]: ParseRule;   // Nested rules
}
```

For complete type definitions, see the [types documentation](./types.md).
