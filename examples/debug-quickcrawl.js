#!/usr/bin/env node

/**
 * 调试quickCrawl函数
 */

const { quickCrawl, CrawlX } = require('../dist/index.js');

async function debugQuickCrawl() {
  console.log('🔧 调试quickCrawl函数...\n');

  try {
    // 测试1: 直接使用CrawlX类（已知工作）
    console.log('📋 测试1: 直接使用CrawlX类');
    const crawler = new CrawlX({
      concurrency: 1,
      timeout: 10000
    });

    const directResult = await crawler.crawl('https://httpbin.org/html', {
      parse: {
        heading: 'h1'
      }
    });
    
    console.log('✅ 直接调用结果:');
    console.log('  - 解析结果:', directResult.parsed);
    
    crawler.destroy();

  } catch (error) {
    console.error('❌ 直接调用失败:', error.message);
  }

  try {
    // 测试2: 使用quickCrawl
    console.log('\n📋 测试2: 使用quickCrawl');
    const quickResult = await quickCrawl('https://httpbin.org/html', {
      heading: 'h1'
    });
    
    console.log('✅ quickCrawl结果:');
    console.log('  - 解析结果:', quickResult.parsed);
    console.log('  - 任务配置:', quickResult.task);
    
  } catch (error) {
    console.error('❌ quickCrawl失败:', error.message);
    console.error('错误堆栈:', error.stack);
  }

  try {
    // 测试3: 使用quickCrawl的复杂解析
    console.log('\n📋 测试3: quickCrawl复杂解析');
    const complexResult = await quickCrawl('https://httpbin.org/html', {
      heading: 'h1',
      paragraphCount: '[p] | count',
      paragraphs: '[p]'
    });
    
    console.log('✅ 复杂解析结果:');
    console.log('  - 标题:', complexResult.parsed.heading);
    console.log('  - 段落数量:', complexResult.parsed.paragraphCount);
    console.log('  - 段落数组:', complexResult.parsed.paragraphs);
    
  } catch (error) {
    console.error('❌ 复杂解析失败:', error.message);
  }

  console.log('\n🎉 quickCrawl调试完成！');
}

// 运行调试
if (require.main === module) {
  debugQuickCrawl().catch(console.error);
}

module.exports = { debugQuickCrawl };
