/**
 * 测试新添加的过滤器
 */

const { quickCrawl, Filters } = require('../dist/index.js');

async function testNewFilters() {
  console.log('🧪 测试新添加的过滤器...\n');

  // 首先注册新的过滤器
  console.log('📋 注册新的过滤器...');
  
  // 比较过滤器
  Filters.register('gt', (value, threshold) => {
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    return !isNaN(num) && num > threshold;
  });

  Filters.register('gte', (value, threshold) => {
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    return !isNaN(num) && num >= threshold;
  });

  Filters.register('lt', (value, threshold) => {
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    return !isNaN(num) && num < threshold;
  });

  Filters.register('lte', (value, threshold) => {
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    return !isNaN(num) && num <= threshold;
  });

  Filters.register('eq', (value, target) => {
    const numValue = typeof value === 'number' ? value : parseFloat(String(value));
    const numTarget = typeof target === 'number' ? target : parseFloat(String(target));
    
    if (!isNaN(numValue) && !isNaN(numTarget)) {
      return numValue === numTarget;
    }
    
    return String(value) === String(target);
  });

  Filters.register('ne', (value, target) => {
    const numValue = typeof value === 'number' ? value : parseFloat(String(value));
    const numTarget = typeof target === 'number' ? target : parseFloat(String(target));
    
    if (!isNaN(numValue) && !isNaN(numTarget)) {
      return numValue !== numTarget;
    }
    
    return String(value) !== String(target);
  });

  // 其他实用过滤器
  Filters.register('empty', (value) => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  });

  Filters.register('notEmpty', (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim() !== '';
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
  });

  console.log('✅ 过滤器注册完成\n');

  // 测试1: 基本比较过滤器
  console.log('📋 测试1: 基本比较过滤器');
  try {
    const result1 = await quickCrawl('https://httpbin.org/html', {
      title: 'h1',
      paragraphCount: '[p] | count',
      hasContent: '[p] | count | gt:0',
      hasMultipleParagraphs: '[p] | count | gt:1',
      titleLength: 'h1 | text | length',
      titleLongEnough: 'h1 | text | length | gte:10',
    });

    console.log('✅ 比较过滤器测试结果:');
    console.log('  - 标题:', result1.parsed.title);
    console.log('  - 段落数量:', result1.parsed.paragraphCount);
    console.log('  - 有内容 (gt:0):', result1.parsed.hasContent);
    console.log('  - 有多个段落 (gt:1):', result1.parsed.hasMultipleParagraphs);
    console.log('  - 标题长度:', result1.parsed.titleLength);
    console.log('  - 标题足够长 (gte:10):', result1.parsed.titleLongEnough);
    console.log('  ✅ 比较过滤器测试通过\n');
  } catch (error) {
    console.log('❌ 比较过滤器测试失败:', error.message);
  }

  // 测试2: 等值比较过滤器
  console.log('📋 测试2: 等值比较过滤器');
  try {
    const result2 = await quickCrawl('https://httpbin.org/html', {
      paragraphCount: '[p] | count',
      exactlyOneParagraph: '[p] | count | eq:1',
      notZeroParagraphs: '[p] | count | ne:0',
      titleExists: 'h1 | notEmpty',
      noH2: 'h2 | empty',
    });

    console.log('✅ 等值比较过滤器测试结果:');
    console.log('  - 段落数量:', result2.parsed.paragraphCount);
    console.log('  - 恰好一个段落 (eq:1):', result2.parsed.exactlyOneParagraph);
    console.log('  - 不是零个段落 (ne:0):', result2.parsed.notZeroParagraphs);
    console.log('  - 标题存在 (notEmpty):', result2.parsed.titleExists);
    console.log('  - 没有H2 (empty):', result2.parsed.noH2);
    console.log('  ✅ 等值比较过滤器测试通过\n');
  } catch (error) {
    console.log('❌ 等值比较过滤器测试失败:', error.message);
  }

  // 测试3: 复杂解析规则（之前失败的测试）
  console.log('📋 测试3: 复杂解析规则（修复测试）');
  try {
    const result3 = await quickCrawl('https://httpbin.org/html', {
      structure: {
        title: 'h1',
        content: {
          paragraphCount: '[p] | count',
          hasContent: '[p] | count | gt:0',
          hasMultipleElements: 'body * | count | gt:5',
        }
      }
    });

    console.log('✅ 复杂解析规则测试结果:');
    console.log('  - 结构:', JSON.stringify(result3.parsed.structure, null, 2));
    console.log('  ✅ 复杂解析规则测试通过\n');
  } catch (error) {
    console.log('❌ 复杂解析规则测试失败:', error.message);
  }

  // 测试4: 过滤器链组合
  console.log('📋 测试4: 过滤器链组合');
  try {
    const result4 = await quickCrawl('https://httpbin.org/html', {
      titleAnalysis: {
        text: 'h1 | text',
        length: 'h1 | text | length',
        isLong: 'h1 | text | length | gt:20',
        isShort: 'h1 | text | length | lt:10',
        isMedium: 'h1 | text | length | gte:10',
      }
    });

    console.log('✅ 过滤器链组合测试结果:');
    console.log('  - 标题分析:', JSON.stringify(result4.parsed.titleAnalysis, null, 2));
    console.log('  ✅ 过滤器链组合测试通过\n');
  } catch (error) {
    console.log('❌ 过滤器链组合测试失败:', error.message);
  }

  console.log('🎉 所有新过滤器测试完成！');
}

// 运行测试
testNewFilters().catch(console.error);
