#!/usr/bin/env node

/**
 * 调试解析功能
 * 检查CrawlX的解析器
 */

const { CrawlX } = require('../dist/index.js');

async function debugParsing() {
  console.log('🔧 开始调试解析功能...\n');

  try {
    // 创建爬虫实例
    const crawler = new CrawlX({
      concurrency: 1,
      timeout: 10000
    });

    console.log('✅ 爬虫实例创建成功');

    // 测试带解析规则的爬取
    const result = await crawler.crawl('https://httpbin.org/html', {
      parse: {
        title: 'title',
        heading: 'h1'
      }
    });
    
    console.log('✅ 带解析规则的爬取成功');
    console.log('  - 状态码:', result.response.statusCode);
    console.log('  - 解析结果:', result.parsed);
    console.log('  - 解析结果类型:', typeof result.parsed);
    
    // 检查任务配置
    console.log('  - 任务解析配置:', result.task.parse);

    crawler.destroy();
    
  } catch (error) {
    console.error('❌ 调试解析测试失败:', error.message);
    console.error('错误堆栈:', error.stack);
  }

  console.log('\n🎉 调试解析测试完成！');
}

// 运行测试
if (require.main === module) {
  debugParsing().catch(console.error);
}

module.exports = { debugParsing };
