/**
 * Configuration Utilities
 */

import { DeepPartial } from '@/types';

/**
 * Deep merge two objects
 */
export function mergeConfig<T extends Record<string, any>>(
  target: T,
  source: DeepPartial<T>
): T {
  const result = { ...target };

  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = result[key];

    if (isObject(sourceValue) && isObject(targetValue)) {
      result[key] = mergeConfig(targetValue, sourceValue);
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue as any;
    }
  }

  return result;
}

/**
 * Check if value is a plain object
 */
function isObject(value: any): value is Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any;
  }

  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as any;
  }

  if (typeof obj === 'object') {
    const cloned: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }

  return obj;
}

/**
 * Get nested property value using dot notation
 */
export function getNestedValue(obj: any, path: string, defaultValue?: any): any {
  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined || !(key in current)) {
      return defaultValue;
    }
    current = current[key];
  }

  return current;
}

/**
 * Set nested property value using dot notation
 */
export function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || !isObject(current[key])) {
      current[key] = {};
    }
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
}

/**
 * Delete nested property using dot notation
 */
export function deleteNestedValue(obj: any, path: string): boolean {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || !isObject(current[key])) {
      return false;
    }
    current = current[key];
  }

  const lastKey = keys[keys.length - 1];
  if (lastKey in current) {
    delete current[lastKey];
    return true;
  }

  return false;
}

/**
 * Flatten nested object to dot notation
 */
export function flattenObject(obj: any, prefix: string = ''): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (isObject(value)) {
      Object.assign(result, flattenObject(value, newKey));
    } else {
      result[newKey] = value;
    }
  }

  return result;
}

/**
 * Unflatten dot notation object to nested object
 */
export function unflattenObject(flat: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [path, value] of Object.entries(flat)) {
    setNestedValue(result, path, value);
  }

  return result;
}

/**
 * Check if object has nested property
 */
export function hasNestedProperty(obj: any, path: string): boolean {
  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined || !(key in current)) {
      return false;
    }
    current = current[key];
  }

  return true;
}

/**
 * Get all paths in nested object
 */
export function getAllPaths(obj: any, prefix: string = ''): string[] {
  const paths: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const currentPath = prefix ? `${prefix}.${key}` : key;
    paths.push(currentPath);

    if (isObject(value)) {
      paths.push(...getAllPaths(value, currentPath));
    }
  }

  return paths;
}

/**
 * Filter object by paths
 */
export function filterByPaths(obj: any, paths: string[]): Record<string, any> {
  const result: Record<string, any> = {};

  for (const path of paths) {
    if (hasNestedProperty(obj, path)) {
      setNestedValue(result, path, getNestedValue(obj, path));
    }
  }

  return result;
}

/**
 * Exclude paths from object
 */
export function excludePaths(obj: any, paths: string[]): Record<string, any> {
  const allPaths = getAllPaths(obj);
  const filteredPaths = allPaths.filter(path => !paths.includes(path));
  return filterByPaths(obj, filteredPaths);
}

/**
 * Transform object values
 */
export function transformValues(
  obj: any,
  transformer: (value: any, path: string) => any,
  prefix: string = ''
): any {
  if (!isObject(obj)) {
    return transformer(obj, prefix);
  }

  const result: any = {};

  for (const [key, value] of Object.entries(obj)) {
    const currentPath = prefix ? `${prefix}.${key}` : key;

    if (isObject(value)) {
      result[key] = transformValues(value, transformer, currentPath);
    } else {
      result[key] = transformer(value, currentPath);
    }
  }

  return result;
}

/**
 * Validate object structure against template
 */
export function validateStructure(
  obj: any,
  template: any,
  strict: boolean = false
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  function validateRecursive(current: any, tmpl: any, path: string = ''): void {
    if (tmpl === null || tmpl === undefined) {
      return; // No validation required
    }

    if (typeof tmpl === 'function') {
      // Custom validator function
      try {
        const result = tmpl(current, path);
        if (result !== true) {
          errors.push(`Validation failed at ${path}: ${result}`);
        }
      } catch (error) {
        errors.push(`Validation error at ${path}: ${error}`);
      }
      return;
    }

    if (Array.isArray(tmpl)) {
      if (!Array.isArray(current)) {
        errors.push(`Expected array at ${path}, got ${typeof current}`);
        return;
      }

      if (tmpl.length > 0) {
        // Validate each array element against first template element
        const elementTemplate = tmpl[0];
        current.forEach((item, index) => {
          validateRecursive(item, elementTemplate, `${path}[${index}]`);
        });
      }
      return;
    }

    if (isObject(tmpl)) {
      if (!isObject(current)) {
        errors.push(`Expected object at ${path}, got ${typeof current}`);
        return;
      }

      // Check required properties
      for (const key in tmpl) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (!(key in current)) {
          errors.push(`Missing required property: ${currentPath}`);
        } else {
          validateRecursive(current[key], tmpl[key], currentPath);
        }
      }

      // Check for extra properties in strict mode
      if (strict) {
        for (const key in current) {
          if (!(key in tmpl)) {
            const currentPath = path ? `${path}.${key}` : key;
            errors.push(`Unexpected property: ${currentPath}`);
          }
        }
      }
      return;
    }

    // Primitive type validation
    if (typeof current !== typeof tmpl) {
      errors.push(`Type mismatch at ${path}: expected ${typeof tmpl}, got ${typeof current}`);
    }
  }

  validateRecursive(obj, template);

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create object diff
 */
export function createDiff(
  oldObj: any,
  newObj: any,
  prefix: string = ''
): Array<{ path: string; type: 'added' | 'removed' | 'changed'; oldValue?: any; newValue?: any }> {
  const changes: Array<{ path: string; type: 'added' | 'removed' | 'changed'; oldValue?: any; newValue?: any }> = [];

  const oldPaths = new Set(getAllPaths(oldObj));
  const newPaths = new Set(getAllPaths(newObj));

  // Find added paths
  for (const path of newPaths) {
    if (!oldPaths.has(path)) {
      changes.push({
        path,
        type: 'added',
        newValue: getNestedValue(newObj, path),
      });
    }
  }

  // Find removed paths
  for (const path of oldPaths) {
    if (!newPaths.has(path)) {
      changes.push({
        path,
        type: 'removed',
        oldValue: getNestedValue(oldObj, path),
      });
    }
  }

  // Find changed paths
  for (const path of oldPaths) {
    if (newPaths.has(path)) {
      const oldValue = getNestedValue(oldObj, path);
      const newValue = getNestedValue(newObj, path);

      if (!deepEqual(oldValue, newValue)) {
        changes.push({
          path,
          type: 'changed',
          oldValue,
          newValue,
        });
      }
    }
  }

  return changes;
}

/**
 * Deep equality check
 */
export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;

  if (a === null || b === null) return a === b;
  if (a === undefined || b === undefined) return a === b;

  if (typeof a !== typeof b) return false;

  if (typeof a === 'object') {
    if (Array.isArray(a) !== Array.isArray(b)) return false;

    if (Array.isArray(a)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => deepEqual(item, b[index]));
    }

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    return keysA.every(key => deepEqual(a[key], b[key]));
  }

  return false;
}
