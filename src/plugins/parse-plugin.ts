/**
 * Parse Plugin - Handles data parsing using the built-in parser
 */

import { Plugin } from '@/core/plugin';
import { TaskOptions, TaskResult, ParseContext } from '@/types';
import { Parser } from '@/parser';

/**
 * Parse plugin configuration
 */
export interface ParsePluginConfig {
  enabled?: boolean;
  customFilters?: Record<string, Function>;
  validateRules?: boolean;
  throwOnError?: boolean;
}

/**
 * Parse plugin for extracting data from HTML responses
 */
export class ParsePlugin extends Plugin {
  private parser: Parser;
  private config: ParsePluginConfig;

  constructor(config: ParsePluginConfig = {}) {
    super('parse', '1.0.0', 200); // High priority
    
    this.config = {
      enabled: true,
      customFilters: {},
      validateRules: false,
      throwOnError: true,
      ...config,
    };

    this.parser = new Parser(this.config.customFilters);
  }

  protected getDescription(): string {
    return 'Parses HTML content using CSS selectors and filters';
  }

  protected getAuthor(): string {
    return 'CrawlX Team';
  }

  protected getTags(): string[] {
    return ['parsing', 'html', 'css-selectors', 'core'];
  }

  /**
   * Initialize plugin
   */
  async onInit(): Promise<void> {
    if (this.context?.logger) {
      this.context.logger.info('Parse plugin initialized');
    }
  }

  /**
   * Validate task parse rules before execution
   */
  async onTaskCreate(task: TaskOptions): Promise<TaskOptions> {
    if (!this.enabled || !task.parse) return task;

    // Validate parse rules if enabled
    if (this.config.validateRules) {
      try {
        const isValid = this.parser.validate(task.parse);
        if (!isValid) {
          throw new Error(`Invalid parse rule in task: ${JSON.stringify(task.parse)}`);
        }
      } catch (error) {
        if (this.config.throwOnError) {
          throw new Error(`Parse rule validation failed: ${error}`);
        } else {
          if (this.context?.logger) {
            this.context.logger.warn(`Parse rule validation failed: ${error}`);
          }
        }
      }
    }

    return task;
  }

  /**
   * Parse response content
   */
  async onTaskComplete(result: TaskResult): Promise<TaskResult> {
    if (!this.enabled || !result.task.parse) return result;

    try {
      // Check if response has Cheerio instance
      const response = result.response as any;
      if (!response.$ && response.body) {
        // Create Cheerio instance if not available
        const cheerio = await import('cheerio');
        const html = response.body.toString('utf8');
        response.$ = cheerio.load(html);
      }

      if (response.$) {
        const parseContext: ParseContext = {
          $: response.$,
          url: result.response.url,
          response: result.response,
          metadata: result.task.metadata || {},
        };

        // Parse the content
        const parsed = this.parser.parseWithContext(result.task.parse, parseContext);
        
        // Add parsed data to result
        result.parsed = parsed;

        if (this.context?.logger) {
          this.context.logger.debug(`Parsed data from ${result.response.url}`, { 
            parseRule: result.task.parse,
            parsedKeys: typeof parsed === 'object' && parsed ? Object.keys(parsed) : 'primitive',
          });
        }
      } else {
        if (this.context?.logger) {
          this.context.logger.warn(`No Cheerio instance available for parsing: ${result.response.url}`);
        }
      }
    } catch (error) {
      if (this.config.throwOnError) {
        throw new Error(`Parse error for ${result.response.url}: ${error}`);
      } else {
        if (this.context?.logger) {
          this.context.logger.error(`Parse error for ${result.response.url}: ${error}`);
        }
        result.parsed = null;
      }
    }

    return result;
  }

  /**
   * Handle parse context hook
   */
  async onParse(context: ParseContext): Promise<any> {
    if (!this.enabled) return undefined;

    // This hook can be used by other plugins to modify parse context
    return undefined;
  }

  /**
   * Add custom filter
   */
  addFilter(name: string, filter: Function): void {
    this.parser.addFilter(name, filter);
  }

  /**
   * Add multiple custom filters
   */
  addFilters(filters: Record<string, Function>): void {
    this.parser.addFilters(filters);
  }

  /**
   * Get available filters
   */
  getFilters(): Record<string, Function> {
    return this.parser.getFilters();
  }

  /**
   * Update plugin configuration
   */
  updateConfig(config: Partial<ParsePluginConfig>): void {
    Object.assign(this.config, config);
    
    // Update parser with new custom filters if provided
    if (config.customFilters) {
      this.parser.addFilters(config.customFilters);
    }
  }

  /**
   * Get plugin configuration
   */
  getConfig(): ParsePluginConfig {
    return { ...this.config };
  }

  /**
   * Get plugin statistics
   */
  getStats() {
    return {
      enabled: this.enabled,
      config: this.config,
      availableFilters: Object.keys(this.parser.getFilters()).length,
    };
  }

  /**
   * Test parse rule against HTML
   */
  async testParseRule(html: string, parseRule: any): Promise<any> {
    try {
      const cheerio = await import('cheerio');
      const $ = cheerio.load(html);
      return this.parser.parse(parseRule, $);
    } catch (error) {
      throw new Error(`Parse rule test failed: ${error}`);
    }
  }

  /**
   * Validate parse rule
   */
  validateParseRule(parseRule: any): boolean {
    return this.parser.validate(parseRule);
  }
}
