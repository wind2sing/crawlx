/**
 * CrawlX Basic Usage Examples
 */

import { 
  CrawlX, 
  createLightweightCrawler, 
  createScraper, 
  createSpider,
  quickCrawl,
  batchCrawl 
} from '../src';

// Example 1: Simple single URL crawling
async function basicCrawling() {
  console.log('=== Basic Crawling ===');
  
  const crawler = new CrawlX({
    mode: 'lightweight',
    concurrency: 2,
    timeout: 10000,
  });

  try {
    const result = await crawler.crawl('https://example.com');
    console.log('Status:', result.response.statusCode);
    console.log('Title:', result.response.$.find('title').text());
  } catch (error) {
    console.error('Crawling failed:', error);
  } finally {
    await crawler.destroy();
  }
}

// Example 2: Data extraction with parsing
async function dataExtraction() {
  console.log('\n=== Data Extraction ===');
  
  const scraper = createScraper({
    plugins: {
      parse: { enabled: true, validateRules: true },
    },
  });

  try {
    const result = await scraper.crawl('https://example.com', {
      parse: {
        title: 'title',
        headings: ['h1', 'h2', 'h3'],
        links: '[a@href]',
        metadata: {
          description: 'meta[name="description"]@content',
          keywords: 'meta[name="keywords"]@content',
        },
      },
    });

    console.log('Extracted data:', result.parsed);
  } catch (error) {
    console.error('Extraction failed:', error);
  } finally {
    await scraper.destroy();
  }
}

// Example 3: Following links (spidering)
async function linkFollowing() {
  console.log('\n=== Link Following ===');
  
  const spider = createSpider({
    plugins: {
      follow: {
        enabled: true,
        maxDepth: 2,
        sameDomainOnly: true,
        maxLinksPerPage: 5,
      },
    },
  });

  try {
    const results = await spider.crawlMany(['https://example.com'], {
      parse: {
        title: 'title',
        url: () => window.location.href, // Custom function
      },
      follow: '[a@href]', // Follow all links
    });

    console.log(`Crawled ${results.length} pages`);
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.parsed?.title} - ${result.response.url}`);
    });
  } catch (error) {
    console.error('Spidering failed:', error);
  } finally {
    await spider.destroy();
  }
}

// Example 4: Quick one-off crawling
async function quickCrawling() {
  console.log('\n=== Quick Crawling ===');
  
  try {
    const result = await quickCrawl('https://example.com', {
      title: 'title',
      description: 'meta[name="description"]@content',
    });

    console.log('Quick result:', result.parsed);
  } catch (error) {
    console.error('Quick crawl failed:', error);
  }
}

// Example 5: Batch crawling multiple URLs
async function batchCrawling() {
  console.log('\n=== Batch Crawling ===');
  
  const urls = [
    'https://example.com',
    'https://httpbin.org/json',
    'https://httpbin.org/html',
  ];

  try {
    const results = await batchCrawl(urls, {
      title: 'title',
      status: (response: any) => response.statusCode,
    }, {
      concurrency: 2,
      timeout: 5000,
    });

    console.log(`Batch crawled ${results.length} URLs`);
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.response.url} - Status: ${result.response.statusCode}`);
    });
  } catch (error) {
    console.error('Batch crawl failed:', error);
  }
}

// Example 6: Advanced configuration
async function advancedConfiguration() {
  console.log('\n=== Advanced Configuration ===');
  
  const crawler = new CrawlX({
    mode: 'high-performance',
    concurrency: 10,
    timeout: 15000,
    userAgent: 'MyBot/1.0',
    headers: {
      'Accept': 'text/html,application/xhtml+xml',
    },
    plugins: {
      delay: {
        enabled: true,
        defaultDelay: 1000,
        randomDelay: true,
        randomRange: [500, 1500],
      },
      rateLimit: {
        enabled: true,
        globalLimit: { requests: 100, window: 60000 },
        perDomainLimit: { requests: 10, window: 60000 },
      },
      retry: {
        enabled: true,
        maxRetries: 3,
        exponentialBackoff: true,
      },
    },
  });

  // Event listeners
  crawler.on('task-start', (task) => {
    console.log(`Starting: ${task.url}`);
  });

  crawler.on('task-complete', (result) => {
    console.log(`Completed: ${result.response.url} (${result.response.statusCode})`);
  });

  crawler.on('task-error', (error, task) => {
    console.log(`Failed: ${task.url} - ${error.message}`);
  });

  try {
    const results = await crawler.crawlMany([
      'https://example.com',
      'https://httpbin.org/delay/1',
      'https://httpbin.org/status/200',
    ]);

    console.log(`Advanced crawl completed: ${results.length} results`);
  } catch (error) {
    console.error('Advanced crawl failed:', error);
  } finally {
    await crawler.destroy();
  }
}

// Example 7: Custom plugin
class CustomPlugin {
  name = 'custom';
  version = '1.0.0';
  priority = 100;

  async onTaskComplete(result: any) {
    // Add custom processing
    result.customData = {
      processedAt: new Date().toISOString(),
      urlLength: result.response.url.length,
    };
    return result;
  }
}

async function customPluginExample() {
  console.log('\n=== Custom Plugin ===');
  
  const crawler = new CrawlX();
  crawler.addPlugin(new CustomPlugin());

  try {
    const result = await crawler.crawl('https://example.com');
    console.log('Custom data:', result.customData);
  } catch (error) {
    console.error('Custom plugin example failed:', error);
  } finally {
    await crawler.destroy();
  }
}

// Run all examples
async function runExamples() {
  console.log('CrawlX Examples\n');
  
  try {
    await basicCrawling();
    await dataExtraction();
    await linkFollowing();
    await quickCrawling();
    await batchCrawling();
    await advancedConfiguration();
    await customPluginExample();
  } catch (error) {
    console.error('Example execution failed:', error);
  }
  
  console.log('\nAll examples completed!');
}

// Export for use in other files
export {
  basicCrawling,
  dataExtraction,
  linkFollowing,
  quickCrawling,
  batchCrawling,
  advancedConfiguration,
  customPluginExample,
  runExamples,
};

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples().catch(console.error);
}
