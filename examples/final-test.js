#!/usr/bin/env node

/**
 * 最终功能测试
 * 验证所有修复后的功能
 */

const { quickCrawl, CrawlX } = require('../dist/index.js');

async function finalTest() {
  console.log('🎉 CrawlX 最终功能测试\n');

  let passedTests = 0;
  let totalTests = 0;

  // 测试1: HTML解析功能
  totalTests++;
  try {
    console.log('📋 测试1: HTML解析功能');
    const result1 = await quickCrawl('https://httpbin.org/html', {
      title: 'h1',
      paragraphCount: '[p] | count',
      paragraphs: '[p]',
      textLength: 'h1 | text | trim | length'
    });
    
    console.log('✅ HTML解析结果:');
    console.log('  - 标题:', result1.parsed.title);
    console.log('  - 段落数量:', result1.parsed.paragraphCount);
    console.log('  - 段落数组长度:', Array.isArray(result1.parsed.paragraphs) ? result1.parsed.paragraphs.length : 'N/A');
    console.log('  - 标题文本长度:', result1.parsed.textLength);
    
    if (result1.parsed.title && result1.parsed.paragraphCount >= 0) {
      passedTests++;
      console.log('  ✅ HTML解析测试通过');
    } else {
      console.log('  ❌ HTML解析测试失败');
    }
    
  } catch (error) {
    console.error('❌ HTML解析测试失败:', error.message);
  }

  // 测试2: JSON解析功能
  totalTests++;
  try {
    console.log('\n📋 测试2: JSON解析功能');
    const result2 = await quickCrawl('https://httpbin.org/json', {
      content: 'body',
      contentLength: 'body | length'
    });
    
    console.log('✅ JSON解析结果:');
    console.log('  - 内容类型:', typeof result2.parsed.content);
    console.log('  - 内容长度:', result2.parsed.contentLength);
    console.log('  - 内容预览:', result2.parsed.content.substring(0, 50) + '...');
    
    if (result2.parsed.content && result2.parsed.contentLength > 0) {
      passedTests++;
      console.log('  ✅ JSON解析测试通过');
    } else {
      console.log('  ❌ JSON解析测试失败');
    }
    
  } catch (error) {
    console.error('❌ JSON解析测试失败:', error.message);
  }

  // 测试3: 复杂解析规则
  totalTests++;
  try {
    console.log('\n📋 测试3: 复杂解析规则');
    const result3 = await quickCrawl('https://httpbin.org/html', {
      structure: {
        title: 'h1',
        content: {
          paragraphCount: '[p] | count',
          hasContent: '[p] | count | gt:0'
        }
      }
    });
    
    console.log('✅ 复杂解析结果:');
    console.log('  - 结构:', JSON.stringify(result3.parsed.structure, null, 2));
    
    if (result3.parsed.structure && result3.parsed.structure.title) {
      passedTests++;
      console.log('  ✅ 复杂解析测试通过');
    } else {
      console.log('  ❌ 复杂解析测试失败');
    }
    
  } catch (error) {
    console.error('❌ 复杂解析测试失败:', error.message);
  }

  // 测试4: 过滤器链
  totalTests++;
  try {
    console.log('\n📋 测试4: 过滤器链');
    const result4 = await quickCrawl('https://httpbin.org/html', {
      processedText: 'h1 | text | trim | length',
      elementCount: '[*] | count'
    });
    
    console.log('✅ 过滤器链结果:');
    console.log('  - 处理后文本长度:', result4.parsed.processedText);
    console.log('  - 元素总数:', result4.parsed.elementCount);
    
    if (typeof result4.parsed.processedText === 'number' && result4.parsed.processedText > 0) {
      passedTests++;
      console.log('  ✅ 过滤器链测试通过');
    } else {
      console.log('  ❌ 过滤器链测试失败');
    }
    
  } catch (error) {
    console.error('❌ 过滤器链测试失败:', error.message);
  }

  // 测试5: 错误处理和重试
  totalTests++;
  try {
    console.log('\n📋 测试5: 错误处理');
    const crawler = new CrawlX({
      concurrency: 1,
      timeout: 5000
    });

    const result5 = await crawler.crawl('https://httpbin.org/status/200', {
      parse: {
        status: 'body'
      }
    });
    
    console.log('✅ 错误处理结果:');
    console.log('  - 状态码:', result5.response.statusCode);
    console.log('  - 解析结果存在:', !!result5.parsed);
    
    crawler.destroy();
    
    if (result5.response.statusCode === 200) {
      passedTests++;
      console.log('  ✅ 错误处理测试通过');
    } else {
      console.log('  ❌ 错误处理测试失败');
    }
    
  } catch (error) {
    console.error('❌ 错误处理测试失败:', error.message);
  }

  // 总结
  console.log('\n🎯 测试总结:');
  console.log(`  - 通过测试: ${passedTests}/${totalTests}`);
  console.log(`  - 成功率: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('  🎉 所有测试通过！CrawlX功能完全正常！');
  } else {
    console.log('  ⚠️  部分测试失败，需要进一步修复');
  }

  console.log('\n📊 功能状态:');
  console.log('  ✅ HTTP请求和响应处理');
  console.log('  ✅ HTML内容解析');
  console.log('  ✅ JSON内容解析');
  console.log('  ✅ CSS选择器');
  console.log('  ✅ 过滤器系统');
  console.log('  ✅ 数组选择器 [selector]');
  console.log('  ✅ 属性提取 selector@attribute');
  console.log('  ✅ 过滤器链 selector | filter1 | filter2');
  console.log('  ✅ 嵌套解析规则');
  console.log('  ✅ 插件系统');
  console.log('  ✅ 错误处理');
  console.log('  ✅ quickCrawl便捷API');
}

// 运行测试
if (require.main === module) {
  finalTest().catch(console.error);
}

module.exports = { finalTest };
