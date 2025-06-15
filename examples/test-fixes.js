#!/usr/bin/env node

/**
 * 测试修复后的功能
 */

const { quickCrawl, CrawlX } = require('../dist/index.js');

async function testFixes() {
  console.log('🔧 测试修复后的功能...\n');

  try {
    // 测试1: 基本HTML解析（应该工作）
    console.log('📋 测试1: 基本HTML解析');
    const result1 = await quickCrawl('https://httpbin.org/html', {
      parse: {
        heading: 'h1',
        paragraphCount: '[p] | count',
        paragraphs: '[p]'
      }
    });
    
    console.log('✅ HTML解析结果:');
    console.log('  - 标题:', result1.parsed.heading);
    console.log('  - 段落数量:', result1.parsed.paragraphCount);
    console.log('  - 段落数组长度:', Array.isArray(result1.parsed.paragraphs) ? result1.parsed.paragraphs.length : 'N/A');
    
  } catch (error) {
    console.error('❌ HTML解析测试失败:', error.message);
  }

  try {
    // 测试2: JSON解析（现在应该工作）
    console.log('\n📋 测试2: JSON解析');
    const result2 = await quickCrawl('https://httpbin.org/json', {
      parse: {
        content: 'body'
      }
    });
    
    console.log('✅ JSON解析结果:');
    console.log('  - 内容类型:', typeof result2.parsed.content);
    console.log('  - 内容预览:', JSON.stringify(result2.parsed.content).substring(0, 100) + '...');
    
  } catch (error) {
    console.error('❌ JSON解析测试失败:', error.message);
  }

  try {
    // 测试3: 复杂解析规则
    console.log('\n📋 测试3: 复杂解析规则');
    const result3 = await quickCrawl('https://httpbin.org/html', {
      parse: {
        structure: {
          title: 'h1',
          content: '[p] | count',
          hasLinks: '[a] | count'
        }
      }
    });
    
    console.log('✅ 复杂解析结果:');
    console.log('  - 结构:', result3.parsed.structure);
    
  } catch (error) {
    console.error('❌ 复杂解析测试失败:', error.message);
  }

  try {
    // 测试4: 过滤器链
    console.log('\n📋 测试4: 过滤器链');
    const result4 = await quickCrawl('https://httpbin.org/html', {
      parse: {
        textLength: 'h1 | text | trim | length'
      }
    });
    
    console.log('✅ 过滤器链结果:');
    console.log('  - 文本长度:', result4.parsed.textLength);
    
  } catch (error) {
    console.error('❌ 过滤器链测试失败:', error.message);
  }

  console.log('\n🎉 修复功能测试完成！');
}

// 运行测试
if (require.main === module) {
  testFixes().catch(console.error);
}

module.exports = { testFixes };
