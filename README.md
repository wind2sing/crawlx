# CrawlX 2.0

现代化、高性能的网络爬虫和数据提取库，基于 TypeScript 构建，提供强大的解析引擎、插件系统和配置管理。

<p align="center">
  <img alt="npm" src="https://img.shields.io/npm/v/crawlx">
  <img alt="NPM" src="https://img.shields.io/npm/l/crawlx">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-Ready-blue">
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-16%2B-green">
</p>

## ✨ 特性

- 🚀 **高性能**: 轻量级和高性能双模式，适应不同场景
- 🔧 **TypeScript**: 完整的类型安全和优秀的开发体验
- 🧩 **插件系统**: 可扩展的插件架构，6个内置插件 + 自定义插件支持
- 📊 **强大解析**: CSS选择器 + 过滤器管道 + 作用域解析
- 🕷️ **链接跟踪**: 智能链接发现和深度控制
- ⚡ **速率控制**: 令牌桶算法的高级速率限制
- 🔄 **智能重试**: 指数退避的重试机制
- 📝 **结构化日志**: 多传输的日志系统
- 🛡️ **错误处理**: 完善的错误类型和恢复机制
- ⚙️ **灵活配置**: Schema验证 + 环境变量 + 预设配置

## 📦 安装

```bash
npm install crawlx
```

## 🚀 快速开始

### 基础爬取

```typescript
import { CrawlX } from 'crawlx';

const crawler = new CrawlX();

// 爬取单个URL
const result = await crawler.crawl('https://example.com');
console.log('标题:', result.response.$.find('title').text());

await crawler.destroy();
```

### 数据提取

```typescript
import { createScraper } from 'crawlx';

const scraper = createScraper();

const result = await scraper.crawl('https://example.com', {
  parse: {
    title: 'title',
    headings: ['h1', 'h2'],
    links: '[a@href]',
    metadata: {
      description: 'meta[name="description"]@content',
      keywords: 'meta[name="keywords"]@content',
    },
  },
});

console.log('提取的数据:', result.parsed);
await scraper.destroy();
```

### 快速爬取

```typescript
import { quickCrawl } from 'crawlx';

const result = await quickCrawl('https://example.com', {
  title: 'title',
  description: 'meta[name="description"]@content',
});

console.log(result.parsed);
```

## 🏭 工厂函数

CrawlX 提供多种预配置的工厂函数：

```typescript
import { 
  createLightweightCrawler,
  createHighPerformanceCrawler,
  createScraper,
  createSpider,
  createMonitor,
  createValidator 
} from 'crawlx';

// 轻量级爬虫 - 适合简单任务
const lightweight = createLightweightCrawler();

// 高性能爬虫 - 适合大规模操作
const highPerf = createHighPerformanceCrawler();

// 数据提取器 - 优化的数据提取
const scraper = createScraper();

// 网络蜘蛛 - 链接跟踪和内容发现
const spider = createSpider();

// 监控器 - 网站变化检测
const monitor = createMonitor();

// 验证器 - 链接健康检查
const validator = createValidator();
```

## 📊 数据解析

强大的CSS选择器解析系统：

### 基础选择器

```typescript
const parseRule = {
  title: 'title',                    // 文本内容
  links: '[a@href]',                 // 属性值
  images: ['img@src'],               // 数组
  price: '.price | trim | number',   // 过滤器
};
```

### 嵌套结构

```typescript
const parseRule = {
  products: {
    _scope: '.product',              // 作用域
    name: '.name',
    price: '.price | trim | number',
    image: 'img@src',
    details: {
      _scope: '.details',
      description: '.desc',
      specs: ['.spec'],
    },
  },
};
```

### 自定义函数

```typescript
const parseRule = {
  title: 'title',
  url: () => window.location.href,
  timestamp: () => new Date().toISOString(),
  productCount: ($) => $('.product').length,
};
```

## ⚙️ 配置

### 基础配置

```typescript
const crawler = new CrawlX({
  mode: 'high-performance',
  concurrency: 10,
  timeout: 30000,
  userAgent: 'MyBot/1.0',
  headers: {
    'Accept': 'text/html,application/xhtml+xml',
  },
});
```

### 插件配置

```typescript
const crawler = new CrawlX({
  plugins: {
    delay: {
      enabled: true,
      defaultDelay: 1000,
      randomDelay: true,
    },
    rateLimit: {
      enabled: true,
      globalLimit: { requests: 100, window: 60000 },
    },
    retry: {
      enabled: true,
      maxRetries: 3,
      exponentialBackoff: true,
    },
  },
});
```

### 环境变量

```bash
CRAWLX_MODE=high-performance
CRAWLX_CONCURRENCY=10
CRAWLX_TIMEOUT=30000
CRAWLX_PLUGINS_DELAY_ENABLED=true
```

### 配置预设

```typescript
import { ConfigPresets } from 'crawlx';

// 开发预设
const devCrawler = ConfigPresets.development();

// 生产预设
const prodCrawler = ConfigPresets.production();

// 测试预设
const testCrawler = ConfigPresets.testing();
```

## 🧩 插件系统

### 内置插件

- **ParsePlugin**: 数据解析和提取
- **FollowPlugin**: 链接跟踪和发现
- **RetryPlugin**: 自动重试机制
- **DelayPlugin**: 请求延迟和礼貌性
- **DuplicateFilterPlugin**: URL去重过滤
- **RateLimitPlugin**: 高级速率限制

### 自定义插件

```typescript
class CustomPlugin {
  name = 'custom';
  version = '1.0.0';
  priority = 100;

  async onTaskComplete(result) {
    result.customData = {
      processedAt: new Date().toISOString(),
    };
    return result;
  }
}

const crawler = new CrawlX();
crawler.addPlugin(new CustomPlugin());
```

## 📡 事件处理

```typescript
const crawler = new CrawlX();

crawler.on('task-start', (task) => {
  console.log(`开始: ${task.url}`);
});

crawler.on('task-complete', (result) => {
  console.log(`完成: ${result.response.url}`);
});

crawler.on('data-extracted', (data, url) => {
  console.log(`从 ${url} 提取的数据:`, data);
});

crawler.on('task-error', (error, task) => {
  console.log(`失败: ${task.url} - ${error.message}`);
});
```

## 🛡️ 错误处理

```typescript
import { CrawlXError, NetworkError, TimeoutError } from 'crawlx';

try {
  const result = await crawler.crawl('https://example.com');
} catch (error) {
  if (error instanceof NetworkError) {
    console.log('网络错误:', error.statusCode);
  } else if (error instanceof TimeoutError) {
    console.log('超时:', error.timeout);
  } else if (error instanceof CrawlXError) {
    console.log('CrawlX错误:', error.code, error.context);
  }
}
```

## 📈 监控统计

```typescript
const stats = crawler.getStats();
console.log('爬虫统计:', {
  isRunning: stats.isRunning,
  results: stats.results,
  scheduler: stats.scheduler,
  httpClient: stats.httpClient,
  plugins: stats.plugins,
});
```

## 🏗️ 架构

```
┌─────────────────┐
│   CrawlX Core   │ ← 主要协调器
├─────────────────┤
│ Plugin Manager  │ ← 可扩展层
├─────────────────┤
│ Task Scheduler  │ ← 并发和队列
├─────────────────┤
│  HTTP Client    │ ← 网络层
├─────────────────┤
│ Parser Engine   │ ← 数据提取
├─────────────────┤
│ Config Manager  │ ← 配置管理
└─────────────────┘
```

## 📚 文档

- [快速开始](./docs/guide/getting-started.md)
- [高级示例](./docs/guide/examples.md)
- [插件开发](./docs/guide/plugins.md)
- [性能调优](./docs/guide/performance.md)
- [API文档](./docs/api/README.md)

## 🤝 贡献

欢迎贡献！请查看我们的[贡献指南](./CONTRIBUTING.md)。

## 📄 许可证

[MIT License](./LICENSE)

## 🆘 支持

- [GitHub Issues](https://github.com/crawlx/crawlx/issues) - 错误报告和功能请求
- [GitHub Discussions](https://github.com/crawlx/crawlx/discussions) - 社区支持
- [文档](./docs/README.md) - 完整的指南和API参考

---

**准备开始爬取了吗？** 查看[快速开始指南](./docs/guide/getting-started.md)开始您的CrawlX之旅！
