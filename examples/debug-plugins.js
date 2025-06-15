#!/usr/bin/env node

/**
 * 调试插件系统
 */

const { CrawlX } = require('../dist/index.js');

async function debugPlugins() {
  console.log('🔧 调试插件系统...\n');

  try {
    const crawler = new CrawlX({
      concurrency: 1,
      timeout: 10000
    });

    console.log('✅ 爬虫创建成功');

    // 检查插件状态
    const plugins = crawler.pluginManager?.plugins || [];
    console.log('📋 已注册插件:');
    for (const plugin of plugins) {
      console.log(`  - ${plugin.name} v${plugin.version} (优先级: ${plugin.priority}, 启用: ${plugin.enabled})`);
    }

    // 测试带详细日志的爬取
    console.log('\n📋 开始爬取测试...');
    const result = await crawler.crawl('https://httpbin.org/html', {
      parse: {
        heading: 'h1'
      }
    });
    
    console.log('✅ 爬取完成');
    console.log('  - 响应状态:', result.response.statusCode);
    console.log('  - 有Cheerio实例:', !!result.response.$);
    console.log('  - 任务解析配置:', result.task.parse);
    console.log('  - 解析结果:', result.parsed);
    console.log('  - 结果对象键:', Object.keys(result));
    
    // 检查解析插件是否被调用
    if (result.response.$) {
      console.log('  - 手动解析测试:', result.response.$('h1').text());
    }

    crawler.destroy();
    
  } catch (error) {
    console.error('❌ 插件调试失败:', error.message);
    console.error('错误堆栈:', error.stack);
  }

  console.log('\n🎉 插件调试完成！');
}

// 运行调试
if (require.main === module) {
  debugPlugins().catch(console.error);
}

module.exports = { debugPlugins };
