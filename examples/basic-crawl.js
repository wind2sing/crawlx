#!/usr/bin/env node

/**
 * 基本爬取示例
 * 测试CrawlX是否能正常工作
 */

const { CrawlX, quickCrawl } = require('../dist/index.js');

async function testBasicCrawl() {
  console.log('🚀 开始测试基本爬取功能...\n');

  try {
    // 测试1: 使用quickCrawl快速API
    console.log('📋 测试1: 使用quickCrawl API');
    const quickResult = await quickCrawl('https://httpbin.org/html', {
      parse: {
        title: 'title',
        headings: 'h1'
      }
    });
    
    console.log('✅ quickCrawl结果:', JSON.stringify(quickResult, null, 2));
    
  } catch (error) {
    console.error('❌ quickCrawl测试失败:', error.message);
  }

  try {
    // 测试2: 使用CrawlX类
    console.log('\n📋 测试2: 使用CrawlX类');
    const crawler = new CrawlX({
      concurrency: 1,
      timeout: 10000
    });

    const result = await crawler.crawl('https://httpbin.org/json', {
      parse: {
        data: 'body'
      }
    });

    console.log('✅ CrawlX类结果:', JSON.stringify(result, null, 2));
    
    // 清理
    crawler.destroy();
    
  } catch (error) {
    console.error('❌ CrawlX类测试失败:', error.message);
  }

  try {
    // 测试3: 测试简单的HTML解析
    console.log('\n📋 测试3: HTML解析测试');
    const htmlResult = await quickCrawl('https://httpbin.org/html', {
      parse: {
        title: 'title',
        paragraphs: 'p',
        links: {
          selector: 'a',
          attribute: 'href'
        }
      }
    });
    
    console.log('✅ HTML解析结果:', JSON.stringify(htmlResult, null, 2));
    
  } catch (error) {
    console.error('❌ HTML解析测试失败:', error.message);
  }

  console.log('\n🎉 基本爬取功能测试完成！');
}

// 运行测试
if (require.main === module) {
  testBasicCrawl().catch(console.error);
}

module.exports = { testBasicCrawl };
