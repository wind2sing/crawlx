/**
 * Error Handling System
 */

/**
 * Base error class for CrawlX
 */
export abstract class CrawlXError extends Error {
  public readonly code: string;
  public readonly context: Record<string, any>;
  public readonly timestamp: number;
  public readonly recoverable: boolean;

  constructor(
    message: string,
    code: string,
    context: Record<string, any> = {},
    recoverable: boolean = false
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.context = context;
    this.timestamp = Date.now();
    this.recoverable = recoverable;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to JSON
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      timestamp: this.timestamp,
      recoverable: this.recoverable,
      stack: this.stack,
    };
  }

  /**
   * Create error from JSON
   */
  static fromJSON(data: any): CrawlXError {
    const error = new (this as any)(data.message, data.code, data.context, data.recoverable);
    error.stack = data.stack;
    return error;
  }
}

/**
 * Configuration errors
 */
export class ConfigurationError extends CrawlXError {
  constructor(message: string, context: Record<string, any> = {}) {
    super(message, 'CONFIGURATION_ERROR', context, false);
  }
}

/**
 * Network-related errors
 */
export class NetworkError extends CrawlXError {
  public readonly statusCode?: number;
  public readonly url: string;

  constructor(
    message: string,
    url: string,
    statusCode?: number,
    context: Record<string, any> = {}
  ) {
    super(message, 'NETWORK_ERROR', { ...context, url, statusCode }, true);
    this.statusCode = statusCode;
    this.url = url;
  }
}

/**
 * HTTP request timeout errors
 */
export class TimeoutError extends NetworkError {
  public readonly timeout: number;

  constructor(url: string, timeout: number, context: Record<string, any> = {}) {
    super(`Request timeout after ${timeout}ms`, url, undefined, { ...context, timeout });
    this.code = 'TIMEOUT_ERROR';
    this.timeout = timeout;
  }
}

/**
 * HTTP response errors
 */
export class HttpError extends NetworkError {
  constructor(
    message: string,
    url: string,
    statusCode: number,
    context: Record<string, any> = {}
  ) {
    super(message, url, statusCode, context);
    this.code = 'HTTP_ERROR';
  }
}

/**
 * Parsing errors
 */
export class ParseError extends CrawlXError {
  public readonly rule: any;
  public readonly url: string;

  constructor(
    message: string,
    rule: any,
    url: string,
    context: Record<string, any> = {}
  ) {
    super(message, 'PARSE_ERROR', { ...context, rule, url }, false);
    this.rule = rule;
    this.url = url;
  }
}

/**
 * Plugin errors
 */
export class PluginError extends CrawlXError {
  public readonly pluginName: string;
  public readonly hook?: string;

  constructor(
    message: string,
    pluginName: string,
    hook?: string,
    context: Record<string, any> = {}
  ) {
    super(message, 'PLUGIN_ERROR', { ...context, pluginName, hook }, false);
    this.pluginName = pluginName;
    this.hook = hook;
  }
}

/**
 * Scheduler errors
 */
export class SchedulerError extends CrawlXError {
  constructor(message: string, context: Record<string, any> = {}) {
    super(message, 'SCHEDULER_ERROR', context, true);
  }
}

/**
 * Resource limit errors
 */
export class ResourceLimitError extends CrawlXError {
  public readonly resourceType: string;
  public readonly currentValue: number;
  public readonly limitValue: number;

  constructor(
    resourceType: string,
    currentValue: number,
    limitValue: number,
    context: Record<string, any> = {}
  ) {
    const message = `Resource limit exceeded for ${resourceType}: ${currentValue} > ${limitValue}`;
    super(message, 'RESOURCE_LIMIT_ERROR', { ...context, resourceType, currentValue, limitValue }, true);
    this.resourceType = resourceType;
    this.currentValue = currentValue;
    this.limitValue = limitValue;
  }
}

/**
 * Validation errors
 */
export class ValidationError extends CrawlXError {
  public readonly field: string;
  public readonly value: any;

  constructor(
    message: string,
    field: string,
    value: any,
    context: Record<string, any> = {}
  ) {
    super(message, 'VALIDATION_ERROR', { ...context, field, value }, false);
    this.field = field;
    this.value = value;
  }
}

/**
 * Error handler interface
 */
export interface ErrorHandler {
  canHandle(error: Error): boolean;
  handle(error: Error, context?: Record<string, any>): Promise<void> | void;
}

/**
 * Retry error handler
 */
export class RetryErrorHandler implements ErrorHandler {
  constructor(
    private maxRetries: number = 3,
    private retryDelay: number = 1000,
    private retryableErrors: string[] = ['NETWORK_ERROR', 'TIMEOUT_ERROR', 'HTTP_ERROR']
  ) {}

  canHandle(error: Error): boolean {
    if (error instanceof CrawlXError) {
      return error.recoverable && this.retryableErrors.includes(error.code);
    }
    return false;
  }

  async handle(error: Error, context: Record<string, any> = {}): Promise<void> {
    const retryCount = context.retryCount || 0;
    
    if (retryCount < this.maxRetries) {
      const delay = this.retryDelay * Math.pow(2, retryCount); // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // The actual retry logic would be handled by the caller
      throw new Error(`Retry attempt ${retryCount + 1}`);
    } else {
      throw new Error(`Max retries (${this.maxRetries}) exceeded for error: ${error.message}`);
    }
  }
}

/**
 * Logging error handler
 */
export class LoggingErrorHandler implements ErrorHandler {
  constructor(private logger: any) {}

  canHandle(): boolean {
    return true; // Can handle any error
  }

  handle(error: Error, context: Record<string, any> = {}): void {
    if (error instanceof CrawlXError) {
      this.logger.error(error.message, error, {
        code: error.code,
        context: error.context,
        recoverable: error.recoverable,
        ...context,
      });
    } else {
      this.logger.error(error.message, error, context);
    }
  }
}

/**
 * Circuit breaker error handler
 */
export class CircuitBreakerErrorHandler implements ErrorHandler {
  private failures = new Map<string, number>();
  private lastFailureTime = new Map<string, number>();

  constructor(
    private failureThreshold: number = 5,
    private resetTimeout: number = 60000 // 1 minute
  ) {}

  canHandle(error: Error): boolean {
    return error instanceof NetworkError;
  }

  handle(error: Error, context: Record<string, any> = {}): void {
    if (!(error instanceof NetworkError)) return;

    const key = error.url;
    const now = Date.now();
    
    // Reset if enough time has passed
    const lastFailure = this.lastFailureTime.get(key);
    if (lastFailure && now - lastFailure > this.resetTimeout) {
      this.failures.delete(key);
      this.lastFailureTime.delete(key);
    }

    // Increment failure count
    const currentFailures = this.failures.get(key) || 0;
    this.failures.set(key, currentFailures + 1);
    this.lastFailureTime.set(key, now);

    // Check if circuit should be opened
    if (currentFailures >= this.failureThreshold) {
      throw new CrawlXError(
        `Circuit breaker opened for ${key} after ${currentFailures} failures`,
        'CIRCUIT_BREAKER_OPEN',
        { url: key, failures: currentFailures },
        false
      );
    }
  }

  /**
   * Check if circuit is open for a URL
   */
  isCircuitOpen(url: string): boolean {
    const failures = this.failures.get(url) || 0;
    return failures >= this.failureThreshold;
  }

  /**
   * Reset circuit for a URL
   */
  resetCircuit(url: string): void {
    this.failures.delete(url);
    this.lastFailureTime.delete(url);
  }
}

/**
 * Error manager for coordinating multiple error handlers
 */
export class ErrorManager {
  private handlers: ErrorHandler[] = [];

  /**
   * Add error handler
   */
  addHandler(handler: ErrorHandler): void {
    this.handlers.push(handler);
  }

  /**
   * Remove error handler
   */
  removeHandler(handler: ErrorHandler): boolean {
    const index = this.handlers.indexOf(handler);
    if (index !== -1) {
      this.handlers.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Handle error with all applicable handlers
   */
  async handleError(error: Error, context: Record<string, any> = {}): Promise<void> {
    for (const handler of this.handlers) {
      if (handler.canHandle(error)) {
        try {
          await handler.handle(error, context);
        } catch (handlerError) {
          // Handler itself failed, continue with next handler
          console.error(`Error handler failed:`, handlerError);
        }
      }
    }
  }

  /**
   * Create error manager with default handlers
   */
  static createDefault(logger?: any): ErrorManager {
    const manager = new ErrorManager();
    
    if (logger) {
      manager.addHandler(new LoggingErrorHandler(logger));
    }
    
    manager.addHandler(new RetryErrorHandler());
    manager.addHandler(new CircuitBreakerErrorHandler());
    
    return manager;
  }
}

/**
 * Error utilities
 */
export class ErrorUtils {
  /**
   * Check if error is recoverable
   */
  static isRecoverable(error: Error): boolean {
    if (error instanceof CrawlXError) {
      return error.recoverable;
    }
    
    // Check for common recoverable error patterns
    const recoverablePatterns = [
      /ECONNRESET/,
      /ECONNREFUSED/,
      /ETIMEDOUT/,
      /ENOTFOUND/,
      /socket hang up/i,
    ];
    
    return recoverablePatterns.some(pattern => pattern.test(error.message));
  }

  /**
   * Extract error code from error
   */
  static getErrorCode(error: Error): string {
    if (error instanceof CrawlXError) {
      return error.code;
    }
    
    // Try to extract code from error properties
    if ('code' in error && typeof error.code === 'string') {
      return error.code;
    }
    
    return 'UNKNOWN_ERROR';
  }

  /**
   * Create error from HTTP response
   */
  static fromHttpResponse(url: string, statusCode: number, statusMessage: string): HttpError {
    return new HttpError(`HTTP ${statusCode}: ${statusMessage}`, url, statusCode);
  }

  /**
   * Wrap unknown error as CrawlX error
   */
  static wrap(error: unknown, context: Record<string, any> = {}): CrawlXError {
    if (error instanceof CrawlXError) {
      return error;
    }
    
    if (error instanceof Error) {
      return new CrawlXError(error.message, 'WRAPPED_ERROR', { ...context, originalError: error.name }, false);
    }
    
    return new CrawlXError(String(error), 'UNKNOWN_ERROR', context, false);
  }

  /**
   * Check if error should trigger retry
   */
  static shouldRetry(error: Error, attempt: number, maxRetries: number): boolean {
    if (attempt >= maxRetries) {
      return false;
    }
    
    return this.isRecoverable(error);
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  static calculateRetryDelay(attempt: number, baseDelay: number = 1000, maxDelay: number = 30000): number {
    const delay = baseDelay * Math.pow(2, attempt - 1);
    return Math.min(delay, maxDelay);
  }
}
