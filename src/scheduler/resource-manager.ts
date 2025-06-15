/**
 * Resource Manager - Manages system resources and limits
 */

import { EventEmitter } from 'events';
import { loadavg } from 'os';

/**
 * Resource usage information
 */
export interface ResourceUsage {
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  activeConnections: number;
  queueSize: number;
}

/**
 * Resource limits configuration
 */
export interface ResourceLimits {
  maxMemoryUsage?: number; // in bytes
  maxCpuUsage?: number; // percentage (0-100)
  maxActiveConnections?: number;
  maxQueueSize?: number;
  checkInterval?: number; // in milliseconds
}

/**
 * Resource manager events
 */
export interface ResourceManagerEvents {
  'limit-exceeded': (type: string, current: number, limit: number) => void;
  'limit-warning': (type: string, current: number, limit: number) => void;
  'resource-update': (usage: ResourceUsage) => void;
}

/**
 * Resource Manager class
 */
export class ResourceManager extends EventEmitter {
  private limits: Required<ResourceLimits>;
  private currentUsage: ResourceUsage;
  private monitoringInterval?: NodeJS.Timeout;
  private warningThreshold = 0.8; // 80% of limit triggers warning

  constructor(limits: ResourceLimits = {}) {
    super();
    
    this.limits = {
      maxMemoryUsage: limits.maxMemoryUsage ?? 1024 * 1024 * 1024, // 1GB default
      maxCpuUsage: limits.maxCpuUsage ?? 80, // 80% default
      maxActiveConnections: limits.maxActiveConnections ?? 100,
      maxQueueSize: limits.maxQueueSize ?? 1000,
      checkInterval: limits.checkInterval ?? 5000, // 5 seconds
    };

    this.currentUsage = this.getInitialUsage();
    this.startMonitoring();
  }

  /**
   * Start resource monitoring
   */
  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.updateResourceUsage();
      this.checkLimits();
    }, this.limits.checkInterval);
  }

  /**
   * Stop resource monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
  }

  /**
   * Update current resource usage
   */
  private updateResourceUsage(): void {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    this.currentUsage = {
      memory: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
      },
      cpu: {
        usage: this.calculateCpuUsage(cpuUsage),
        loadAverage: loadavg(),
      },
      activeConnections: this.currentUsage.activeConnections, // Updated externally
      queueSize: this.currentUsage.queueSize, // Updated externally
    };

    this.emit('resource-update', this.currentUsage);
  }

  /**
   * Calculate CPU usage percentage
   */
  private calculateCpuUsage(cpuUsage: NodeJS.CpuUsage): number {
    // This is a simplified calculation
    // In a real implementation, you'd want to track CPU usage over time
    const totalUsage = cpuUsage.user + cpuUsage.system;
    return Math.min(100, (totalUsage / 1000000) * 100); // Convert microseconds to percentage
  }

  /**
   * Check if any limits are exceeded
   */
  private checkLimits(): void {
    // Check memory limit
    if (this.currentUsage.memory.used > this.limits.maxMemoryUsage) {
      this.emit('limit-exceeded', 'memory', this.currentUsage.memory.used, this.limits.maxMemoryUsage);
    } else if (this.currentUsage.memory.used > this.limits.maxMemoryUsage * this.warningThreshold) {
      this.emit('limit-warning', 'memory', this.currentUsage.memory.used, this.limits.maxMemoryUsage);
    }

    // Check CPU limit
    if (this.currentUsage.cpu.usage > this.limits.maxCpuUsage) {
      this.emit('limit-exceeded', 'cpu', this.currentUsage.cpu.usage, this.limits.maxCpuUsage);
    } else if (this.currentUsage.cpu.usage > this.limits.maxCpuUsage * this.warningThreshold) {
      this.emit('limit-warning', 'cpu', this.currentUsage.cpu.usage, this.limits.maxCpuUsage);
    }

    // Check active connections limit
    if (this.currentUsage.activeConnections > this.limits.maxActiveConnections) {
      this.emit('limit-exceeded', 'connections', this.currentUsage.activeConnections, this.limits.maxActiveConnections);
    } else if (this.currentUsage.activeConnections > this.limits.maxActiveConnections * this.warningThreshold) {
      this.emit('limit-warning', 'connections', this.currentUsage.activeConnections, this.limits.maxActiveConnections);
    }

    // Check queue size limit
    if (this.currentUsage.queueSize > this.limits.maxQueueSize) {
      this.emit('limit-exceeded', 'queue', this.currentUsage.queueSize, this.limits.maxQueueSize);
    } else if (this.currentUsage.queueSize > this.limits.maxQueueSize * this.warningThreshold) {
      this.emit('limit-warning', 'queue', this.currentUsage.queueSize, this.limits.maxQueueSize);
    }
  }

  /**
   * Get initial resource usage
   */
  private getInitialUsage(): ResourceUsage {
    const memUsage = process.memoryUsage();
    
    return {
      memory: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
      },
      cpu: {
        usage: 0,
        loadAverage: loadavg(),
      },
      activeConnections: 0,
      queueSize: 0,
    };
  }

  /**
   * Check if resource usage is within limits
   */
  isWithinLimits(): boolean {
    return (
      this.currentUsage.memory.used <= this.limits.maxMemoryUsage &&
      this.currentUsage.cpu.usage <= this.limits.maxCpuUsage &&
      this.currentUsage.activeConnections <= this.limits.maxActiveConnections &&
      this.currentUsage.queueSize <= this.limits.maxQueueSize
    );
  }

  /**
   * Check if specific resource is available
   */
  isResourceAvailable(type: 'memory' | 'cpu' | 'connections' | 'queue'): boolean {
    switch (type) {
      case 'memory':
        return this.currentUsage.memory.used < this.limits.maxMemoryUsage;
      case 'cpu':
        return this.currentUsage.cpu.usage < this.limits.maxCpuUsage;
      case 'connections':
        return this.currentUsage.activeConnections < this.limits.maxActiveConnections;
      case 'queue':
        return this.currentUsage.queueSize < this.limits.maxQueueSize;
      default:
        return false;
    }
  }

  /**
   * Get current resource usage
   */
  getCurrentUsage(): ResourceUsage {
    return { ...this.currentUsage };
  }

  /**
   * Get resource limits
   */
  getLimits(): Required<ResourceLimits> {
    return { ...this.limits };
  }

  /**
   * Update resource limits
   */
  updateLimits(newLimits: Partial<ResourceLimits>): void {
    Object.assign(this.limits, newLimits);
  }

  /**
   * Update active connections count
   */
  updateActiveConnections(count: number): void {
    this.currentUsage.activeConnections = count;
  }

  /**
   * Update queue size
   */
  updateQueueSize(size: number): void {
    this.currentUsage.queueSize = size;
  }

  /**
   * Get resource utilization percentage
   */
  getUtilization(): Record<string, number> {
    return {
      memory: (this.currentUsage.memory.used / this.limits.maxMemoryUsage) * 100,
      cpu: (this.currentUsage.cpu.usage / this.limits.maxCpuUsage) * 100,
      connections: (this.currentUsage.activeConnections / this.limits.maxActiveConnections) * 100,
      queue: (this.currentUsage.queueSize / this.limits.maxQueueSize) * 100,
    };
  }

  /**
   * Get available capacity
   */
  getAvailableCapacity(): Record<string, number> {
    return {
      memory: this.limits.maxMemoryUsage - this.currentUsage.memory.used,
      cpu: this.limits.maxCpuUsage - this.currentUsage.cpu.usage,
      connections: this.limits.maxActiveConnections - this.currentUsage.activeConnections,
      queue: this.limits.maxQueueSize - this.currentUsage.queueSize,
    };
  }

  /**
   * Force garbage collection if available
   */
  forceGarbageCollection(): boolean {
    if (global.gc) {
      global.gc();
      return true;
    }
    return false;
  }

  /**
   * Get memory pressure level
   */
  getMemoryPressure(): 'low' | 'medium' | 'high' | 'critical' {
    const percentage = this.getUtilization().memory;
    
    if (percentage < 50) return 'low';
    if (percentage < 70) return 'medium';
    if (percentage < 90) return 'high';
    return 'critical';
  }

  /**
   * Destroy resource manager
   */
  destroy(): void {
    this.stopMonitoring();
    this.removeAllListeners();
  }
}
