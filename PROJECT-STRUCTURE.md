# CrawlX 2.0 项目结构

## 📁 目录结构

```
crawlx/
├── src/                    # 源代码
│   ├── core/              # 核心模块
│   │   ├── crawlx.ts      # 主爬虫类
│   │   ├── crawlx.test.ts # 核心测试
│   │   └── plugin.ts      # 插件基类和管理器
│   ├── parser/            # 解析引擎
│   │   ├── parser.ts      # 主解析器
│   │   ├── filters.ts     # 内置过滤器
│   │   ├── cheerio-extensions.ts # Cheerio扩展
│   │   └── parser.test.ts # 解析器测试
│   ├── http/              # HTTP客户端
│   │   ├── http-client.ts # HTTP客户端接口
│   │   ├── lightweight-client.ts # 轻量级客户端
│   │   ├── high-performance-client.ts # 高性能客户端
│   │   └── http-client.test.ts # HTTP测试
│   ├── scheduler/         # 任务调度
│   │   ├── task-scheduler.ts # 任务调度器
│   │   ├── priority-queue.ts # 优先级队列
│   │   └── scheduler.test.ts # 调度器测试
│   ├── plugins/           # 内置插件
│   │   ├── parse-plugin.ts # 解析插件
│   │   ├── follow-plugin.ts # 跟踪插件
│   │   ├── retry-plugin.ts # 重试插件
│   │   ├── delay-plugin.ts # 延迟插件
│   │   ├── duplicate-filter-plugin.ts # 去重插件
│   │   ├── rate-limit-plugin.ts # 限速插件
│   │   └── plugins.test.ts # 插件测试
│   ├── config/            # 配置管理
│   │   ├── config.ts      # 配置类
│   │   ├── config-factory.ts # 配置工厂
│   │   ├── config-presets.ts # 配置预设
│   │   ├── schema.ts      # 配置Schema
│   │   └── config.test.ts # 配置测试
│   ├── utils/             # 工具函数
│   │   ├── factory.ts     # 工厂函数
│   │   ├── logger.ts      # 日志系统
│   │   ├── errors.ts      # 错误类型
│   │   ├── url-utils.ts   # URL工具
│   │   └── utils.test.ts  # 工具测试
│   ├── types/             # 类型定义
│   │   └── index.ts       # 主要类型
│   └── index.ts           # 主入口文件
├── tests/                 # 测试文件
│   ├── helpers/           # 测试工具
│   │   └── test-utils.ts  # 测试辅助函数
│   ├── integration/       # 集成测试
│   │   └── crawlx.integration.test.ts
│   ├── performance/       # 性能测试
│   │   └── performance.test.ts
│   └── e2e/              # 端到端测试
│       └── end-to-end.test.ts
├── docs/                  # 文档
│   ├── api/              # API文档
│   │   └── README.md     # API参考
│   ├── guide/            # 使用指南
│   │   ├── getting-started.md # 快速开始
│   │   ├── examples.md   # 高级示例
│   │   ├── plugins.md    # 插件开发
│   │   └── performance.md # 性能调优
│   └── README.md         # 文档索引
├── examples/              # 示例代码
│   └── basic-usage.ts    # 基础使用示例
├── scripts/               # 构建脚本
│   ├── run-tests.ts      # 测试运行器
│   └── test-build.ts     # 构建测试
├── package.json           # 包配置
├── tsconfig.json         # TypeScript配置
├── vitest.config.ts      # 测试配置
├── tsup.config.ts        # 构建配置
├── CHANGELOG.md          # 变更日志
└── README.md             # 项目说明
```

## 🏗️ 架构设计

### 核心模块 (src/core/)
- **CrawlX**: 主爬虫类，协调所有组件
- **Plugin**: 插件基类和管理器，提供扩展能力

### 解析引擎 (src/parser/)
- **Parser**: CSS选择器解析器
- **Filters**: 内置过滤器（trim、number、date等）
- **CheerioExtensions**: Cheerio功能扩展

### HTTP客户端 (src/http/)
- **HttpClient**: 客户端接口
- **LightweightClient**: 轻量级实现
- **HighPerformanceClient**: 高性能实现

### 任务调度 (src/scheduler/)
- **TaskScheduler**: 任务调度器
- **PriorityQueue**: 优先级队列实现

### 插件系统 (src/plugins/)
- **ParsePlugin**: 数据解析
- **FollowPlugin**: 链接跟踪
- **RetryPlugin**: 重试机制
- **DelayPlugin**: 请求延迟
- **DuplicateFilterPlugin**: URL去重
- **RateLimitPlugin**: 速率限制

### 配置管理 (src/config/)
- **Config**: 配置类
- **ConfigFactory**: 配置工厂
- **ConfigPresets**: 预设配置
- **Schema**: 配置验证

### 工具函数 (src/utils/)
- **Factory**: 工厂函数
- **Logger**: 日志系统
- **Errors**: 错误类型
- **UrlUtils**: URL工具

## 🔧 技术栈

- **语言**: TypeScript 5.3+
- **运行时**: Node.js 16+
- **解析**: Cheerio (HTML解析)
- **HTTP**: Undici (高性能HTTP客户端)
- **测试**: Vitest (单元测试和集成测试)
- **构建**: tsup (现代化构建工具)
- **代码质量**: ESLint + Prettier

## 📦 构建输出

```
dist/
├── index.js          # CommonJS入口
├── index.mjs         # ESM入口
├── index.d.ts        # TypeScript类型定义
└── ...               # 其他构建文件
```

## 🧪 测试策略

- **单元测试**: 每个模块的 `.test.ts` 文件
- **集成测试**: `tests/integration/` 目录
- **性能测试**: `tests/performance/` 目录
- **端到端测试**: `tests/e2e/` 目录
- **测试工具**: `tests/helpers/` 目录

## 📚 文档结构

- **API文档**: 完整的API参考
- **使用指南**: 从入门到高级的使用指南
- **示例代码**: 实际使用场景的示例
- **开发指南**: 插件开发和贡献指南

## 🚀 开发工作流

1. **开发**: `npm run dev` - 运行示例
2. **测试**: `npm run test` - 运行所有测试
3. **构建**: `npm run build` - 构建生产版本
4. **类型检查**: `npm run typecheck` - TypeScript类型检查
5. **代码格式**: `npm run format` - 代码格式化
6. **代码检查**: `npm run lint` - ESLint检查

这个项目结构体现了现代TypeScript项目的最佳实践，包括清晰的模块划分、完整的测试覆盖、详细的文档和现代化的工具链。
