/**
 * URL Utilities
 */

/**
 * URL validation and normalization utilities
 */
export class UrlUtils {
  /**
   * Validate if string is a valid URL
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Normalize URL for consistent comparison
   */
  static normalize(url: string, options: {
    removeFragment?: boolean;
    removeQuery?: boolean;
    removeTrailingSlash?: boolean;
    lowercase?: boolean;
    sortQuery?: boolean;
  } = {}): string {
    const {
      removeFragment = false,
      removeQuery = false,
      removeTrailingSlash = true,
      lowercase = true,
      sortQuery = false,
    } = options;

    try {
      const urlObj = new URL(url);

      // Normalize protocol
      urlObj.protocol = urlObj.protocol.toLowerCase();

      // Normalize hostname
      urlObj.hostname = urlObj.hostname.toLowerCase();

      // Remove default ports
      if (
        (urlObj.protocol === 'http:' && urlObj.port === '80') ||
        (urlObj.protocol === 'https:' && urlObj.port === '443')
      ) {
        urlObj.port = '';
      }

      // Handle path
      if (lowercase) {
        urlObj.pathname = urlObj.pathname.toLowerCase();
      }

      // Remove trailing slash from path (except for root)
      if (removeTrailingSlash && urlObj.pathname !== '/' && urlObj.pathname.endsWith('/')) {
        urlObj.pathname = urlObj.pathname.slice(0, -1);
      }

      // Handle query parameters
      if (removeQuery) {
        urlObj.search = '';
      } else if (sortQuery && urlObj.search) {
        const params = new URLSearchParams(urlObj.search);
        const sortedParams = new URLSearchParams();
        
        // Sort parameters by key
        const keys = Array.from(params.keys()).sort();
        for (const key of keys) {
          const values = params.getAll(key);
          for (const value of values) {
            sortedParams.append(key, value);
          }
        }
        
        urlObj.search = sortedParams.toString();
      }

      // Handle fragment
      if (removeFragment) {
        urlObj.hash = '';
      }

      return urlObj.toString();
    } catch {
      return url; // Return original if normalization fails
    }
  }

  /**
   * Resolve relative URL against base URL
   */
  static resolve(url: string, base: string): string {
    try {
      return new URL(url, base).toString();
    } catch {
      return url;
    }
  }

  /**
   * Extract domain from URL
   */
  static getDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  }

  /**
   * Extract protocol from URL
   */
  static getProtocol(url: string): string {
    try {
      return new URL(url).protocol;
    } catch {
      return '';
    }
  }

  /**
   * Check if two URLs are from the same domain
   */
  static isSameDomain(url1: string, url2: string): boolean {
    try {
      const domain1 = new URL(url1).hostname;
      const domain2 = new URL(url2).hostname;
      return domain1 === domain2;
    } catch {
      return false;
    }
  }

  /**
   * Check if URL is from subdomain of given domain
   */
  static isSubdomain(url: string, domain: string): boolean {
    try {
      const urlDomain = new URL(url).hostname;
      return urlDomain === domain || urlDomain.endsWith(`.${domain}`);
    } catch {
      return false;
    }
  }

  /**
   * Extract path from URL
   */
  static getPath(url: string): string {
    try {
      return new URL(url).pathname;
    } catch {
      return '';
    }
  }

  /**
   * Extract query parameters from URL
   */
  static getQueryParams(url: string): Record<string, string> {
    try {
      const params: Record<string, string> = {};
      const searchParams = new URL(url).searchParams;
      
      for (const [key, value] of searchParams.entries()) {
        params[key] = value;
      }
      
      return params;
    } catch {
      return {};
    }
  }

  /**
   * Add or update query parameter
   */
  static setQueryParam(url: string, key: string, value: string): string {
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set(key, value);
      return urlObj.toString();
    } catch {
      return url;
    }
  }

  /**
   * Remove query parameter
   */
  static removeQueryParam(url: string, key: string): string {
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.delete(key);
      return urlObj.toString();
    } catch {
      return url;
    }
  }

  /**
   * Check if URL matches pattern
   */
  static matchesPattern(url: string, pattern: string | RegExp): boolean {
    if (typeof pattern === 'string') {
      // Simple glob-like pattern matching
      const regexPattern = pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');
      
      return new RegExp(`^${regexPattern}$`).test(url);
    } else {
      return pattern.test(url);
    }
  }

  /**
   * Extract file extension from URL path
   */
  static getExtension(url: string): string {
    try {
      const pathname = new URL(url).pathname;
      const lastDot = pathname.lastIndexOf('.');
      const lastSlash = pathname.lastIndexOf('/');
      
      if (lastDot > lastSlash && lastDot !== -1) {
        return pathname.slice(lastDot + 1).toLowerCase();
      }
      
      return '';
    } catch {
      return '';
    }
  }

  /**
   * Check if URL points to a file with given extensions
   */
  static hasExtension(url: string, extensions: string[]): boolean {
    const ext = this.getExtension(url);
    return extensions.map(e => e.toLowerCase()).includes(ext);
  }

  /**
   * Generate URL fingerprint for deduplication
   */
  static fingerprint(url: string, options: {
    ignoreQuery?: boolean;
    ignoreFragment?: boolean;
    ignoreCase?: boolean;
  } = {}): string {
    const normalized = this.normalize(url, {
      removeFragment: options.ignoreFragment,
      removeQuery: options.ignoreQuery,
      lowercase: options.ignoreCase,
      removeTrailingSlash: true,
      sortQuery: true,
    });
    
    return normalized;
  }

  /**
   * Parse robots.txt URL from base URL
   */
  static getRobotsUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.host}/robots.txt`;
    } catch {
      return '';
    }
  }

  /**
   * Parse sitemap URL from base URL
   */
  static getSitemapUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.host}/sitemap.xml`;
    } catch {
      return '';
    }
  }

  /**
   * Check if URL is likely a feed (RSS/Atom)
   */
  static isFeedUrl(url: string): boolean {
    const feedPatterns = [
      /\/feed\/?$/i,
      /\/rss\/?$/i,
      /\/atom\/?$/i,
      /\.rss$/i,
      /\.xml$/i,
      /\/feed\.xml$/i,
      /\/rss\.xml$/i,
      /\/atom\.xml$/i,
    ];
    
    return feedPatterns.some(pattern => pattern.test(url));
  }

  /**
   * Check if URL is likely an image
   */
  static isImageUrl(url: string): boolean {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
    return this.hasExtension(url, imageExtensions);
  }

  /**
   * Check if URL is likely a document
   */
  static isDocumentUrl(url: string): boolean {
    const docExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];
    return this.hasExtension(url, docExtensions);
  }

  /**
   * Check if URL is likely a media file
   */
  static isMediaUrl(url: string): boolean {
    const mediaExtensions = ['mp3', 'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'ogg', 'wav'];
    return this.hasExtension(url, mediaExtensions);
  }

  /**
   * Generate URL variations for testing
   */
  static generateVariations(url: string): string[] {
    const variations: string[] = [url];
    
    try {
      const urlObj = new URL(url);
      
      // Add/remove trailing slash
      if (urlObj.pathname.endsWith('/')) {
        const withoutSlash = new URL(url);
        withoutSlash.pathname = withoutSlash.pathname.slice(0, -1);
        variations.push(withoutSlash.toString());
      } else {
        const withSlash = new URL(url);
        withSlash.pathname += '/';
        variations.push(withSlash.toString());
      }
      
      // Protocol variations
      if (urlObj.protocol === 'http:') {
        const httpsUrl = new URL(url);
        httpsUrl.protocol = 'https:';
        variations.push(httpsUrl.toString());
      } else if (urlObj.protocol === 'https:') {
        const httpUrl = new URL(url);
        httpUrl.protocol = 'http:';
        variations.push(httpUrl.toString());
      }
      
      // www variations
      if (urlObj.hostname.startsWith('www.')) {
        const withoutWww = new URL(url);
        withoutWww.hostname = withoutWww.hostname.slice(4);
        variations.push(withoutWww.toString());
      } else {
        const withWww = new URL(url);
        withWww.hostname = `www.${withWww.hostname}`;
        variations.push(withWww.toString());
      }
      
    } catch {
      // If URL parsing fails, return original
    }
    
    return [...new Set(variations)]; // Remove duplicates
  }
}

/**
 * Validate URL against common patterns
 */
export function validateUrl(url: string): { valid: boolean; error?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL must be a non-empty string' };
  }

  if (!UrlUtils.isValidUrl(url)) {
    return { valid: false, error: 'Invalid URL format' };
  }

  const urlObj = new URL(url);

  // Check protocol
  if (!['http:', 'https:'].includes(urlObj.protocol)) {
    return { valid: false, error: 'Only HTTP and HTTPS protocols are supported' };
  }

  // Check hostname
  if (!urlObj.hostname) {
    return { valid: false, error: 'URL must have a hostname' };
  }

  return { valid: true };
}
