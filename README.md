# CrawlX

<p align="center">
  <a href='https://travis-ci.com/wind2sing/crawlx'>
  	<img src='https://travis-ci.com/wind2sing/crawlx.svg?branch=master' alt='Build Status'>
  </a>
  <a href='https://crawlx.js.org'>
		<img src='https://img.shields.io/badge/docs-js.org-green' alt='docs'>
	</a>
  <a href='https://www.npmjs.com/package/crawlx'>
    <img alt="npm" src="https://img.shields.io/npm/v/crawlx">
    <img alt="NPM" src="https://img.shields.io/npm/l/crawlx">
  </a>
  <a href="https://codeclimate.com/github/wind2sing/crawlx/maintainability">
    <img src="https://api.codeclimate.com/v1/badges/05376651517a336c20b8/maintainability" />
  </a>
  <a href='https://coveralls.io/github/wind2sing/crawlx?branch=master'>
    <img src='https://coveralls.io/repos/github/wind2sing/crawlx/badge.svg?branch=master' alt='Coverage Status' />
  </a>
</p>

<p align="center">
  <strong>⚡ 轻量级网络爬虫框架，具有强大的插件系统</strong>
</p>

<p align="center">
  一个基于 TypeScript 构建的现代化网络爬虫框架，提供灵活的插件架构、优先级队列管理和强大的数据解析能力
</p>

## 📖 目录

- [项目概述](#-项目概述)
- [核心架构](#-核心架构)
- [快速开始](#-快速开始)
- [项目结构](#-项目结构)
- [核心组件](#-核心组件)
- [插件系统](#-插件系统)
- [API 文档](#-api-文档)
- [示例](#-示例)
- [开发指南](#-开发指南)
- [贡献指南](#-贡献指南)

## 🚀 项目概述

CrawlX 是一个现代化的 Node.js 网络爬虫框架，专为高效、可扩展的网页数据抓取而设计。它采用插件化架构，支持并发控制、优先级队列、自动重试、数据解析等功能。

### 核心特性

- 🎯 **统一解析规则**: 基于 cparse 的强大解析引擎，支持复杂的 CSS 选择器、属性提取、过滤器管道等
- 🔧 **插件化架构**: 模块化设计，易于扩展和自定义
- ⚡ **高性能并发**: 基于优先级队列的任务调度系统
- � **智能链接跟踪**: 基于解析规则的自动链接发现和跟踪
- 🔄 **自动重试**: 可配置的重试机制和错误处理
- 📊 **实时监控**: 任务状态监控和事件系统
- 🛡️ **类型安全**: 完整的 TypeScript 支持
- 🎨 **灵活配置**: 丰富的配置选项和自定义能力

### 🌟 解析规则亮点

- **一套规则，多种用途**: 同一套解析语法可用于数据提取、链接跟踪、条件判断
- **强大的过滤器系统**: 内置数十种过滤器，支持链式调用和自定义扩展
- **作用域分割**: 轻松处理列表数据和复杂嵌套结构
- **属性提取**: 支持 HTML 属性、文本内容、DOM 结构等多种提取方式
- **函数式处理**: 支持自定义函数进行复杂数据转换

- **一套规则，多种用途**: 同一套解析语法可用于数据提取、链接跟踪、条件判断
- **强大的过滤器系统**: 内置数十种过滤器，支持链式调用和自定义扩展
- **作用域分割**: 轻松处理列表数据和复杂嵌套结构
- **属性提取**: 支持 HTML 属性、文本内容、DOM 结构等多种提取方式
- **函数式处理**: 支持自定义函数进行复杂数据转换

## 🏗️ 核心架构

CrawlX 采用分层架构设计，主要由以下核心组件构成：

```
┌─────────────────────────────────────────────────────────────┐
│                        X Interface                          │
│                    (用户交互层)                              │
├─────────────────────────────────────────────────────────────┤
│                       Crawler                               │
│                   (爬虫核心引擎)                             │
├─────────────────────────────────────────────────────────────┤
│    Manager     │    Plugin System    │      Agent          │
│  (任务管理器)   │    (插件系统)       │   (HTTP客户端)       │
├─────────────────────────────────────────────────────────────┤
│  Priority Queue │   Task Processor   │   Response Handler  │
│  (优先级队列)   │   (任务处理器)      │   (响应处理器)       │
└─────────────────────────────────────────────────────────────┘
```

### 架构层次说明

1. **X Interface**: 提供简洁的 API 接口，是用户与框架交互的主要入口
2. **Crawler**: 核心爬虫引擎，协调各个组件的工作
3. **Manager**: 任务管理器，负责任务队列管理和并发控制
4. **Plugin System**: 插件系统，提供可扩展的功能模块
5. **Agent**: HTTP 客户端，基于 Got 库进行网络请求
6. **Priority Queue**: 优先级队列，确保高优先级任务优先执行

## 🚀 快速开始

### 安装

```bash
npm install crawlx
```

### 基础用法

```js
const x = require("crawlx").default;

// 简单的页面抓取
x({
  url: "http://quotes.toscrape.com/",
  parse: [
    "[.quote]",  // CSS 选择器
    {
      author: ".author",
      authorUrl: ".author+a@href",
      text: ".text",
      tags: "[a.tag]",
      type: () => "quote"
    },
    s => ((s["crawled"] = new Date()), s)  // 后处理函数
  ],
  follow: ["[.author+a@href]", followAuthorRule]  // 链接跟踪
}).then(task => {
  console.log(task.parsed);
});

function followAuthorRule(url) {
  return {
    url,
    parse: {
      name: ["h3 | reverse", v => v.toUpperCase()],
      born: ".author-born-date | date"
    },
    callback(task) {
      console.log(task.parsed);
    }
  };
}
```

### 高级配置

```js
const x = require("crawlx").default.create({
  concurrency: 5,        // 并发数
  attempts: 3,           // 重试次数
  delay: 1000,          // 请求延迟
  got: {                // Got 配置
    timeout: 10000,
    headers: {
      'User-Agent': 'CrawlX/1.0'
    }
  }
});
```

## 📁 项目结构

```
crawlx/
├── source/                    # 源代码目录
│   ├── index.ts              # 主入口文件，导出类型定义
│   ├── x.ts                  # X 接口实现
│   ├── crawler.ts            # 爬虫核心引擎
│   ├── manager.ts            # 任务管理器
│   ├── agent.ts              # HTTP 客户端封装
│   ├── task.ts               # 任务相关工具函数
│   ├── plugin.ts             # 插件系统基础
│   ├── utils.ts              # 工具函数
│   ├── plugins/              # 内置插件目录
│   │   ├── index.ts          # 插件导出
│   │   ├── parse.ts          # 数据解析插件
│   │   ├── follow.ts         # 链接跟踪插件
│   │   ├── attempt.ts        # 重试插件
│   │   ├── delay.ts          # 延迟插件
│   │   └── dupFilter.ts      # 去重插件
│   └── priority-queue/       # 优先级队列实现
│       ├── index.ts          # 队列接口
│       ├── pq-base.ts        # 基础队列类
│       └── pq-array.ts       # 数组实现的优先级队列
├── test/                     # 测试文件
├── examples/                 # 示例代码
├── docs/                     # 生成的文档
├── tutorials/                # 教程文档
├── lib/                      # 编译输出目录
├── package.json              # 项目配置
├── tsconfig.json             # TypeScript 配置
├── babel.config.json         # Babel 配置
└── jsdoc.json               # JSDoc 配置
```

## 🔧 核心组件

### 1. X Interface (`source/x.ts`)

X 是框架的主要接口，提供了简洁的 API 来创建和管理爬虫任务。

**主要功能:**
- 任务创建和执行
- 爬虫实例管理
- 插件注册
- Spawner 模式支持

**核心方法:**
```typescript
interface X {
  (task: Task | string, meta?: TaskMeta): Promise<Task>;
  create: (options?: CrawlerOptions) => X;
  crawler: Crawler;
  agent: Agent;
  use: (plugin: Plugin) => Promise<any>;
  spawner: (spawner: Spawner) => any;
}
```

### 2. Crawler (`source/crawler.ts`)

爬虫核心引擎，负责协调各个组件的工作。

**主要职责:**
- 管理插件生命周期
- 协调任务执行流程
- 处理错误和异常
- 维护爬虫状态

**核心特性:**
- 插件系统管理
- 并发控制
- 错误处理机制
- Spawner 支持

### 3. Manager (`source/manager.ts`)

任务管理器，负责任务队列管理和执行调度。

**主要功能:**
- 优先级队列管理
- 并发控制
- 任务生命周期管理
- 事件发布

**工作流程:**
1. 任务入队 (enqueue)
2. 优先级排序
3. 并发控制检查
4. 任务执行
5. 结果处理

### 4. Agent (`source/agent.ts`)

HTTP 客户端封装，基于 Got 库实现。

**主要特性:**
- HTTP/HTTPS 请求
- 自动 Cheerio 集成
- 响应处理
- 错误处理

### 5. Plugin System (`source/plugin.ts`)

插件系统提供了强大的扩展能力。

**插件生命周期:**
- `start`: 插件初始化
- `before`: 任务执行前
- `after`: 任务执行后
- `onError`: 错误处理
- `finish`: 爬虫完成后

**插件优先级:**
插件支持优先级设置，高优先级插件优先执行。
## 🎯 强大的统一解析规则系统

CrawlX 的核心特色是其强大而统一的解析规则编写系统，基于 `cparse` 库实现，提供了极其灵活和直观的数据提取方式。

### 🔍 解析规则语法

#### 1. 基础选择器语法

```js
// 基础文本提取
parse: "title"                    // 提取 <title> 标签的文本内容
parse: ".product-name"            // 提取 class="product-name" 的文本
parse: "#main-content"            // 提取 id="main-content" 的文本
parse: "h1.title"                 // 提取 <h1 class="title"> 的文本
```

#### 2. 属性提取语法

```js
// 属性提取使用 @ 符号
parse: "a@href"                   // 提取链接的 href 属性
parse: "img@src"                  // 提取图片的 src 属性
parse: ".price@data-value"        // 提取 data-value 属性
parse: "meta[name=description]@content"  // 提取 meta 标签的 content 属性

// 特殊属性
parse: ".content@html"            // 提取 HTML 内容
parse: ".content@outerHtml"       // 提取包含标签的 HTML
parse: ".content@text"            // 提取纯文本（默认）
parse: ".content@string"          // 提取直接文本节点
parse: ".content@nextNode"        // 提取下一个节点的值
```

#### 3. 数组提取语法

```js
// 使用 [] 包围选择器提取数组
parse: "[.item]"                  // 提取所有 .item 元素的文本数组
parse: "[ul li a@href]"           // 提取所有链接的 href 数组
parse: "[.tag]"                   // 提取所有标签文本的数组
```

#### 4. 作用域分割语法

```js
// 使用数组的第一个元素作为作用域分割器
parse: [
  "[.product]",                   // 作用域：每个 .product 元素
  {                               // 在每个作用域内提取的数据
    name: ".name",
    price: ".price",
    image: "img@src"
  }
]

// 复杂的嵌套作用域
parse: [
  "[.category]",                  // 外层作用域：每个分类
  {
    title: ".category-title",
    products: [
      "[.product]",               // 内层作用域：每个产品
      {
        name: ".product-name",
        price: ".price"
      }
    ]
  }
]
```

#### 5. 过滤器管道语法

```js
// 使用 | 符号应用过滤器
parse: ".price | int"             // 转换为整数
parse: ".title | trim"            // 去除首尾空格
parse: ".date | date"             // 转换为日期对象
parse: ".size | size"             // 解析文件大小
parse: ".text | slice:0,100"      // 截取前100个字符
parse: ".name | reverse"          // 反转字符串

// 链式过滤器
parse: ".price | trim | int"      // 先去空格，再转整数
parse: ".title | slice:0,50 | trim"  // 先截取，再去空格
```

#### 6. 内置过滤器详解

```js
// 数值转换
"123" | int          // → 123
"12.34" | float      // → 12.34
"true" | bool        // → true

// 字符串处理
"  hello  " | trim   // → "hello"
"hello" | reverse    // → "olleh"
"hello world" | slice:0,5  // → "hello"

// 日期处理
"2023-12-25" | date  // → Date对象
"2023/12/25 10:30" | date  // → Date对象

// 文件大小处理
"1.5MB" | size       // → 1572864 (字节)
"500KB" | size       // → 512000 (字节)
```

#### 7. 函数式过滤器

```js
// 使用数组格式提供自定义函数
parse: [
  ".price",
  text => parseFloat(text.replace('$', '')),  // 移除美元符号并转换
  price => price * 1.1                       // 加10%税费
]

// 复杂的数据处理
parse: [
  "[.item]",
  {
    title: ".title",
    price: [".price", text => text.match(/\d+\.?\d*/)[0], parseFloat]
  },
  items => items.filter(item => item.price > 10)  // 过滤价格大于10的商品
]
```

### 🔧 高级解析模式

#### 1. 条件解析

```js
{
  parse: {
    title: ".title",
    price: ".price | int",
    discount: ".discount"
  },
  parseCheck(res) {
    // 只有状态码为200时才解析
    return res.statusCode === 200;
  }
}
```

#### 2. 动态解析规则

```js
{
  parseCheck(res) {
    // 根据页面内容动态调整解析规则
    if (res.$('.product-grid').length > 0) {
      this.parse = ["[.product]", { name: ".name", price: ".price" }];
    } else {
      this.parse = { title: "h1", content: ".content" };
    }
    return true;
  }
}
```

#### 3. 自定义过滤器注册

```js
const x = require("crawlx").default.create({
  filters: {
    // 自定义过滤器：提取数字
    extractNumber: text => text.match(/\d+/)?.[0] || 0,

    // 自定义过滤器：格式化价格
    formatPrice: (text, currency = '$') => {
      const price = parseFloat(text.replace(/[^\d.]/g, ''));
      return `${currency}${price.toFixed(2)}`;
    },

    // 自定义过滤器：清理HTML
    cleanHtml: html => html.replace(/<[^>]*>/g, '').trim()
  }
});

// 使用自定义过滤器
x({
  url: "https://example.com",
  parse: {
    price: ".price | extractNumber | formatPrice:¥",
    description: ".desc@html | cleanHtml"
  }
});
```

## 🔌 插件系统

CrawlX 的插件系统是其核心特性之一，提供了强大的扩展能力。

### 内置插件

#### 1. Parse Plugin (`source/plugins/parse.ts`)
数据解析插件，是整个解析规则系统的核心实现。

**核心特性:**
- 基于 cparse 库的强大解析引擎
- 支持复杂的 CSS 选择器
- 灵活的过滤器管道系统
- 作用域分割和嵌套解析
- 条件解析和动态规则调整

#### 2. Follow Plugin (`source/plugins/follow.ts`)
链接跟踪插件，基于解析规则自动发现和跟踪页面链接。

**核心特性:**
- 基于解析规则的链接发现
- 支持 Spawner 模式
- 链接过滤和去重
- 递归跟踪和深度控制

**Follow 规则语法:**
```js
// 基础语法：[选择器, 任务生成器, 过滤器]
follow: [
  "[a.next@href]",              // 使用解析规则提取链接
  url => ({                     // 为每个链接生成任务
    url,
    parse: "title",
    callback(task) {
      console.log(task.parsed);
    }
  }),
  urls => urls.filter(url =>    // 过滤链接
    !url.includes('javascript:')
  )
]

// Spawner 模式（自动匹配已注册的 Spawner）
follow: ["[.product-link@href]"]

// 多个跟踪规则
follows: [
  ["[.next@href]", nextPageHandler],
  ["[.category@href]", categoryHandler],
  ["[.product@href]", productHandler]
]

// 复杂的链接提取和处理
follow: [
  [".pagination a@href", ".product-link@href"],  // 多种链接类型
  url => {
    if (url.includes('/page/')) {
      return { url, parse: productListRule };
    } else {
      return { url, parse: productDetailRule };
    }
  },
  urls => urls.slice(0, 50)     // 限制链接数量
]
```

#### 3. Attempt Plugin (`source/plugins/attempt.ts`)
重试插件，提供智能重试机制。

**特性:**
- 可配置重试次数
- 状态码过滤
- 自定义重试逻辑
- 指数退避

**配置示例:**
```js
{
  attempts: [3, [404, 500], ({ err, shouldRetry, task }) => {
    console.log(`Retry ${task.url}: ${shouldRetry}`);
  }]
}
```

#### 4. Delay Plugin (`source/plugins/delay.ts`)
延迟插件，控制请求频率。

**特性:**
- 固定延迟
- 随机延迟
- 任务级别配置
- 全局配置

#### 5. DupFilter Plugin (`source/plugins/dupFilter.ts`)
去重插件，避免重复请求。

**特性:**
- URL 去重
- 自定义去重逻辑
- 内存存储
- 持久化支持

### 自定义插件

创建自定义插件非常简单：

```js
const myPlugin = {
  name: 'my-plugin',
  priority: 100,

  start(crawler) {
    console.log('Plugin started');
  },

  before(task, crawler) {
    console.log(`Processing: ${task.url}`);
  },

  after(task, crawler) {
    console.log(`Completed: ${task.url}`);
  },

  onError(error, task, crawler) {
    console.log(`Error: ${error.message}`);
  }
};

x.use(myPlugin);
```
## 📚 API 文档

### X Interface

#### `x(task, meta?): Promise<Task>`
执行单个爬虫任务。

**参数:**
- `task`: 任务对象或 URL 字符串
- `meta`: 可选的元数据对象

**返回:** Promise<Task>

#### `x.create(options?): X`
创建新的爬虫实例。

**参数:**
- `options`: 爬虫配置选项

**返回:** 新的 X 实例

#### `x.use(plugin): Promise<any>`
注册插件。

**参数:**
- `plugin`: 插件对象

#### `x.spawner(spawner): any`
注册 Spawner。

**参数:**
- `spawner`: Spawner 配置对象

### Task 对象

```typescript
interface Task {
  url: string;                    // 目标 URL
  callback?: Function;            // 回调函数
  meta?: TaskMeta;               // 元数据
  priority?: number;             // 优先级
  parse?: any;                   // 解析规则
  follow?: FollowRule;           // 跟踪规则
  attempts?: AttempRule;         // 重试规则
  delay?: number;                // 延迟时间
  // ... Got 选项
}
```

### CrawlerOptions

```typescript
interface CrawlerOptions {
  concurrency?: number;          // 并发数 (默认: 5)
  got?: AgentOptions;           // Got 配置
  cheerio?: CheerioOptions;     // Cheerio 配置
  attempts?: AttempRule;        // 重试配置
  delay?: number;               // 延迟配置
  filters?: object;             // 解析过滤器
}
```

## 💡 解析规则实战示例

### 1. 新闻网站爬取

```js
const x = require("crawlx").default;

// 爬取 Hacker News 首页
x({
  url: "https://news.ycombinator.com/",
  parse: [
    "[.athing]",                    // 作用域：每条新闻
    {
      id: "@id",                    // 新闻ID
      title: ".titleline > a",      // 标题
      url: ".titleline > a@href",   // 链接
      domain: [".titleline .sitestr", text => text || ""],
      score: [".score", text => parseInt(text) || 0],
      comments: [".subtext a:last-child", text => {
        const match = text.match(/(\d+)\s*comment/);
        return match ? parseInt(match[1]) : 0;
      }],
      time: ".age@title | date"     // 发布时间
    },
    items => items.filter(item => item.score > 10)  // 只保留10分以上的新闻
  ],
  follow: [
    "[.morelink@href]",             // 跟踪"更多"链接
    url => ({
      url,
      parse: /* 同样的解析规则 */
    })
  ]
}).then(task => {
  console.log(`爬取到 ${task.parsed.length} 条新闻`);
  task.parsed.forEach(news => {
    console.log(`${news.title} (${news.score}分)`);
  });
});
```

### 2. 电商产品数据爬取

```js
const x = require("crawlx").default.create({
  concurrency: 3,
  delay: 2000,
  attempts: 2,
  filters: {
    // 自定义价格解析过滤器
    parsePrice: text => {
      const match = text.match(/[\d,]+\.?\d*/);
      return match ? parseFloat(match[0].replace(',', '')) : 0;
    },
    // 评分解析
    parseRating: text => {
      const match = text.match(/(\d+\.?\d*)/);
      return match ? parseFloat(match[1]) : 0;
    }
  }
});

x({
  url: "https://example-shop.com/products",
  parse: [
    "[.product-item]",              // 作用域：每个产品
    {
      id: "@data-product-id",
      name: ".product-name | trim",
      price: ".price | parsePrice",
      originalPrice: ".original-price | parsePrice",
      discount: [".discount", text => {
        const match = text.match(/(\d+)%/);
        return match ? parseInt(match[1]) : 0;
      }],
      image: ".product-img@src",
      rating: ".rating-stars@data-rating | parseRating",
      reviewCount: [".review-count", text => {
        const match = text.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      }],
      inStock: [".stock-status", text => !text.includes('缺货')],
      tags: "[.tag]",               // 产品标签数组
      specs: [
        "[.spec-item]",             // 规格参数
        {
          name: ".spec-name",
          value: ".spec-value"
        }
      ]
    },
    products => products
      .filter(p => p.inStock && p.price > 0)  // 过滤有库存且有价格的产品
      .map(p => ({
        ...p,
        crawledAt: new Date(),
        priceRange: p.price > 1000 ? 'premium' :
                   p.price > 500 ? 'mid' : 'budget',
        hasDiscount: p.originalPrice > p.price
      }))
  ],
  follow: [
    "[.pagination] a.next@href",    // 翻页
    url => ({
      url,
      parse: /* 同样的解析规则 */
    })
  ]
});
```

### 3. 博客文章内容爬取

```js
// 复杂的文章内容解析
x({
  url: "https://example-blog.com/article/123",
  parse: {
    // 基础信息
    title: "h1.article-title | trim",
    author: ".author-name",
    publishDate: ".publish-date | date",
    readTime: [".read-time", text => {
      const match = text.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    }],

    // 文章内容
    content: ".article-content@html",
    summary: [".article-summary", text => text || ""],

    // 图片处理
    images: [
      "[.article-content img@src]",
      urls => urls.map(url =>
        url.startsWith('http') ? url : `https://example-blog.com${url}`
      )
    ],

    // 标签和分类
    tags: "[.tag-list .tag]",
    category: ".category-name",

    // 互动数据
    likes: ".like-count | int",
    comments: [
      "[.comment]",                 // 评论列表
      {
        author: ".comment-author",
        content: ".comment-content",
        time: ".comment-time | date",
        likes: ".comment-likes | int"
      }
    ],

    // 相关文章
    relatedArticles: [
      "[.related-article]",
      {
        title: ".title",
        url: "a@href",
        summary: ".summary"
      }
    ]
  },

  // 条件解析检查
  parseCheck(res) {
    // 确保文章存在且不是404页面
    return res.statusCode === 200 &&
           res.$('.article-content').length > 0;
  },

  callback(task) {
    const article = task.parsed;
    console.log(`文章: ${article.title}`);
    console.log(`作者: ${article.author}`);
    console.log(`发布时间: ${article.publishDate}`);
    console.log(`阅读时间: ${article.readTime}分钟`);
    console.log(`标签: ${article.tags.join(', ')}`);
    console.log(`点赞数: ${article.likes}`);
    console.log(`评论数: ${article.comments.length}`);
  }
});
```

### 4. Spawner 模式高级应用

```js
const x = require("crawlx").default;

// 注册多个 Spawner 处理不同类型的URL
x.spawner({
  regex: /\/product\/\d+/,
  spawn: (url, meta) => ({
    url,
    parse: {
      title: "h1.product-title | trim",
      price: ".price | parsePrice",
      description: ".description@html",
      images: "[.product-gallery img@src]",
      specs: [
        "[.spec-table tr]",
        {
          name: ".spec-name",
          value: ".spec-value"
        }
      ],
      reviews: [
        "[.review]",
        {
          rating: ".rating@data-rating | int",
          comment: ".review-text",
          author: ".reviewer-name"
        }
      ]
    },
    callback(task) {
      console.log(`产品: ${task.parsed.title} - ¥${task.parsed.price}`);
    }
  })
});

// 分类页面 Spawner
x.spawner({
  regex: /\/category\/[\w-]+/,
  spawn: (url, meta) => ({
    url,
    parse: [
      "[.product-item]",
      {
        name: ".name",
        url: "a@href",
        price: ".price | parsePrice"
      }
    ],
    follow: [
      "[.product-item a@href]",     // 自动跟踪产品详情页
      "[.pagination .next@href]"    // 自动翻页
    ]
  })
});

// 使用 Spawner 模式批量处理
const productUrls = [
  "https://example.com/product/12345",
  "https://example.com/product/67890",
  "https://example.com/category/electronics"
];

productUrls.forEach(url => x(url));
```

### 5. 复杂数据结构解析

```js
// 解析复杂的嵌套数据结构
x({
  url: "https://example-forum.com/thread/123",
  parse: {
    // 主题信息
    thread: {
      title: ".thread-title | trim",
      author: ".thread-author",
      createTime: ".create-time | date",
      viewCount: ".view-count | int",
      replyCount: ".reply-count | int"
    },

    // 帖子列表（包含楼主和回复）
    posts: [
      "[.post]",
      {
        floor: ".floor-number | int",
        author: {
          name: ".author-name",
          avatar: ".author-avatar@src",
          level: ".author-level | int",
          joinDate: ".join-date | date"
        },
        content: {
          text: ".post-content@text",
          html: ".post-content@html",
          images: "[.post-content img@src]",
          quotes: [
            "[.quote]",
            {
              originalAuthor: ".quote-author",
              originalContent: ".quote-content"
            }
          ]
        },
        meta: {
          postTime: ".post-time | date",
          likes: ".like-count | int",
          ip: ".ip-info",
          device: ".device-info"
        }
      }
    ],

    // 分页信息
    pagination: {
      currentPage: ".current-page | int",
      totalPages: ".total-pages | int",
      nextPageUrl: ".next-page@href"
    }
  },

  // 跟踪下一页
  follow: [
    "[.next-page@href]",
    url => ({
      url,
      parse: /* 同样的解析规则 */
    })
  ]
});
```

### 6. 实时数据监控

```js
// 股票价格监控示例
const monitorStock = (symbol) => {
  const x = require("crawlx").default.create({
    delay: 5000,  // 5秒间隔
    filters: {
      parsePrice: text => parseFloat(text.replace(/[^\d.-]/g, '')),
      parsePercent: text => {
        const match = text.match(/([+-]?\d+\.?\d*)%/);
        return match ? parseFloat(match[1]) : 0;
      }
    }
  });

  const crawlStock = () => {
    x({
      url: `https://finance.example.com/stock/${symbol}`,
      parse: {
        symbol: ".stock-symbol",
        name: ".stock-name",
        price: ".current-price | parsePrice",
        change: ".price-change | parsePrice",
        changePercent: ".change-percent | parsePercent",
        volume: ".volume | int",
        marketCap: ".market-cap",
        timestamp: () => new Date()
      },
      callback(task) {
        const stock = task.parsed;
        console.log(`${stock.symbol}: ¥${stock.price} (${stock.changePercent > 0 ? '+' : ''}${stock.changePercent}%)`);

        // 价格预警
        if (Math.abs(stock.changePercent) > 5) {
          console.log(`⚠️  ${stock.symbol} 价格波动超过5%！`);
        }
      }
    }).then(() => {
      // 5秒后继续监控
      setTimeout(crawlStock, 5000);
    });
  };

  crawlStock();
};

// 开始监控
monitorStock('AAPL');
```
## 🛠️ 开发指南

### 环境要求

- Node.js >= 12.0.0
- TypeScript >= 4.0.0
- npm 或 yarn

### 开发设置

```bash
# 克隆项目
git clone https://github.com/wind2sing/crawlx.git
cd crawlx

# 安装依赖
npm install

# 类型检查
npm run type-check

# 构建项目
npm run build

# 运行测试
npm test

# 生成文档
npm run docs
```

### 项目脚本

```json
{
  "type-check": "tsc --noEmit",
  "type-check:watch": "npm run type-check -- --watch",
  "build": "npm run build:types && npm run build:js",
  "build:types": "tsc --emitDeclarationOnly",
  "build:js": "babel source --out-dir lib --extensions \".ts,.tsx\" --source-maps inline",
  "docs": "jsdoc -c jsdoc.json",
  "test": "jest"
}
```

### 技术栈

- **TypeScript**: 类型安全的 JavaScript 超集
- **Got**: 现代化的 HTTP 请求库
- **Cheerio**: 服务端 jQuery 实现
- **EventEmitter3**: 高性能事件发射器
- **cparse**: CSS 选择器解析库
- **Jest**: JavaScript 测试框架
- **Babel**: JavaScript 编译器
- **JSDoc**: 文档生成工具

### 构建流程

1. **TypeScript 编译**: 生成类型定义文件
2. **Babel 转换**: 将 TypeScript 代码转换为 JavaScript
3. **测试执行**: 运行单元测试和集成测试
4. **文档生成**: 生成 API 文档

### 测试策略

- **单元测试**: 测试各个组件的独立功能
- **集成测试**: 测试组件间的协作
- **插件测试**: 测试各个插件的功能
- **端到端测试**: 测试完整的爬虫流程

## 🤝 贡献指南

### 贡献流程

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 代码规范

- 使用 TypeScript 编写代码
- 遵循现有的代码风格
- 添加适当的类型注解
- 编写单元测试
- 更新相关文档

### 提交规范

使用语义化提交信息：

- `feat`: 新功能
- `fix`: 错误修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

### 问题报告

报告问题时请包含：

- 详细的问题描述
- 重现步骤
- 期望行为
- 实际行为
- 环境信息 (Node.js 版本、操作系统等)
- 相关代码示例

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🔗 相关链接

- **文档**: [crawlx.js.org](https://crawlx.js.org/)
- **NPM**: [npmjs.com/package/crawlx](https://www.npmjs.com/package/crawlx)
- **GitHub**: [github.com/wind2sing/crawlx](https://github.com/wind2sing/crawlx)
- **示例**: [crawlx/examples](https://github.com/wind2sing/crawlx/tree/master/examples)
- **教程**: [crawlx/tutorials](https://github.com/wind2sing/crawlx/tree/master/tutorials)

## 🙏 致谢

感谢所有为 CrawlX 项目做出贡献的开发者和社区成员。

特别感谢以下开源项目：

- [Got](https://github.com/sindresorhus/got) - 强大的 HTTP 请求库
- [Cheerio](https://github.com/cheeriojs/cheerio) - 服务端 jQuery 实现
- [cparse](https://github.com/wind2sing/cparse) - CSS 选择器解析库

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/wind2sing">wind2sing</a>
</p>
