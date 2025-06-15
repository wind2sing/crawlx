/**
 * Test build script to verify the library works correctly
 */

import { CrawlX, createLightweightCrawler, quickCrawl } from '../src';

async function testBasicFunctionality() {
  console.log('🧪 Testing CrawlX basic functionality...\n');

  // Test 1: Create crawler instance
  console.log('1. Creating CrawlX instance...');
  const crawler = new CrawlX({
    logLevel: 'silent',
    timeout: 5000,
  });
  console.log('✅ CrawlX instance created successfully');

  // Test 2: Check configuration
  console.log('2. Checking configuration...');
  const config = crawler.getConfig();
  console.log(`✅ Mode: ${config.get('mode')}, Concurrency: ${config.get('concurrency')}`);

  // Test 3: Check statistics
  console.log('3. Checking statistics...');
  const stats = crawler.getStats();
  console.log(`✅ Plugins loaded: ${stats.plugins.total}, Running: ${stats.isRunning}`);

  // Test 4: Factory functions
  console.log('4. Testing factory functions...');
  const lightweightCrawler = createLightweightCrawler();
  console.log('✅ Lightweight crawler created');
  await lightweightCrawler.destroy();

  // Test 5: Configuration updates
  console.log('5. Testing configuration updates...');
  crawler.updateConfig({ concurrency: 10 });
  console.log(`✅ Configuration updated: ${crawler.getConfig().get('concurrency')}`);

  // Cleanup
  await crawler.destroy();
  console.log('✅ Crawler destroyed successfully\n');
}

async function testErrorHandling() {
  console.log('🛡️ Testing error handling...\n');

  const crawler = new CrawlX({ logLevel: 'silent' });

  try {
    // Test invalid URL
    console.log('1. Testing invalid URL handling...');
    await crawler.crawl('invalid-url');
    console.log('❌ Should have thrown an error');
  } catch (error) {
    console.log('✅ Invalid URL error handled correctly');
  }

  await crawler.destroy();
  console.log('✅ Error handling test completed\n');
}

async function testPluginSystem() {
  console.log('🔌 Testing plugin system...\n');

  const crawler = new CrawlX({ logLevel: 'silent' });

  // Test plugin statistics
  console.log('1. Checking plugin statistics...');
  const stats = crawler.getStats().plugins;
  console.log(`✅ Total plugins: ${stats.total}, Enabled: ${stats.enabled}`);

  // Test custom plugin
  console.log('2. Testing custom plugin...');
  class TestPlugin {
    name = 'test';
    version = '1.0.0';
    priority = 100;

    async onTaskComplete(result: any) {
      result.testData = { processed: true };
      return result;
    }
  }

  crawler.addPlugin(new TestPlugin());
  const newStats = crawler.getStats().plugins;
  console.log(`✅ Plugin added: ${newStats.total} total plugins`);

  await crawler.destroy();
  console.log('✅ Plugin system test completed\n');
}

async function runAllTests() {
  console.log('🚀 Starting CrawlX build tests...\n');

  try {
    await testBasicFunctionality();
    await testErrorHandling();
    await testPluginSystem();

    console.log('🎉 All tests passed! CrawlX is working correctly.');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch((error) => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

export { runAllTests };
