/**
 * Structured Logger System
 */

import { EventEmitter } from 'events';

import { LogLevel } from '@/types';

/**
 * Log entry interface
 */
export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
  tags?: string[];
  source?: string;
}

/**
 * Log transport interface
 */
export interface LogTransport {
  name: string;
  level: LogLevel;
  write(entry: LogEntry): void | Promise<void>;
  close?(): void | Promise<void>;
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  level: LogLevel;
  transports: LogTransport[];
  defaultContext?: Record<string, any>;
  enableColors?: boolean;
  enableTimestamp?: boolean;
  dateFormat?: string;
}

/**
 * Log levels with numeric values for comparison
 */
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

/**
 * ANSI color codes for console output
 */
const COLORS = {
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m',  // Green
  warn: '\x1b[33m',  // Yellow
  error: '\x1b[31m', // Red
  reset: '\x1b[0m',  // Reset
  bold: '\x1b[1m',   // Bold
  dim: '\x1b[2m',    // Dim
};

/**
 * Console transport for logging to stdout/stderr
 */
export class ConsoleTransport implements LogTransport {
  public readonly name = 'console';
  
  constructor(
    public level: LogLevel = 'info',
    private enableColors: boolean = true,
    private enableTimestamp: boolean = true
  ) {}

  write(entry: LogEntry): void {
    if (LOG_LEVELS[entry.level] < LOG_LEVELS[this.level]) {
      return;
    }

    const output = this.format(entry);
    
    if (entry.level === 'error') {
      console.error(output);
    } else {
      console.log(output);
    }
  }

  private format(entry: LogEntry): string {
    const parts: string[] = [];
    
    // Timestamp
    if (this.enableTimestamp) {
      const timestamp = new Date(entry.timestamp).toISOString();
      parts.push(this.enableColors ? `${COLORS.dim}${timestamp}${COLORS.reset}` : timestamp);
    }
    
    // Level
    const levelStr = entry.level.toUpperCase().padEnd(5);
    if (this.enableColors) {
      const color = COLORS[entry.level] || COLORS.reset;
      parts.push(`${color}${COLORS.bold}${levelStr}${COLORS.reset}`);
    } else {
      parts.push(levelStr);
    }
    
    // Source
    if (entry.source) {
      const source = `[${entry.source}]`;
      parts.push(this.enableColors ? `${COLORS.dim}${source}${COLORS.reset}` : source);
    }
    
    // Message
    parts.push(entry.message);
    
    // Context
    if (entry.context && Object.keys(entry.context).length > 0) {
      const contextStr = JSON.stringify(entry.context, null, 2);
      parts.push(this.enableColors ? `${COLORS.dim}${contextStr}${COLORS.reset}` : contextStr);
    }
    
    // Error
    if (entry.error) {
      const errorStr = entry.error.stack || entry.error.message;
      parts.push(this.enableColors ? `${COLORS.error}${errorStr}${COLORS.reset}` : errorStr);
    }
    
    // Tags
    if (entry.tags && entry.tags.length > 0) {
      const tagsStr = `[${entry.tags.join(', ')}]`;
      parts.push(this.enableColors ? `${COLORS.dim}${tagsStr}${COLORS.reset}` : tagsStr);
    }
    
    return parts.join(' ');
  }
}

/**
 * File transport for logging to files
 */
export class FileTransport implements LogTransport {
  public readonly name = 'file';
  private writeQueue: LogEntry[] = [];
  private isWriting = false;
  
  constructor(
    public level: LogLevel = 'info',
    private filePath: string,
    private maxFileSize: number = 10 * 1024 * 1024, // 10MB
    private maxFiles: number = 5
  ) {}

  async write(entry: LogEntry): Promise<void> {
    if (LOG_LEVELS[entry.level] < LOG_LEVELS[this.level]) {
      return;
    }

    this.writeQueue.push(entry);
    
    if (!this.isWriting) {
      await this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    this.isWriting = true;
    
    while (this.writeQueue.length > 0) {
      const entry = this.writeQueue.shift()!;
      await this.writeToFile(entry);
    }
    
    this.isWriting = false;
  }

  private async writeToFile(entry: LogEntry): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // Ensure directory exists
      const dir = path.dirname(this.filePath);
      await fs.mkdir(dir, { recursive: true });
      
      // Check file size and rotate if necessary
      await this.rotateIfNeeded();
      
      // Format and write entry
      const formatted = this.format(entry);
      await fs.appendFile(this.filePath, formatted + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private async rotateIfNeeded(): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const stats = await fs.stat(this.filePath).catch(() => null);
      
      if (stats && stats.size > this.maxFileSize) {
        const ext = path.extname(this.filePath);
        const base = path.basename(this.filePath, ext);
        const dir = path.dirname(this.filePath);
        
        // Rotate existing files
        for (let i = this.maxFiles - 1; i > 0; i--) {
          const oldFile = path.join(dir, `${base}.${i}${ext}`);
          const newFile = path.join(dir, `${base}.${i + 1}${ext}`);
          
          try {
            await fs.rename(oldFile, newFile);
          } catch {
            // File doesn't exist, continue
          }
        }
        
        // Move current file to .1
        const rotatedFile = path.join(dir, `${base}.1${ext}`);
        await fs.rename(this.filePath, rotatedFile);
      }
    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }
  }

  private format(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString();
    const level = entry.level.toUpperCase();
    const source = entry.source ? `[${entry.source}]` : '';
    
    let formatted = `${timestamp} ${level} ${source} ${entry.message}`;
    
    if (entry.context && Object.keys(entry.context).length > 0) {
      formatted += ` ${JSON.stringify(entry.context)}`;
    }
    
    if (entry.error) {
      formatted += ` ERROR: ${entry.error.stack || entry.error.message}`;
    }
    
    if (entry.tags && entry.tags.length > 0) {
      formatted += ` TAGS: [${entry.tags.join(', ')}]`;
    }
    
    return formatted;
  }

  async close(): Promise<void> {
    // Wait for queue to be processed
    while (this.isWriting || this.writeQueue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
}

/**
 * Memory transport for storing logs in memory (useful for testing)
 */
export class MemoryTransport implements LogTransport {
  public readonly name = 'memory';
  public entries: LogEntry[] = [];
  
  constructor(
    public level: LogLevel = 'debug',
    private maxEntries: number = 1000
  ) {}

  write(entry: LogEntry): void {
    if (LOG_LEVELS[entry.level] < LOG_LEVELS[this.level]) {
      return;
    }

    this.entries.push(entry);
    
    // Keep only the most recent entries
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }
  }

  clear(): void {
    this.entries = [];
  }

  getEntries(level?: LogLevel): LogEntry[] {
    if (!level) return [...this.entries];
    
    return this.entries.filter(entry => entry.level === level);
  }
}

/**
 * Main Logger class
 */
export class Logger extends EventEmitter {
  private config: LoggerConfig;
  private childLoggers = new Map<string, Logger>();

  constructor(config: Partial<LoggerConfig> = {}) {
    super();
    
    this.config = {
      level: 'info',
      transports: [new ConsoleTransport()],
      defaultContext: {},
      enableColors: true,
      enableTimestamp: true,
      dateFormat: 'ISO',
      ...config,
    };
  }

  /**
   * Create child logger with additional context
   */
  child(context: Record<string, any>, source?: string): Logger {
    const childConfig = {
      ...this.config,
      defaultContext: { ...this.config.defaultContext, ...context },
    };
    
    const child = new Logger(childConfig);
    if (source) {
      child.setSource(source);
    }
    
    this.childLoggers.set(source || 'child', child);
    return child;
  }

  /**
   * Set logger source
   */
  setSource(source: string): void {
    this.config.defaultContext = { ...this.config.defaultContext, source };
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, any>, tags?: string[]): void {
    this.log('debug', message, context, tags);
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, any>, tags?: string[]): void {
    this.log('info', message, context, tags);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, any>, tags?: string[]): void {
    this.log('warn', message, context, tags);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, context?: Record<string, any>, tags?: string[]): void {
    this.log('error', message, context, tags, error);
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    tags?: string[],
    error?: Error
  ): void {
    if (LOG_LEVELS[level] < LOG_LEVELS[this.config.level]) {
      return;
    }

    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      context: { ...this.config.defaultContext, ...context },
      error,
      tags,
      source: this.config.defaultContext?.source,
    };

    // Write to all transports
    for (const transport of this.config.transports) {
      try {
        transport.write(entry);
      } catch (transportError) {
        console.error(`Transport ${transport.name} failed:`, transportError);
      }
    }

    // Emit log event
    this.emit('log', entry);
    this.emit(`log:${level}`, entry);
  }

  /**
   * Add transport
   */
  addTransport(transport: LogTransport): void {
    this.config.transports.push(transport);
  }

  /**
   * Remove transport
   */
  removeTransport(name: string): boolean {
    const index = this.config.transports.findIndex(t => t.name === name);
    if (index !== -1) {
      this.config.transports.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Get current log level
   */
  getLevel(): LogLevel {
    return this.config.level;
  }

  /**
   * Close all transports
   */
  async close(): Promise<void> {
    await Promise.all(
      this.config.transports.map(transport => 
        transport.close ? transport.close() : Promise.resolve()
      )
    );
    
    // Close child loggers
    for (const child of this.childLoggers.values()) {
      await child.close();
    }
  }

  /**
   * Create logger instance
   */
  static create(config?: Partial<LoggerConfig>): Logger {
    return new Logger(config);
  }

  /**
   * Create console logger
   */
  static createConsole(level: LogLevel = 'info'): Logger {
    return new Logger({
      level,
      transports: [new ConsoleTransport(level)],
    });
  }

  /**
   * Create file logger
   */
  static createFile(filePath: string, level: LogLevel = 'info'): Logger {
    return new Logger({
      level,
      transports: [new FileTransport(level, filePath)],
    });
  }

  /**
   * Create combined logger (console + file)
   */
  static createCombined(filePath: string, level: LogLevel = 'info'): Logger {
    return new Logger({
      level,
      transports: [
        new ConsoleTransport(level),
        new FileTransport(level, filePath),
      ],
    });
  }
}
