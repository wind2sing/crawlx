/**
 * Type definitions for CrawlX
 */

import { CheerioAPI } from 'cheerio';

// Core types
export type CrawlerMode = 'lightweight' | 'high-performance';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

// Configuration types
export interface CrawlerOptions {
  mode?: CrawlerMode;
  concurrency?: number;
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  userAgent?: string;
  headers?: Record<string, string>;
  proxy?: string;
  followRedirects?: boolean;
  maxRedirects?: number;
  cookies?: boolean;
  logLevel?: LogLevel;
  plugins?: {
    parse?: {
      enabled?: boolean;
      validateRules?: boolean;
      throwOnError?: boolean;
      customFilters?: Record<string, Function>;
    };
    follow?: {
      enabled?: boolean;
      maxDepth?: number;
      sameDomainOnly?: boolean;
      deduplicateUrls?: boolean;
      maxLinksPerPage?: number;
    };
    retry?: {
      enabled?: boolean;
      maxRetries?: number;
      retryDelay?: number;
      exponentialBackoff?: boolean;
      backoffMultiplier?: number;
      maxDelay?: number;
    };
    delay?: {
      enabled?: boolean;
      defaultDelay?: number;
      randomDelay?: boolean;
      randomRange?: [number, number];
      perDomainDelay?: Record<string, number>;
    };
    duplicateFilter?: {
      enabled?: boolean;
      normalizeUrls?: boolean;
      ignoreQuery?: boolean;
      ignoreFragment?: boolean;
      ignoreCase?: boolean;
      maxCacheSize?: number;
    };
    rateLimit?: {
      enabled?: boolean;
      globalLimit?: {
        requests: number;
        window: number;
      };
      perDomainLimit?: {
        requests: number;
        window: number;
      };
      respectRetryAfter?: boolean;
    };
  };
  filters?: Record<string, FilterFunction>;
}

export interface TaskOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string | Buffer | object;
  priority?: number;
  retries?: number;
  delay?: number;
  timeout?: number;
  parse?: ParseRule;
  follow?: FollowRule;
  metadata?: Record<string, any>;
  callback?: (result: TaskResult) => void | Promise<void>;
}

export interface HttpClientOptions {
  timeout?: number;
  userAgent?: string;
  headers?: Record<string, string>;
  proxy?: string;
  followRedirects?: boolean;
  maxRedirects?: number;
  cookies?: boolean;
  keepAlive?: boolean;
  maxSockets?: number;
}

export interface SchedulerOptions {
  concurrency?: number;
  maxQueueSize?: number;
  priorityLevels?: number;
  resourceLimits?: {
    memory?: number;
    cpu?: number;
  };
}

// Parser types
export type ParseRule = 
  | string 
  | ParseObject 
  | ParseArray 
  | ParseFunction;

export interface ParseObject {
  [key: string]: ParseRule;
}

export type ParseArray = [string, ParseRule, ...FilterFunction[]];

export type ParseFunction = (context: ParseContext) => any;

export interface ParseContext {
  $: CheerioAPI;
  url: string;
  response: HttpResponse;
  metadata: Record<string, any>;
}

export type FilterFunction = (value: any, ...args: any[]) => any;

export interface QueryInfo {
  selector?: string;
  attribute?: string;
  filters: FilterInfo[];
  getAll: boolean;
}

export interface FilterInfo {
  name: string;
  args: any[];
}

// Follow types
export type FollowRule = 
  | string 
  | FollowFunction 
  | FollowArray;

export type FollowFunction = (context: FollowContext) => TaskOptions | TaskOptions[] | null;

export type FollowArray = [string, FollowFunction?, FilterFunction?];

export interface FollowContext {
  $: CheerioAPI;
  url: string;
  response: HttpResponse;
  links: string[];
  metadata: Record<string, any>;
}

// HTTP types
export interface HttpResponse {
  statusCode: number;
  statusMessage: string;
  headers: Record<string, string>;
  body: string | Buffer;
  url: string;
  redirectUrls: string[];
  timing: {
    start: number;
    dns?: number;
    tcp?: number;
    tls?: number;
    request: number;
    firstByte: number;
    download: number;
    total: number;
  };
}

export interface HttpRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string | Buffer;
  timeout: number;
}

// Task types
export interface TaskResult {
  task: TaskOptions;
  response: HttpResponse;
  parsed?: any;
  followed?: TaskOptions[];
  error?: Error;
  retries: number;
  duration: number;
  timestamp: number;
}

export interface TaskState {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: number;
  retries: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: Error;
}

// Plugin types
export interface PluginInterface {
  name: string;
  version?: string;
  priority?: number;
  
  // Lifecycle hooks
  onInit?(crawler: any): void | Promise<void>;
  onStart?(crawler: any): void | Promise<void>;
  onStop?(crawler: any): void | Promise<void>;
  onDestroy?(crawler: any): void | Promise<void>;
  
  // Task hooks
  onTaskCreate?(task: TaskOptions): TaskOptions | Promise<TaskOptions>;
  onTaskStart?(task: TaskOptions): void | Promise<void>;
  onTaskComplete?(result: TaskResult): TaskResult | Promise<TaskResult>;
  onTaskError?(error: Error, task: TaskOptions): void | Promise<void>;
  onTaskRetry?(task: TaskOptions, attempt: number): void | Promise<void>;
  
  // Request/Response hooks
  onRequest?(request: HttpRequest): HttpRequest | Promise<HttpRequest>;
  onResponse?(response: HttpResponse): HttpResponse | Promise<HttpResponse>;
  
  // Parse hooks
  onParse?(context: ParseContext): any | Promise<any>;
  onFollow?(context: FollowContext): TaskOptions[] | Promise<TaskOptions[]>;
}

// Event types
export interface CrawlerEvents {
  'start': () => void;
  'stop': () => void;
  'task:created': (task: TaskOptions) => void;
  'task:started': (task: TaskOptions) => void;
  'task:completed': (result: TaskResult) => void;
  'task:failed': (error: Error, task: TaskOptions) => void;
  'task:retried': (task: TaskOptions, attempt: number) => void;
  'queue:empty': () => void;
  'queue:full': () => void;
  'error': (error: Error) => void;
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
