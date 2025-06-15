#!/usr/bin/env node

/**
 * 测试解析功能
 * 验证CrawlX的解析器是否正确工作
 */

const { quickCrawl } = require('../dist/index.js');

async function testParsing() {
  console.log('🔍 开始测试解析功能...\n');

  try {
    // 测试1: 基本HTML解析
    console.log('📋 测试1: 基本HTML解析');
    const result1 = await quickCrawl('https://httpbin.org/html', {
      parse: {
        title: 'title',
        heading: 'h1',
        paragraphCount: {
          selector: 'p',
          filters: ['count']
        }
      }
    });
    
    console.log('✅ 基本解析结果:');
    console.log('  - 标题:', result1.parsed.title);
    console.log('  - 标题:', result1.parsed.heading);
    console.log('  - 段落数量:', result1.parsed.paragraphCount);
    
  } catch (error) {
    console.error('❌ 基本解析测试失败:', error.message);
  }

  try {
    // 测试2: JSON API解析
    console.log('\n📋 测试2: JSON API解析');
    const result2 = await quickCrawl('https://httpbin.org/json', {
      parse: {
        slideshow: 'body'
      }
    });
    
    console.log('✅ JSON解析结果:');
    console.log('  - 数据类型:', typeof result2.parsed.slideshow);
    console.log('  - 数据预览:', JSON.stringify(result2.parsed.slideshow).substring(0, 100) + '...');
    
  } catch (error) {
    console.error('❌ JSON解析测试失败:', error.message);
  }

  try {
    // 测试3: 属性提取
    console.log('\n📋 测试3: 属性提取测试');
    const result3 = await quickCrawl('https://httpbin.org/html', {
      parse: {
        links: {
          selector: 'a',
          attribute: 'href'
        },
        allText: {
          selector: 'body',
          filters: ['text', 'trim']
        }
      }
    });
    
    console.log('✅ 属性提取结果:');
    console.log('  - 链接数量:', Array.isArray(result3.parsed.links) ? result3.parsed.links.length : 'N/A');
    console.log('  - 文本长度:', result3.parsed.allText ? result3.parsed.allText.length : 'N/A');
    
  } catch (error) {
    console.error('❌ 属性提取测试失败:', error.message);
  }

  try {
    // 测试4: 复杂选择器
    console.log('\n📋 测试4: 复杂选择器测试');
    const result4 = await quickCrawl('https://httpbin.org/html', {
      parse: {
        structure: {
          title: 'title',
          mainHeading: 'h1',
          content: {
            selector: 'div p',
            filters: ['text', 'trim']
          }
        }
      }
    });
    
    console.log('✅ 复杂选择器结果:');
    console.log('  - 结构:', Object.keys(result4.parsed.structure || {}));
    
  } catch (error) {
    console.error('❌ 复杂选择器测试失败:', error.message);
  }

  console.log('\n🎉 解析功能测试完成！');
}

// 运行测试
if (require.main === module) {
  testParsing().catch(console.error);
}

module.exports = { testParsing };
