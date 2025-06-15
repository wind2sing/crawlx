#!/usr/bin/env node

/**
 * 调试爬取过程
 */

const { CrawlX } = require('../dist/index.js');

async function debugCrawl() {
  console.log('🔧 调试爬取过程...\n');

  try {
    const crawler = new CrawlX({
      concurrency: 1,
      timeout: 10000
    });

    console.log('✅ 爬虫创建成功');

    // 测试最简单的解析
    const result = await crawler.crawl('https://httpbin.org/html', {
      parse: {
        heading: 'h1'
      }
    });
    
    console.log('✅ 爬取完成');
    console.log('  - 响应状态:', result.response.statusCode);
    console.log('  - 响应类型:', result.response.headers['content-type']);
    console.log('  - 有Cheerio实例:', !!result.response.$);
    console.log('  - 解析配置:', result.task.parse);
    console.log('  - 解析结果:', result.parsed);
    console.log('  - 解析结果类型:', typeof result.parsed);
    
    // 如果有Cheerio实例，手动测试
    if (result.response.$) {
      const $ = result.response.$;
      console.log('  - 手动h1测试:', $('h1').text());
      console.log('  - 手动h1长度:', $('h1').length);
    }

    crawler.destroy();
    
  } catch (error) {
    console.error('❌ 调试失败:', error.message);
    console.error('错误堆栈:', error.stack);
  }

  console.log('\n🎉 调试完成！');
}

// 运行调试
if (require.main === module) {
  debugCrawl().catch(console.error);
}

module.exports = { debugCrawl };
