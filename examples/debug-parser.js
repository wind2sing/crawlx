#!/usr/bin/env node

/**
 * 调试解析器
 * 测试解析器的各个组件
 */

const { Parser } = require('../dist/index.js');
const cheerio = require('cheerio');

async function debugParser() {
  console.log('🔧 开始调试解析器...\n');

  // 创建测试HTML
  const testHtml = `
    <html>
      <head>
        <title>Test Page</title>
      </head>
      <body>
        <h1>Main Heading</h1>
        <p>First paragraph</p>
        <p>Second paragraph</p>
        <a href="https://example.com">Example Link</a>
        <div class="content">
          <span>Content text</span>
        </div>
      </body>
    </html>
  `;

  try {
    // 创建Cheerio实例
    const $ = cheerio.load(testHtml);
    console.log('✅ Cheerio实例创建成功');

    // 测试基本选择器
    console.log('\n📋 测试基本选择器:');
    console.log('  - title:', $('title').text());
    console.log('  - h1:', $('h1').text());
    console.log('  - p count:', $('p').length);
    console.log('  - a href:', $('a').attr('href'));

    // 测试解析器
    console.log('\n📋 测试解析器:');
    const parser = new Parser();

    // 测试简单解析
    const result1 = parser.parse('title', $);
    console.log('  - title解析:', result1);

    const result2 = parser.parse('h1', $);
    console.log('  - h1解析:', result2);

    // 测试属性解析
    const result3 = parser.parse('a@href', $);
    console.log('  - a@href解析:', result3);

    // 测试对象解析
    const result4 = parser.parse({
      title: 'title',
      heading: 'h1',
      linkHref: 'a@href'
    }, $);
    console.log('  - 对象解析:', result4);

    // 测试过滤器
    const result5 = parser.parse('[p] | count', $);
    console.log('  - [p] | count解析:', result5);

    // 测试数组选择器
    const result6 = parser.parse('[p]', $);
    console.log('  - [p]解析:', result6);

    // 测试简单过滤器
    const result7 = parser.parse('p | count', $);
    console.log('  - p | count解析:', result7);

  } catch (error) {
    console.error('❌ 解析器调试失败:', error.message);
    console.error('错误堆栈:', error.stack);
  }

  console.log('\n🎉 解析器调试完成！');
}

// 运行调试
if (require.main === module) {
  debugParser().catch(console.error);
}

module.exports = { debugParser };
