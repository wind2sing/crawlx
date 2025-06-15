#!/usr/bin/env node

/**
 * CrawlX Examples Runner
 * 运行所有示例和测试的便捷工具
 */

const { execSync } = require('child_process');
const path = require('path');

// 示例文件配置
const examples = {
  '基础示例': [
    { name: '基础爬取', file: 'basic-crawl.js', description: '演示基本的爬取功能' },
    { name: '实际应用', file: 'working-example.js', description: '真实场景的应用示例' }
  ],
  '功能测试': [
    { name: '解析功能测试', file: 'test-parsing.js', description: '测试HTML和JSON解析' },
    { name: '修复验证测试', file: 'test-fixes.js', description: '验证修复后的功能' },
    { name: 'JSON专项测试', file: 'test-json.js', description: '专门测试JSON解析' },
    { name: '最终功能测试', file: 'final-test.js', description: '全面的功能验证' }
  ],
  '调试工具': [
    { name: '基础调试', file: 'debug-test.js', description: '检查基本功能' },
    { name: '解析器调试', file: 'debug-parser.js', description: '调试解析器组件' },
    { name: '查询调试', file: 'debug-query.js', description: '调试查询解析' },
    { name: '插件调试', file: 'debug-plugins.js', description: '调试插件系统' },
    { name: 'quickCrawl调试', file: 'debug-quickcrawl.js', description: '调试quickCrawl函数' }
  ]
};

function runExample(file, name) {
  console.log(`\n🚀 运行: ${name}`);
  console.log(`📁 文件: ${file}`);
  console.log('─'.repeat(50));
  
  try {
    const filePath = path.join(__dirname, file);
    execSync(`node "${filePath}"`, { 
      stdio: 'inherit',
      cwd: __dirname 
    });
    console.log(`✅ ${name} 运行完成`);
  } catch (error) {
    console.error(`❌ ${name} 运行失败:`, error.message);
  }
}

function showMenu() {
  console.log('\n🎯 CrawlX Examples Runner');
  console.log('═'.repeat(50));
  
  let index = 1;
  const menuItems = [];
  
  for (const [category, items] of Object.entries(examples)) {
    console.log(`\n📂 ${category}:`);
    for (const item of items) {
      console.log(`  ${index}. ${item.name} - ${item.description}`);
      menuItems.push(item);
      index++;
    }
  }
  
  console.log(`\n  ${index}. 运行所有基础示例`);
  console.log(`  ${index + 1}. 运行所有功能测试`);
  console.log(`  ${index + 2}. 运行所有调试工具`);
  console.log(`  ${index + 3}. 运行全部示例`);
  console.log(`  0. 退出`);
  
  return menuItems;
}

function runCategory(category) {
  console.log(`\n🔄 运行所有 ${category} 示例...`);
  const items = examples[category];
  
  for (const item of items) {
    runExample(item.file, item.name);
  }
  
  console.log(`\n✅ ${category} 所有示例运行完成`);
}

function runAll() {
  console.log('\n🔄 运行所有示例...');
  
  for (const [category, items] of Object.entries(examples)) {
    console.log(`\n📂 开始运行 ${category}...`);
    for (const item of items) {
      runExample(item.file, item.name);
    }
  }
  
  console.log('\n🎉 所有示例运行完成！');
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // 命令行模式
    const command = args[0];
    
    switch (command) {
      case 'basic':
        runCategory('基础示例');
        break;
      case 'test':
        runCategory('功能测试');
        break;
      case 'debug':
        runCategory('调试工具');
        break;
      case 'all':
        runAll();
        break;
      case 'final':
        runExample('final-test.js', '最终功能测试');
        break;
      default:
        console.log('❌ 未知命令');
        console.log('可用命令: basic, test, debug, all, final');
        process.exit(1);
    }
    return;
  }
  
  // 交互模式
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const menuItems = showMenu();
  
  rl.question('\n请选择要运行的示例 (输入数字): ', (answer) => {
    const choice = parseInt(answer);
    
    if (choice === 0) {
      console.log('👋 再见！');
      rl.close();
      return;
    }
    
    if (choice >= 1 && choice <= menuItems.length) {
      const item = menuItems[choice - 1];
      runExample(item.file, item.name);
    } else if (choice === menuItems.length + 1) {
      runCategory('基础示例');
    } else if (choice === menuItems.length + 2) {
      runCategory('功能测试');
    } else if (choice === menuItems.length + 3) {
      runCategory('调试工具');
    } else if (choice === menuItems.length + 4) {
      runAll();
    } else {
      console.log('❌ 无效选择');
    }
    
    rl.close();
  });
}

// 运行主程序
if (require.main === module) {
  main();
}

module.exports = { runExample, runCategory, runAll };
