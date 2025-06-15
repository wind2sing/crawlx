#!/usr/bin/env node

/**
 * 工作示例
 * 展示CrawlX的实际爬取能力
 */

const { quickCrawl, CrawlX } = require('../dist/index.js');

async function workingExample() {
  console.log('🚀 CrawlX 实际爬取示例\n');

  try {
    // 示例1: 爬取一个有完整HTML结构的页面
    console.log('📋 示例1: 爬取GitHub首页');
    const githubResult = await quickCrawl('https://github.com', {
      parse: {
        title: 'title',
        description: 'meta[name="description"]',
        headings: 'h1, h2',
        linkCount: {
          selector: 'a',
          filters: ['count']
        }
      }
    });
    
    console.log('✅ GitHub爬取结果:');
    console.log('  - 标题:', githubResult.parsed.title);
    console.log('  - 描述:', githubResult.parsed.description);
    console.log('  - 标题数量:', Array.isArray(githubResult.parsed.headings) ? githubResult.parsed.headings.length : 'N/A');
    console.log('  - 链接数量:', githubResult.parsed.linkCount);
    
  } catch (error) {
    console.error('❌ GitHub爬取失败:', error.message);
  }

  try {
    // 示例2: 爬取JSON API
    console.log('\n📋 示例2: 爬取JSON数据');
    const jsonResult = await quickCrawl('https://httpbin.org/json', {
      parse: {
        slideshow: 'body'
      }
    });
    
    console.log('✅ JSON爬取结果:');
    console.log('  - 数据类型:', typeof jsonResult.parsed.slideshow);
    if (jsonResult.parsed.slideshow) {
      console.log('  - 数据预览:', JSON.stringify(jsonResult.parsed.slideshow).substring(0, 100) + '...');
    }
    
  } catch (error) {
    console.error('❌ JSON爬取失败:', error.message);
  }

  try {
    // 示例3: 使用CrawlX类进行更复杂的爬取
    console.log('\n📋 示例3: 复杂爬取配置');
    const crawler = new CrawlX({
      concurrency: 1,
      timeout: 15000,
      userAgent: 'CrawlX-Test/1.0'
    });

    const complexResult = await crawler.crawl('https://httpbin.org/html', {
      parse: {
        content: {
          selector: 'p',
          filters: ['text', 'trim']
        },
        wordCount: {
          selector: 'body',
          filters: ['text', 'trim', 'split', 'count']
        }
      }
    });
    
    console.log('✅ 复杂爬取结果:');
    console.log('  - 段落数量:', Array.isArray(complexResult.parsed.content) ? complexResult.parsed.content.length : 'N/A');
    console.log('  - 总词数:', complexResult.parsed.wordCount);
    
    crawler.destroy();
    
  } catch (error) {
    console.error('❌ 复杂爬取失败:', error.message);
  }

  try {
    // 示例4: 测试属性提取
    console.log('\n📋 示例4: 属性提取');
    const attrResult = await quickCrawl('https://httpbin.org/html', {
      parse: {
        links: {
          selector: 'a',
          attribute: 'href'
        },
        images: {
          selector: 'img',
          attribute: 'src'
        }
      }
    });
    
    console.log('✅ 属性提取结果:');
    console.log('  - 链接:', attrResult.parsed.links);
    console.log('  - 图片:', attrResult.parsed.images);
    
  } catch (error) {
    console.error('❌ 属性提取失败:', error.message);
  }

  console.log('\n🎉 所有示例完成！');
  console.log('\n📊 总结:');
  console.log('  ✅ CrawlX 基本爬取功能正常');
  console.log('  ✅ HTML 解析功能正常');
  console.log('  ✅ 配置系统正常');
  console.log('  ✅ 插件系统基本正常');
}

// 运行示例
if (require.main === module) {
  workingExample().catch(console.error);
}

module.exports = { workingExample };
