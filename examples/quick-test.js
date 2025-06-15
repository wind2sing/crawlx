#!/usr/bin/env node

/**
 * 快速测试
 * 验证CrawlX核心功能是否正常工作
 */

const { quickCrawl } = require('../dist/index.js');

async function quickTest() {
  console.log('⚡ CrawlX 快速功能测试\n');

  let passed = 0;
  let total = 0;

  // 测试1: 基本HTML解析
  total++;
  try {
    console.log('📋 测试HTML解析...');
    const result = await quickCrawl('https://httpbin.org/html', {
      title: 'h1',
      count: '[p] | count'
    });
    
    if (result.parsed.title && result.parsed.count >= 0) {
      console.log('✅ HTML解析正常');
      passed++;
    } else {
      console.log('❌ HTML解析失败');
    }
  } catch (error) {
    console.log('❌ HTML解析错误:', error.message);
  }

  // 测试2: JSON解析
  total++;
  try {
    console.log('📋 测试JSON解析...');
    const result = await quickCrawl('https://httpbin.org/json', {
      content: 'body'
    });
    
    if (result.parsed.content) {
      console.log('✅ JSON解析正常');
      passed++;
    } else {
      console.log('❌ JSON解析失败');
    }
  } catch (error) {
    console.log('❌ JSON解析错误:', error.message);
  }

  // 测试3: 过滤器
  total++;
  try {
    console.log('📋 测试过滤器...');
    const result = await quickCrawl('https://httpbin.org/html', {
      length: 'h1 | text | length'
    });
    
    if (typeof result.parsed.length === 'number' && result.parsed.length > 0) {
      console.log('✅ 过滤器正常');
      passed++;
    } else {
      console.log('❌ 过滤器失败');
    }
  } catch (error) {
    console.log('❌ 过滤器错误:', error.message);
  }

  // 结果
  console.log('\n🎯 测试结果:');
  console.log(`  通过: ${passed}/${total} (${Math.round(passed/total*100)}%)`);
  
  if (passed === total) {
    console.log('  🎉 所有核心功能正常！');
    process.exit(0);
  } else {
    console.log('  ⚠️  部分功能异常，建议运行完整测试');
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  quickTest().catch(console.error);
}

module.exports = { quickTest };
