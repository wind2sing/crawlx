#!/usr/bin/env node

/**
 * 调试查询解析器
 */

const { parseQuery } = require('../dist/index.js');

function debugQuery() {
  console.log('🔧 开始调试查询解析器...\n');

  const queries = [
    'title',
    'h1',
    'a@href',
    '[p]',
    '[p] | count',
    'p | count',
    'body | text | trim'
  ];

  for (const query of queries) {
    try {
      const result = parseQuery(query);
      console.log(`📋 查询: "${query}"`);
      console.log('  - selector:', result.selector);
      console.log('  - attribute:', result.attribute);
      console.log('  - getAll:', result.getAll);
      console.log('  - filters:', result.filters);
      console.log('');
    } catch (error) {
      console.error(`❌ 查询解析失败: "${query}"`, error.message);
    }
  }

  console.log('🎉 查询解析器调试完成！');
}

// 运行调试
if (require.main === module) {
  debugQuery();
}

module.exports = { debugQuery };
