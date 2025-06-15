# Advanced Examples

This guide provides comprehensive examples for various crawling scenarios.

## E-commerce Product Scraping

### Basic Product Information

```typescript
import { createScraper } from 'crawlx';

const scraper = createScraper({
  plugins: {
    delay: { enabled: true, defaultDelay: 2000 },
    rateLimit: { enabled: true }
  }
});

const productRule = {
  name: 'h1.product-title',
  price: '.price-current | trim | number',
  originalPrice: '.price-original | trim | number',
  discount: '.discount-percentage | trim',
  rating: '.rating-stars@data-rating | number',
  reviewCount: '.review-count | trim | number',
  availability: '.stock-status',
  images: ['img.product-image@src'],
  description: '.product-description | trim',
  specifications: {
    _scope: '.spec-table tr',
    name: '.spec-name',
    value: '.spec-value'
  },
  variants: {
    _scope: '.variant-option',
    name: '.variant-name',
    price: '.variant-price | number',
    available: '.variant-stock | boolean'
  }
};

const result = await scraper.crawl('https://shop.example.com/product/123', {
  parse: productRule
});

console.log(result.parsed);
await scraper.destroy();
```

### Multi-page Product Catalog

```typescript
import { createSpider } from 'crawlx';

const spider = createSpider({
  concurrency: 5,
  plugins: {
    follow: {
      enabled: true,
      maxDepth: 3,
      sameDomainOnly: true,
      maxLinksPerPage: 50
    },
    duplicateFilter: { enabled: true }
  }
});

const catalogRule = {
  products: {
    _scope: '.product-item',
    name: '.product-name',
    price: '.product-price | trim | number',
    url: '.product-link@href',
    image: '.product-image@src',
    rating: '.product-rating@data-rating | number'
  },
  pagination: {
    nextPage: '.pagination .next@href',
    currentPage: '.pagination .current | number',
    totalPages: '.pagination .total | number'
  }
};

const results = await spider.crawlMany(['https://shop.example.com/category/electronics'], {
  parse: catalogRule,
  follow: '.pagination .next@href, .product-link@href'
});

// Process all products
const allProducts = results
  .map(result => result.parsed.products)
  .flat()
  .filter(Boolean);

console.log(`Found ${allProducts.length} products`);
await spider.destroy();
```

## News and Blog Scraping

### Article Extraction

```typescript
import { createScraper } from 'crawlx';

const newsScraper = createScraper();

const articleRule = {
  headline: 'h1.article-title, h1.headline',
  subheadline: '.article-subtitle, .subheadline',
  author: {
    name: '.author-name, .byline-author',
    url: '.author-link@href',
    bio: '.author-bio'
  },
  publishDate: '.publish-date, .article-date | date',
  updateDate: '.update-date | date',
  category: '.article-category, .section-name',
  tags: ['.article-tags .tag, .keywords .keyword'],
  content: {
    paragraphs: ['.article-content p'],
    images: ['.article-content img@src'],
    videos: ['.article-content video@src']
  },
  metadata: {
    wordCount: ($) => $('.article-content').text().split(/\s+/).length,
    readTime: '.read-time | number',
    shareCount: '.share-count | number'
  },
  relatedArticles: {
    _scope: '.related-articles .article',
    title: '.article-title',
    url: '.article-link@href',
    image: '.article-image@src'
  }
};

const result = await newsScraper.crawl('https://news.example.com/article/123', {
  parse: articleRule
});

console.log(result.parsed);
await newsScraper.destroy();
```

### RSS Feed Processing

```typescript
import { createLightweightCrawler } from 'crawlx';

const feedCrawler = createLightweightCrawler();

const rssRule = {
  title: 'channel > title',
  description: 'channel > description',
  link: 'channel > link',
  lastBuildDate: 'channel > lastBuildDate | date',
  items: {
    _scope: 'item',
    title: 'title',
    link: 'link',
    description: 'description',
    pubDate: 'pubDate | date',
    category: 'category',
    guid: 'guid'
  }
};

const result = await feedCrawler.crawl('https://news.example.com/rss', {
  parse: rssRule
});

console.log(`Found ${result.parsed.items.length} articles`);
await feedCrawler.destroy();
```

## Social Media Monitoring

### Twitter-like Platform

```typescript
import { createMonitor } from 'crawlx';

const socialMonitor = createMonitor({
  plugins: {
    delay: { enabled: true, defaultDelay: 5000 },
    duplicateFilter: { enabled: false } // Allow re-crawling for updates
  }
});

const tweetRule = {
  posts: {
    _scope: '.tweet, .post',
    id: '@data-tweet-id',
    author: {
      username: '.username',
      displayName: '.display-name',
      avatar: '.avatar@src',
      verified: '.verified-badge | boolean'
    },
    content: '.tweet-text, .post-content',
    timestamp: '.timestamp@datetime | date',
    metrics: {
      likes: '.like-count | number',
      retweets: '.retweet-count | number',
      replies: '.reply-count | number'
    },
    media: {
      images: ['.media-image@src'],
      videos: ['.media-video@src']
    },
    hashtags: ['.hashtag'],
    mentions: ['.mention@data-user']
  }
};

// Monitor multiple accounts
const accounts = [
  'https://social.example.com/user1',
  'https://social.example.com/user2',
  'https://social.example.com/user3'
];

const results = await socialMonitor.crawlMany(accounts, {
  parse: tweetRule
});

// Process new posts
results.forEach(result => {
  result.parsed.posts.forEach(post => {
    console.log(`${post.author.username}: ${post.content}`);
  });
});

await socialMonitor.destroy();
```

## Real Estate Listings

```typescript
import { createScraper } from 'crawlx';

const realEstateScraper = createScraper({
  concurrency: 3,
  plugins: {
    delay: { enabled: true, defaultDelay: 3000 }
  }
});

const listingRule = {
  property: {
    address: '.property-address',
    price: '.property-price | trim | number',
    pricePerSqft: '.price-per-sqft | number',
    type: '.property-type',
    status: '.listing-status'
  },
  details: {
    bedrooms: '.bedrooms | number',
    bathrooms: '.bathrooms | number',
    sqft: '.square-feet | number',
    lotSize: '.lot-size',
    yearBuilt: '.year-built | number',
    parking: '.parking-spaces | number'
  },
  features: ['.feature-list .feature'],
  description: '.property-description | trim',
  images: ['.property-images img@src'],
  virtualTour: '.virtual-tour@href',
  agent: {
    name: '.agent-name',
    phone: '.agent-phone',
    email: '.agent-email',
    company: '.agent-company'
  },
  location: {
    neighborhood: '.neighborhood',
    school: '.school-district',
    walkScore: '.walk-score | number'
  },
  history: {
    _scope: '.price-history .entry',
    date: '.history-date | date',
    price: '.history-price | number',
    event: '.history-event'
  }
};

const result = await realEstateScraper.crawl('https://realestate.example.com/listing/123', {
  parse: listingRule
});

console.log(result.parsed);
await realEstateScraper.destroy();
```

## Job Board Scraping

```typescript
import { createSpider } from 'crawlx';

const jobSpider = createSpider({
  plugins: {
    follow: {
      enabled: true,
      maxDepth: 2,
      maxLinksPerPage: 100
    }
  }
});

const jobRule = {
  jobs: {
    _scope: '.job-listing',
    title: '.job-title',
    company: '.company-name',
    location: '.job-location',
    salary: '.salary-range',
    type: '.job-type', // Full-time, Part-time, Contract
    remote: '.remote-option | boolean',
    posted: '.posted-date | date',
    url: '.job-link@href',
    description: '.job-summary',
    requirements: ['.requirements li'],
    benefits: ['.benefits li']
  },
  pagination: {
    nextPage: '.pagination .next@href',
    totalJobs: '.total-results | number'
  }
};

const results = await jobSpider.crawlMany(['https://jobs.example.com/search?q=developer'], {
  parse: jobRule,
  follow: '.pagination .next@href'
});

const allJobs = results
  .map(result => result.parsed.jobs)
  .flat()
  .filter(Boolean);

console.log(`Found ${allJobs.length} job listings`);
await jobSpider.destroy();
```

## API Data Extraction

### JSON API Responses

```typescript
import { createLightweightCrawler } from 'crawlx';

const apiCrawler = createLightweightCrawler({
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'DataBot/1.0'
  }
});

// Custom parser for JSON responses
const jsonRule = {
  data: ($, response) => {
    try {
      return JSON.parse(response.body.toString());
    } catch {
      return null;
    }
  }
};

const result = await apiCrawler.crawl('https://api.example.com/users', {
  parse: jsonRule
});

console.log(result.parsed.data);
await apiCrawler.destroy();
```

## Multi-step Workflows

### Login and Scrape Protected Content

```typescript
import { CrawlX } from 'crawlx';

const crawler = new CrawlX({
  cookies: true, // Enable cookie handling
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; Bot/1.0)'
  }
});

// Step 1: Login
const loginResult = await crawler.crawl('https://example.com/login', {
  method: 'POST',
  body: new URLSearchParams({
    username: 'your-username',
    password: 'your-password'
  }),
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
});

// Step 2: Access protected content
const protectedResult = await crawler.crawl('https://example.com/dashboard', {
  parse: {
    userInfo: '.user-profile',
    notifications: ['.notification'],
    data: '.dashboard-data'
  }
});

console.log(protectedResult.parsed);
await crawler.destroy();
```

## Performance Monitoring

### Website Health Check

```typescript
import { createValidator } from 'crawlx';

const validator = createValidator({
  concurrency: 20,
  timeout: 10000
});

const healthCheckRule = {
  status: (response) => response.statusCode,
  loadTime: (response) => response.timing?.total || 0,
  title: 'title',
  hasErrors: ($) => $('.error, .warning').length > 0,
  resources: {
    images: ($) => $('img').length,
    scripts: ($) => $('script').length,
    stylesheets: ($) => $('link[rel="stylesheet"]').length
  }
};

const urls = [
  'https://example.com',
  'https://example.com/about',
  'https://example.com/contact',
  'https://example.com/products'
];

const results = await validator.crawlMany(urls, {
  parse: healthCheckRule
});

results.forEach(result => {
  const { status, loadTime, hasErrors } = result.parsed;
  console.log(`${result.response.url}: ${status} (${loadTime}ms) ${hasErrors ? '⚠️' : '✅'}`);
});

await validator.destroy();
```

## Custom Filters

```typescript
import { Parser } from 'crawlx';

const parser = new Parser();

// Add custom filters
parser.addFilter('currency', (value) => {
  const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
  return isNaN(num) ? 0 : num;
});

parser.addFilter('phone', (value) => {
  return value.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
});

parser.addFilter('slug', (value) => {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
});

// Use custom filters
const customRule = {
  price: '.price | currency',
  phone: '.contact-phone | phone',
  slug: '.title | slug'
};
```

These examples demonstrate the flexibility and power of CrawlX for various web scraping scenarios. Remember to always respect robots.txt files and website terms of service when scraping.
