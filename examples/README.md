# CrawlX Examples

这个文件夹包含了CrawlX库的各种示例和测试文件，帮助开发者理解和使用CrawlX的功能。

## 📁 文件分类

### 🚀 基础使用示例

#### `quick-test.js`
- **描述**: 快速功能测试
- **功能**: 快速验证CrawlX核心功能是否正常
- **测试内容**:
  - HTML解析测试
  - JSON解析测试
  - 过滤器测试
  - 简洁的结果报告

#### `basic-usage.ts`
- **描述**: TypeScript版本的基础使用示例
- **功能**: 展示CrawlX的基本API使用方法
- **包含内容**:
  - 创建爬虫实例
  - 基本爬取操作
  - 数据解析示例
  - quickCrawl快速API使用

#### `basic-crawl.js`
- **描述**: JavaScript版本的基础爬取示例
- **功能**: 演示最简单的爬取操作
- **包含内容**:
  - quickCrawl API使用
  - CrawlX类的基本使用
  - 简单的解析规则

### 🔧 功能测试文件

#### `test-parsing.js`
- **描述**: 解析功能测试
- **功能**: 验证CrawlX的HTML和JSON解析能力
- **测试内容**:
  - 基本HTML解析
  - JSON API解析
  - 属性提取
  - 复杂选择器

#### `test-fixes.js`
- **描述**: 修复后功能测试
- **功能**: 验证核心问题修复后的功能状态
- **测试内容**:
  - HTML解析功能
  - JSON解析功能
  - 复杂解析规则
  - 过滤器链

#### `test-json.js`
- **描述**: JSON解析专项测试
- **功能**: 专门测试JSON内容的解析能力
- **测试内容**:
  - JSON API解析
  - JSON字段提取
  - 不同JSON端点测试

#### `final-test.js`
- **描述**: 最终功能验证测试
- **功能**: 全面验证CrawlX的所有核心功能
- **测试内容**:
  - HTML解析功能
  - JSON解析功能
  - 复杂解析规则
  - 过滤器链
  - 错误处理
  - 功能完整度评估

### 🔍 调试工具

#### `debug-parser.js`
- **描述**: 解析器调试工具
- **功能**: 测试解析器的各个组件
- **调试内容**:
  - 基本选择器测试
  - 属性解析测试
  - 对象解析测试
  - 过滤器测试

#### `debug-query.js`
- **描述**: 查询解析器调试工具
- **功能**: 测试查询字符串的解析逻辑
- **调试内容**:
  - 选择器解析
  - 属性提取解析
  - 数组选择器解析
  - 过滤器链解析

#### `debug-html.js`
- **描述**: HTML内容调试工具
- **功能**: 检查实际获取的HTML内容
- **调试内容**:
  - HTML内容获取
  - 内容类型检查
  - 标签匹配测试

#### `debug-crawl.js`
- **描述**: 爬取过程调试工具
- **功能**: 调试完整的爬取流程
- **调试内容**:
  - 爬虫创建
  - 响应处理
  - Cheerio实例检查
  - 解析配置验证

#### `debug-plugins.js`
- **描述**: 插件系统调试工具
- **功能**: 检查插件的注册和执行状态
- **调试内容**:
  - 插件列表
  - 插件状态
  - 插件执行流程

#### `debug-quickcrawl.js`
- **描述**: quickCrawl函数调试工具
- **功能**: 对比直接调用和quickCrawl的差异
- **调试内容**:
  - 直接CrawlX调用
  - quickCrawl调用
  - 参数传递验证

#### `debug-test.js`
- **描述**: 基础调试测试
- **功能**: 检查CrawlX的基本功能
- **调试内容**:
  - 爬虫实例创建
  - 基本爬取操作
  - 响应状态检查

### 🎯 实际应用示例

#### `working-example.js`
- **描述**: 实际工作示例
- **功能**: 展示CrawlX在真实场景中的应用
- **示例内容**:
  - 爬取GitHub首页
  - JSON API数据获取
  - 复杂爬取配置
  - 属性提取示例

### 🛠️ 工具文件

#### `run-examples.js`
- **描述**: 示例运行器工具
- **功能**: 提供便捷的方式运行所有示例和测试
- **特性**:
  - 交互式菜单选择
  - 命令行模式支持
  - 分类运行示例
  - 错误处理和状态显示

#### `README.md`
- **描述**: 示例文档说明
- **功能**: 详细介绍所有示例文件的用途和使用方法
- **内容**:
  - 文件分类和说明
  - 使用指南
  - 开发建议
  - 历史记录

## 🚀 快速开始

### 快速验证 (推荐新手)
```bash
# 快速测试核心功能 (30秒内完成)
node examples/quick-test.js
```

### 使用示例运行器 (推荐)
```bash
# 交互式菜单
node examples/run-examples.js

# 命令行模式
node examples/run-examples.js basic    # 运行基础示例
node examples/run-examples.js test     # 运行功能测试
node examples/run-examples.js debug    # 运行调试工具
node examples/run-examples.js all      # 运行所有示例
node examples/run-examples.js final    # 运行最终测试
```

### 直接运行单个示例
```bash
# 基础爬取示例
node examples/basic-crawl.js

# 解析功能测试
node examples/test-parsing.js

# 最终功能测试
node examples/final-test.js
```

### 运行调试工具
```bash
# 调试解析器
node examples/debug-parser.js

# 调试查询解析
node examples/debug-query.js

# 调试插件系统
node examples/debug-plugins.js
```

## 📋 测试结果说明

### 成功指标
- ✅ 表示功能正常工作
- ❌ 表示功能存在问题
- ⚠️ 表示功能部分工作

### 常见测试场景
1. **HTML解析**: 测试CSS选择器和文本提取
2. **JSON解析**: 测试JSON API数据获取
3. **过滤器**: 测试数据处理和转换
4. **错误处理**: 测试异常情况的处理

## 🔧 开发建议

### 添加新示例
1. 在examples文件夹创建新的.js文件
2. 使用统一的错误处理模式
3. 添加详细的控制台输出
4. 更新此README文档

### 调试问题
1. 先运行`debug-test.js`检查基础功能
2. 使用相应的debug工具定位具体问题
3. 查看控制台日志了解详细信息
4. 参考working-example.js了解正确用法

## 📚 相关文档

- [CrawlX主文档](../README.md)
- [API文档](../docs/)
- [配置指南](../docs/guide/)
- [插件开发](../docs/plugins/)

## 🔍 文件详细说明

### 核心功能验证文件

| 文件名 | 主要功能 | 测试重点 | 运行时间 |
|--------|----------|----------|----------|
| `final-test.js` | 全面功能测试 | 所有核心功能 | ~30秒 |
| `test-fixes.js` | 修复验证 | 修复后的功能 | ~20秒 |
| `working-example.js` | 实际应用 | 真实场景使用 | ~40秒 |

### 专项测试文件

| 文件名 | 测试对象 | 验证内容 | 适用场景 |
|--------|----------|----------|----------|
| `test-parsing.js` | 解析功能 | HTML/JSON解析 | 解析问题调试 |
| `test-json.js` | JSON解析 | JSON API处理 | JSON相关问题 |
| `debug-parser.js` | 解析器组件 | 选择器和过滤器 | 解析器开发 |

### 调试工具文件

| 文件名 | 调试目标 | 输出信息 | 使用时机 |
|--------|----------|----------|----------|
| `debug-plugins.js` | 插件系统 | 插件状态和执行 | 插件问题排查 |
| `debug-quickcrawl.js` | quickCrawl函数 | 参数传递验证 | API问题调试 |
| `debug-crawl.js` | 爬取流程 | 完整爬取过程 | 流程问题分析 |

## 🛠️ 开发历史记录

### 问题修复过程
1. **RetryPlugin错误修复** - `debug-plugins.js`记录了插件系统问题
2. **解析器重构** - `debug-parser.js`验证了解析器修复
3. **JSON支持添加** - `test-json.js`验证了JSON解析功能
4. **quickCrawl修复** - `debug-quickcrawl.js`对比了修复前后的差异

### 功能验证里程碑
- **基础功能验证**: `basic-crawl.js`
- **解析功能验证**: `test-parsing.js`
- **修复功能验证**: `test-fixes.js`
- **最终功能验证**: `final-test.js`

## 📊 测试覆盖范围

### HTML解析测试
- ✅ CSS选择器 (`h1`, `p`, `div`)
- ✅ 属性提取 (`@href`, `@src`)
- ✅ 数组选择器 (`[p]`, `[a]`)
- ✅ 过滤器链 (`| count`, `| text | trim`)

### JSON解析测试
- ✅ JSON API响应处理
- ✅ 虚拟DOM创建
- ✅ JSON字段提取
- ✅ 内容类型检测

### 错误处理测试
- ✅ 网络错误处理
- ✅ 解析错误处理
- ✅ 重试机制验证
- ✅ 超时处理

## 🎯 使用建议

### 新手开发者
1. 从`basic-crawl.js`开始了解基础用法
2. 运行`final-test.js`查看完整功能演示
3. 参考`working-example.js`学习实际应用

### 问题排查
1. 使用对应的debug工具定位问题
2. 查看测试文件了解预期行为
3. 对比working-example了解正确用法

### 功能开发
1. 参考现有示例的代码结构
2. 添加相应的测试验证
3. 更新README文档

## 📋 文件清单

### 核心示例文件 (17个)
```
examples/
├── README.md                 # 📖 本文档
├── quick-test.js            # ⚡ 快速功能验证
├── run-examples.js          # 🛠️ 示例运行器
├── basic-usage.ts           # 📚 TypeScript基础示例
├── basic-crawl.js           # 📚 JavaScript基础示例
├── working-example.js       # 🎯 实际应用示例
├── test-parsing.js          # 🧪 解析功能测试
├── test-fixes.js            # 🧪 修复验证测试
├── test-json.js             # 🧪 JSON解析测试
├── final-test.js            # 🧪 最终功能测试
├── debug-test.js            # 🔍 基础调试
├── debug-parser.js          # 🔍 解析器调试
├── debug-query.js           # 🔍 查询调试
├── debug-html.js            # 🔍 HTML调试
├── debug-crawl.js           # 🔍 爬取调试
├── debug-plugins.js         # 🔍 插件调试
└── debug-quickcrawl.js      # 🔍 quickCrawl调试
```

## 🎯 推荐使用流程

### 对于新用户
1. **快速验证**: `node examples/quick-test.js`
2. **学习基础**: `node examples/basic-crawl.js`
3. **查看实例**: `node examples/working-example.js`

### 对于开发者
1. **功能测试**: `node examples/run-examples.js test`
2. **问题调试**: `node examples/run-examples.js debug`
3. **全面验证**: `node examples/final-test.js`

### 对于AI助手
1. **理解功能**: 阅读本README和示例代码
2. **验证状态**: 运行quick-test.js检查功能
3. **深入调试**: 使用相应的debug工具
4. **参考历史**: 查看修复过程和解决方案

---

*这些示例文件记录了CrawlX从问题发现到功能完善的完整开发过程，为后续的AI开发者提供了宝贵的调试和验证经验。通过这些文件，可以快速了解CrawlX的功能状态、使用方法和潜在问题。*
