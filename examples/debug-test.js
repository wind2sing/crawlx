#!/usr/bin/env node

/**
 * 调试测试
 * 检查CrawlX的基本功能
 */

const { CrawlX } = require('../dist/index.js');

async function debugTest() {
  console.log('🔧 开始调试测试...\n');

  try {
    // 创建最简单的爬虫实例
    const crawler = new CrawlX({
      concurrency: 1,
      timeout: 10000
    });

    console.log('✅ 爬虫实例创建成功');

    // 测试最基本的爬取
    const result = await crawler.crawl('https://httpbin.org/html');
    
    console.log('✅ 爬取成功');
    console.log('  - 状态码:', result.response.statusCode);
    console.log('  - 内容类型:', result.response.headers['content-type']);
    console.log('  - 内容长度:', result.response.body.length || result.response.body.data?.length);
    
    // 检查解析结果
    console.log('  - 解析结果:', result.parsed ? Object.keys(result.parsed) : 'null');
    console.log('  - 完整结果键:', Object.keys(result));

    crawler.destroy();
    
  } catch (error) {
    console.error('❌ 调试测试失败:', error.message);
    console.error('错误堆栈:', error.stack);
  }

  console.log('\n🎉 调试测试完成！');
}

// 运行测试
if (require.main === module) {
  debugTest().catch(console.error);
}

module.exports = { debugTest };
