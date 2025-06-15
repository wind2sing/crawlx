#!/usr/bin/env node

/**
 * 测试JSON解析功能
 */

const { quickCrawl } = require('../dist/index.js');

async function testJSON() {
  console.log('🔧 测试JSON解析功能...\n');

  try {
    // 测试1: JSON API解析
    console.log('📋 测试1: JSON API解析');
    const result1 = await quickCrawl('https://httpbin.org/json', {
      content: 'body'
    });
    
    console.log('✅ JSON解析结果:');
    console.log('  - 内容类型:', typeof result1.parsed.content);
    console.log('  - 内容:', result1.parsed.content);
    console.log('  - 响应头:', result1.response.headers['content-type']);
    
  } catch (error) {
    console.error('❌ JSON解析测试失败:', error.message);
    console.error('错误堆栈:', error.stack);
  }

  try {
    // 测试2: 尝试解析JSON中的特定字段
    console.log('\n📋 测试2: 解析JSON字段');
    const result2 = await quickCrawl('https://httpbin.org/json', {
      slideshow: 'body'
    });
    
    console.log('✅ JSON字段解析结果:');
    console.log('  - slideshow:', result2.parsed.slideshow);
    
  } catch (error) {
    console.error('❌ JSON字段解析失败:', error.message);
  }

  try {
    // 测试3: 测试其他JSON端点
    console.log('\n📋 测试3: 测试其他JSON端点');
    const result3 = await quickCrawl('https://httpbin.org/ip', {
      ip: 'body'
    });
    
    console.log('✅ IP JSON解析结果:');
    console.log('  - IP信息:', result3.parsed.ip);
    
  } catch (error) {
    console.error('❌ IP JSON解析失败:', error.message);
  }

  console.log('\n🎉 JSON解析测试完成！');
}

// 运行测试
if (require.main === module) {
  testJSON().catch(console.error);
}

module.exports = { testJSON };
