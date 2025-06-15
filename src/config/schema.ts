/**
 * Configuration Schema Definitions
 */

import { ConfigSchema, ConfigValidator } from './config';

/**
 * URL validator
 */
const urlValidator: ConfigValidator<string> = (value: string) => {
  try {
    new URL(value);
    return true;
  } catch {
    return 'Invalid URL format';
  }
};

/**
 * Positive number validator
 */
const positiveNumberValidator: ConfigValidator<number> = (value: number) => {
  return value > 0 || 'Must be a positive number';
};

/**
 * Non-negative number validator
 */
const nonNegativeNumberValidator: ConfigValidator<number> = (value: number) => {
  return value >= 0 || 'Must be a non-negative number';
};

/**
 * Port number validator
 */
const portValidator: ConfigValidator<number> = (value: number) => {
  return (value >= 1 && value <= 65535) || 'Must be a valid port number (1-65535)';
};

/**
 * Log level validator
 */
const logLevelValidator: ConfigValidator<string> = (value: string) => {
  const validLevels = ['debug', 'info', 'warn', 'error', 'silent'];
  return validLevels.includes(value) || `Must be one of: ${validLevels.join(', ')}`;
};

/**
 * Crawler mode validator
 */
const crawlerModeValidator: ConfigValidator<string> = (value: string) => {
  const validModes = ['lightweight', 'high-performance'];
  return validModes.includes(value) || `Must be one of: ${validModes.join(', ')}`;
};

/**
 * User agent validator
 */
const userAgentValidator: ConfigValidator<string> = (value: string) => {
  return value.length > 0 || 'User agent cannot be empty';
};

/**
 * Main crawler configuration schema
 */
export const crawlerConfigSchema: ConfigSchema = {
  mode: {
    type: 'string',
    default: 'lightweight',
    validator: crawlerModeValidator,
    description: 'Crawler operation mode',
  },
  
  concurrency: {
    type: 'number',
    default: 5,
    validator: positiveNumberValidator,
    description: 'Maximum number of concurrent requests',
  },
  
  maxRetries: {
    type: 'number',
    default: 3,
    validator: nonNegativeNumberValidator,
    description: 'Maximum number of retry attempts',
  },
  
  retryDelay: {
    type: 'number',
    default: 1000,
    validator: nonNegativeNumberValidator,
    description: 'Delay between retry attempts in milliseconds',
  },
  
  timeout: {
    type: 'number',
    default: 30000,
    validator: positiveNumberValidator,
    description: 'Request timeout in milliseconds',
  },
  
  userAgent: {
    type: 'string',
    default: 'CrawlX/2.0.0',
    validator: userAgentValidator,
    description: 'User agent string for requests',
  },
  
  headers: {
    type: 'object',
    default: {},
    description: 'Default headers for requests',
  },
  
  proxy: {
    type: 'string',
    default: '',
    description: 'Proxy server URL',
  },
  
  followRedirects: {
    type: 'boolean',
    default: true,
    description: 'Whether to follow HTTP redirects',
  },
  
  maxRedirects: {
    type: 'number',
    default: 10,
    validator: nonNegativeNumberValidator,
    description: 'Maximum number of redirects to follow',
  },
  
  cookies: {
    type: 'boolean',
    default: false,
    description: 'Whether to handle cookies',
  },
  
  logLevel: {
    type: 'string',
    default: 'info',
    validator: logLevelValidator,
    description: 'Logging level',
  },
  
  // HTTP client configuration
  http: {
    keepAlive: {
      type: 'boolean',
      default: true,
      description: 'Whether to use HTTP keep-alive',
    },
    
    maxSockets: {
      type: 'number',
      default: 50,
      validator: positiveNumberValidator,
      description: 'Maximum number of sockets per host',
    },
  },
  
  // Scheduler configuration
  scheduler: {
    maxQueueSize: {
      type: 'number',
      default: 1000,
      validator: positiveNumberValidator,
      description: 'Maximum queue size',
    },
    
    priorityLevels: {
      type: 'number',
      default: 5,
      validator: positiveNumberValidator,
      description: 'Number of priority levels',
    },
    
    resourceLimits: {
      maxMemoryUsage: {
        type: 'number',
        default: 1073741824, // 1GB
        validator: positiveNumberValidator,
        description: 'Maximum memory usage in bytes',
      },
      
      maxCpuUsage: {
        type: 'number',
        default: 80,
        validator: (value: number) => 
          (value > 0 && value <= 100) || 'Must be between 1 and 100',
        description: 'Maximum CPU usage percentage',
      },
      
      maxActiveConnections: {
        type: 'number',
        default: 100,
        validator: positiveNumberValidator,
        description: 'Maximum active connections',
      },
      
      checkInterval: {
        type: 'number',
        default: 5000,
        validator: positiveNumberValidator,
        description: 'Resource check interval in milliseconds',
      },
    },
  },
  
  // Plugin configurations
  plugins: {
    parse: {
      enabled: {
        type: 'boolean',
        default: true,
        description: 'Whether parse plugin is enabled',
      },
      
      validateRules: {
        type: 'boolean',
        default: false,
        description: 'Whether to validate parse rules',
      },
      
      throwOnError: {
        type: 'boolean',
        default: true,
        description: 'Whether to throw on parse errors',
      },
    },
    
    follow: {
      enabled: {
        type: 'boolean',
        default: true,
        description: 'Whether follow plugin is enabled',
      },
      
      maxDepth: {
        type: 'number',
        default: 3,
        validator: nonNegativeNumberValidator,
        description: 'Maximum crawl depth',
      },
      
      sameDomainOnly: {
        type: 'boolean',
        default: true,
        description: 'Whether to follow same domain links only',
      },
      
      deduplicateUrls: {
        type: 'boolean',
        default: true,
        description: 'Whether to deduplicate URLs',
      },
      
      maxLinksPerPage: {
        type: 'number',
        default: 100,
        validator: positiveNumberValidator,
        description: 'Maximum links to follow per page',
      },
    },
    
    retry: {
      enabled: {
        type: 'boolean',
        default: true,
        description: 'Whether retry plugin is enabled',
      },
      
      exponentialBackoff: {
        type: 'boolean',
        default: true,
        description: 'Whether to use exponential backoff',
      },
      
      backoffMultiplier: {
        type: 'number',
        default: 2,
        validator: (value: number) => value >= 1 || 'Must be >= 1',
        description: 'Backoff multiplier for exponential backoff',
      },
      
      maxDelay: {
        type: 'number',
        default: 30000,
        validator: positiveNumberValidator,
        description: 'Maximum retry delay in milliseconds',
      },
    },
    
    delay: {
      enabled: {
        type: 'boolean',
        default: true,
        description: 'Whether delay plugin is enabled',
      },
      
      defaultDelay: {
        type: 'number',
        default: 1000,
        validator: nonNegativeNumberValidator,
        description: 'Default delay between requests in milliseconds',
      },
      
      randomDelay: {
        type: 'boolean',
        default: false,
        description: 'Whether to add random delay',
      },
    },
    
    duplicateFilter: {
      enabled: {
        type: 'boolean',
        default: true,
        description: 'Whether duplicate filter plugin is enabled',
      },
      
      normalizeUrls: {
        type: 'boolean',
        default: true,
        description: 'Whether to normalize URLs for comparison',
      },
      
      ignoreQuery: {
        type: 'boolean',
        default: false,
        description: 'Whether to ignore query parameters',
      },
      
      ignoreFragment: {
        type: 'boolean',
        default: true,
        description: 'Whether to ignore URL fragments',
      },
      
      maxCacheSize: {
        type: 'number',
        default: 10000,
        validator: positiveNumberValidator,
        description: 'Maximum cache size for seen URLs',
      },
    },
    
    rateLimit: {
      enabled: {
        type: 'boolean',
        default: true,
        description: 'Whether rate limit plugin is enabled',
      },
      
      globalLimit: {
        requests: {
          type: 'number',
          default: 100,
          validator: positiveNumberValidator,
          description: 'Global requests per window',
        },
        
        window: {
          type: 'number',
          default: 60000,
          validator: positiveNumberValidator,
          description: 'Global rate limit window in milliseconds',
        },
      },
      
      perDomainLimit: {
        requests: {
          type: 'number',
          default: 10,
          validator: positiveNumberValidator,
          description: 'Per-domain requests per window',
        },
        
        window: {
          type: 'number',
          default: 60000,
          validator: positiveNumberValidator,
          description: 'Per-domain rate limit window in milliseconds',
        },
      },
      
      respectRetryAfter: {
        type: 'boolean',
        default: true,
        description: 'Whether to respect Retry-After headers',
      },
    },
  },
};

/**
 * Create default configuration from schema
 */
export function createDefaultConfig(): Record<string, any> {
  const config: Record<string, any> = {};
  
  function extractDefaults(schema: ConfigSchema, prefix: string = ''): void {
    for (const [key, value] of Object.entries(schema)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value.type) {
        // Leaf node with default value
        if ('default' in value) {
          config[fullKey] = value.default;
        }
      } else if (typeof value === 'object') {
        // Nested schema
        extractDefaults(value as ConfigSchema, fullKey);
      }
    }
  }
  
  extractDefaults(crawlerConfigSchema);
  return config;
}

/**
 * Validate configuration against schema
 */
export function validateConfig(config: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  function validateRecursive(obj: any, schema: ConfigSchema, path: string = ''): void {
    for (const [key, schemaValue] of Object.entries(schema)) {
      const currentPath = path ? `${path}.${key}` : key;
      const value = obj?.[key];
      
      if (typeof schemaValue === 'object' && schemaValue.type) {
        // Leaf schema entry
        if (schemaValue.required && value === undefined) {
          errors.push(`Required field missing: ${currentPath}`);
        }
        
        if (value !== undefined) {
          // Type validation
          const actualType = Array.isArray(value) ? 'array' : typeof value;
          if (actualType !== schemaValue.type) {
            errors.push(`Type mismatch at ${currentPath}: expected ${schemaValue.type}, got ${actualType}`);
          }
          
          // Custom validation
          if (schemaValue.validator) {
            const result = schemaValue.validator(value, currentPath);
            if (result !== true) {
              errors.push(`Validation failed at ${currentPath}: ${result}`);
            }
          }
        }
      } else if (typeof schemaValue === 'object') {
        // Nested schema
        if (value && typeof value === 'object') {
          validateRecursive(value, schemaValue as ConfigSchema, currentPath);
        }
      }
    }
  }
  
  validateRecursive(config, crawlerConfigSchema);
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
