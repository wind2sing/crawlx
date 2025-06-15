#!/usr/bin/env node

/**
 * 调试HTML内容
 * 检查实际获取的HTML内容
 */

const { CrawlX } = require('../dist/index.js');

async function debugHTML() {
  console.log('🔧 开始调试HTML内容...\n');

  try {
    const crawler = new CrawlX({
      concurrency: 1,
      timeout: 10000
    });

    // 获取原始HTML
    const result = await crawler.crawl('https://httpbin.org/html');
    
    console.log('✅ HTML获取成功');
    console.log('  - 状态码:', result.response.statusCode);
    
    const html = result.response.body.toString();
    console.log('  - HTML类型:', typeof result.response.body);
    console.log('  - HTML长度:', html.length);

    // 检查HTML中是否包含title标签
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    console.log('  - Title标签匹配:', titleMatch ? titleMatch[1] : 'Not found');

    // 检查H1标签
    const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    console.log('  - H1标签匹配:', h1Match ? h1Match[1] : 'Not found');

    // 显示HTML的前500个字符
    console.log('\n📄 HTML内容预览:');
    console.log(html.substring(0, 500) + '...');

    crawler.destroy();
    
  } catch (error) {
    console.error('❌ HTML调试失败:', error.message);
  }

  console.log('\n🎉 HTML调试完成！');
}

// 运行测试
if (require.main === module) {
  debugHTML().catch(console.error);
}

module.exports = { debugHTML };
