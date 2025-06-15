/**
 * Follow Plugin - Handles link following and automatic task generation
 */

import { Plugin } from '@/core/plugin';
import { TaskOptions, TaskResult, FollowContext, FollowRule } from '@/types';
import { Parser } from '@/parser';
import { HttpUtils } from '@/http';

/**
 * Follow plugin configuration
 */
export interface FollowPluginConfig {
  enabled?: boolean;
  maxDepth?: number;
  sameDomainOnly?: boolean;
  respectRobotsTxt?: boolean;
  deduplicateUrls?: boolean;
  urlFilters?: Array<(url: string) => boolean>;
  maxLinksPerPage?: number;
}

/**
 * Follow plugin for automatic link discovery and following
 */
export class FollowPlugin extends Plugin {
  private parser: Parser;
  private config: FollowPluginConfig;
  private visitedUrls = new Set<string>();
  private urlDepths = new Map<string, number>();

  constructor(config: FollowPluginConfig = {}) {
    super('follow', '1.0.0', 150); // Medium-high priority
    
    this.config = {
      enabled: true,
      maxDepth: 3,
      sameDomainOnly: true,
      respectRobotsTxt: false,
      deduplicateUrls: true,
      urlFilters: [],
      maxLinksPerPage: 100,
      ...config,
    };

    this.parser = new Parser();
  }

  protected getDescription(): string {
    return 'Automatically discovers and follows links from crawled pages';
  }

  protected getAuthor(): string {
    return 'CrawlX Team';
  }

  protected getTags(): string[] {
    return ['following', 'links', 'discovery', 'automation'];
  }

  protected getDependencies(): string[] {
    return ['parse']; // Depends on parse plugin
  }

  /**
   * Initialize plugin
   */
  async onInit(): Promise<void> {
    if (this.context?.logger) {
      this.context.logger.info('Follow plugin initialized');
    }
  }

  /**
   * Set initial depth for task
   */
  async onTaskCreate(task: TaskOptions): Promise<TaskOptions> {
    if (!this.enabled) return task;

    // Set initial depth if not specified
    if (task.metadata && typeof task.metadata.depth === 'undefined') {
      task.metadata.depth = 0;
    } else if (!task.metadata) {
      task.metadata = { depth: 0 };
    }

    return task;
  }

  /**
   * Process follow rules after task completion
   */
  async onTaskComplete(result: TaskResult): Promise<TaskResult> {
    if (!this.enabled || !result.task.follow) return result;

    try {
      const followedTasks = await this.processFollowRules(result);
      result.followed = followedTasks;

      if (this.context?.logger && followedTasks.length > 0) {
        this.context.logger.debug(`Generated ${followedTasks.length} follow tasks from ${result.response.url}`);
      }
    } catch (error) {
      if (this.context?.logger) {
        this.context.logger.error(`Follow processing error for ${result.response.url}: ${error}`);
      }
    }

    return result;
  }

  /**
   * Handle follow context hook
   */
  async onFollow(context: FollowContext): Promise<TaskOptions[]> {
    if (!this.enabled) return [];

    // This hook can be used by other plugins to modify follow behavior
    return [];
  }

  /**
   * Process follow rules and generate new tasks
   */
  private async processFollowRules(result: TaskResult): Promise<TaskOptions[]> {
    const response = result.response as any;
    if (!response.$) return [];

    const currentDepth = result.task.metadata?.depth || 0;
    
    // Check depth limit
    if (currentDepth >= this.config.maxDepth!) {
      return [];
    }

    const followRule = result.task.follow!;
    const links = await this.extractLinks(followRule, response.$, result.response.url);
    
    // Filter and process links
    const filteredLinks = this.filterLinks(links, result.response.url);
    const tasks = await this.generateTasks(filteredLinks, followRule, currentDepth + 1);

    return tasks.slice(0, this.config.maxLinksPerPage!);
  }

  /**
   * Extract links using follow rule
   */
  private async extractLinks(followRule: FollowRule, $: any, baseUrl: string): Promise<string[]> {
    let links: string[] = [];

    if (typeof followRule === 'string') {
      // Simple selector
      links = this.parser.parse(followRule, $) || [];
    } else if (Array.isArray(followRule)) {
      // Array format: [selector, generator?, filter?]
      const [selector] = followRule;
      links = this.parser.parse(selector, $) || [];
    } else if (typeof followRule === 'function') {
      // Function format
      const context: FollowContext = {
        $,
        url: baseUrl,
        response: { url: baseUrl } as any,
        links: [],
        metadata: {},
      };
      const result = await followRule(context);
      if (Array.isArray(result)) {
        links = result.map(task => task.url);
      } else if (result) {
        links = [result.url];
      }
    }

    // Ensure links is an array
    if (!Array.isArray(links)) {
      links = [links].filter(Boolean);
    }

    // Normalize URLs
    return links
      .filter(link => typeof link === 'string' && link.trim())
      .map(link => {
        try {
          return HttpUtils.normalizeUrl(link, baseUrl);
        } catch {
          return null;
        }
      })
      .filter(Boolean) as string[];
  }

  /**
   * Filter links based on configuration
   */
  private filterLinks(links: string[], baseUrl: string): string[] {
    return links.filter(link => {
      // Deduplicate URLs
      if (this.config.deduplicateUrls && this.visitedUrls.has(link)) {
        return false;
      }

      // Same domain only
      if (this.config.sameDomainOnly && !HttpUtils.isSameDomain(link, baseUrl)) {
        return false;
      }

      // Custom URL filters
      for (const filter of this.config.urlFilters!) {
        if (!filter(link)) {
          return false;
        }
      }

      // Mark as visited if deduplication is enabled
      if (this.config.deduplicateUrls) {
        this.visitedUrls.add(link);
      }

      return true;
    });
  }

  /**
   * Generate tasks from filtered links
   */
  private async generateTasks(links: string[], followRule: FollowRule, depth: number): Promise<TaskOptions[]> {
    const tasks: TaskOptions[] = [];

    for (const link of links) {
      let task: TaskOptions | TaskOptions[] | null = null;

      if (Array.isArray(followRule) && followRule.length > 1 && typeof followRule[1] === 'function') {
        // Use custom task generator
        const generator = followRule[1];
        task = await generator({
          $: null as any,
          url: link,
          response: { url: link } as any,
          links: [link],
          metadata: { depth },
        });
      } else {
        // Default task generation
        task = {
          url: link,
          metadata: { depth },
        };
      }

      if (task) {
        if (Array.isArray(task)) {
          tasks.push(...task);
        } else {
          tasks.push(task);
        }
      }

      // Track URL depth
      this.urlDepths.set(link, depth);
    }

    return tasks;
  }

  /**
   * Add URL filter
   */
  addUrlFilter(filter: (url: string) => boolean): void {
    this.config.urlFilters!.push(filter);
  }

  /**
   * Clear visited URLs
   */
  clearVisitedUrls(): void {
    this.visitedUrls.clear();
    this.urlDepths.clear();
  }

  /**
   * Get visited URLs
   */
  getVisitedUrls(): string[] {
    return Array.from(this.visitedUrls);
  }

  /**
   * Get URL depth
   */
  getUrlDepth(url: string): number | undefined {
    return this.urlDepths.get(url);
  }

  /**
   * Update plugin configuration
   */
  updateConfig(config: Partial<FollowPluginConfig>): void {
    Object.assign(this.config, config);
  }

  /**
   * Get plugin configuration
   */
  getConfig(): FollowPluginConfig {
    return { ...this.config };
  }

  /**
   * Get plugin statistics
   */
  getStats() {
    return {
      enabled: this.enabled,
      config: this.config,
      visitedUrls: this.visitedUrls.size,
      maxDepthReached: this.urlDepths.size > 0 ? Math.max(...this.urlDepths.values()) : 0,
      urlsByDepth: Array.from(this.urlDepths.values()).reduce((acc, depth) => {
        acc[depth] = (acc[depth] || 0) + 1;
        return acc;
      }, {} as Record<number, number>),
    };
  }

  /**
   * Test follow rule against HTML
   */
  async testFollowRule(html: string, followRule: FollowRule, baseUrl: string): Promise<string[]> {
    try {
      const cheerio = await import('cheerio');
      const $ = cheerio.load(html);
      return await this.extractLinks(followRule, $, baseUrl);
    } catch (error) {
      throw new Error(`Follow rule test failed: ${error}`);
    }
  }
}
