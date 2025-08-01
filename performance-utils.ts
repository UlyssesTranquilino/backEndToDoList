// Performance utility functions for flashcard optimization

// Debounce function to limit expensive operations
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
}

// Throttle function for frequent events like typing
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Memoization utility for expensive calculations
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map();
  
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    // Limit cache size to prevent memory leaks
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  }) as T;
}

// Request Animation Frame wrapper for smooth updates
export function raf(callback: () => void): void {
  if (typeof window !== 'undefined') {
    requestAnimationFrame(callback);
  }
}

// Intersection Observer for lazy loading
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
): IntersectionObserver | null {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }
  
  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  });
}

// Virtual scrolling utility for large lists
export class VirtualScroller {
  private container: HTMLElement;
  private itemHeight: number;
  private items: any[];
  private visibleCount: number;
  private scrollTop = 0;
  
  constructor(
    container: HTMLElement,
    itemHeight: number,
    items: any[],
    visibleCount: number
  ) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.items = items;
    this.visibleCount = visibleCount;
  }
  
  getVisibleRange() {
    const startIndex = Math.floor(this.scrollTop / this.itemHeight);
    const endIndex = Math.min(
      startIndex + this.visibleCount,
      this.items.length
    );
    
    return {
      startIndex: Math.max(0, startIndex),
      endIndex,
      offsetY: startIndex * this.itemHeight,
    };
  }
  
  updateScrollTop(scrollTop: number) {
    this.scrollTop = scrollTop;
  }
}

// Local storage with compression for large datasets
export const compressedStorage = {
  set: (key: string, value: any) => {
    try {
      const compressed = JSON.stringify(value);
      localStorage.setItem(key, compressed);
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  },
  
  get: (key: string) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
      return null;
    }
  },
  
  remove: (key: string) => {
    localStorage.removeItem(key);
  }
};

// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  startMeasure(name: string): void {
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-start`);
    }
  }
  
  endMeasure(name: string): number {
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      
      const measure = performance.getEntriesByName(name, 'measure')[0];
      const duration = measure?.duration || 0;
      
      // Store metrics
      if (!this.metrics.has(name)) {
        this.metrics.set(name, []);
      }
      
      const values = this.metrics.get(name)!;
      values.push(duration);
      
      // Keep only last 10 measurements
      if (values.length > 10) {
        values.shift();
      }
      
      // Clean up performance entries
      performance.clearMarks(`${name}-start`);
      performance.clearMarks(`${name}-end`);
      performance.clearMeasures(name);
      
      return duration;
    }
    return 0;
  }
  
  getAverageTime(name: string): number {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return 0;
    
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
  
  logMetrics(): void {
    console.group('Performance Metrics');
    this.metrics.forEach((values, name) => {
      const avg = this.getAverageTime(name);
      console.log(`${name}: ${avg.toFixed(2)}ms (avg of ${values.length} measurements)`);
    });
    console.groupEnd();
  }
}