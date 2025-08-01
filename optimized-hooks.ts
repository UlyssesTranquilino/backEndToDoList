import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { debounce, throttle, PerformanceMonitor } from './performance-utils';

// Optimized state hook with debounced updates
export function useDebouncedState<T>(
  initialValue: T,
  delay = 300
): [T, T, (value: T) => void] {
  const [immediateValue, setImmediateValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);

  const debouncedUpdate = useMemo(
    () => debounce((value: T) => setDebouncedValue(value), delay),
    [delay]
  );

  const setValue = useCallback((value: T) => {
    setImmediateValue(value);
    debouncedUpdate(value);
  }, [debouncedUpdate]);

  return [immediateValue, debouncedValue, setValue];
}

// Hook for throttled input handling
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay = 100
): T {
  const throttledCallback = useMemo(
    () => throttle(callback, delay),
    [callback, delay]
  );

  return throttledCallback as T;
}

// Hook for managing large datasets efficiently
export function useVirtualizedData<T>(
  data: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleCount = Math.ceil(containerHeight / itemHeight) + 2; // Buffer
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount, data.length);

  const visibleItems = useMemo(() => 
    data.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index,
      style: {
        position: 'absolute' as const,
        top: (startIndex + index) * itemHeight,
        height: itemHeight,
        width: '100%',
      },
    })),
    [data, startIndex, endIndex, itemHeight]
  );

  const totalHeight = data.length * itemHeight;

  return {
    visibleItems,
    totalHeight,
    setScrollTop,
    startIndex,
    endIndex,
  };
}

// Hook for memory-conscious event handling
export function useEventListener<T extends HTMLElement = HTMLDivElement>(
  eventName: string,
  handler: (event: Event) => void,
  element?: RefObject<T> | T | null,
  options?: boolean | AddEventListenerOptions
) {
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const targetElement = element?.current ?? element ?? window;
    if (!targetElement?.addEventListener) return;

    const eventListener = (event: Event) => savedHandler.current(event);
    
    targetElement.addEventListener(eventName, eventListener, options);

    return () => {
      targetElement.removeEventListener(eventName, eventListener, options);
    };
  }, [eventName, element, options]);
}

// Hook for intersection observer (lazy loading)
export function useIntersectionObserver(
  elementRef: RefObject<Element>,
  { threshold = 0.1, root = null, rootMargin = '0%' }: IntersectionObserverInit = {}
): IntersectionObserverEntry | null {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !window.IntersectionObserver) return;

    const observer = new IntersectionObserver(
      ([entry]) => setEntry(entry),
      { threshold, root, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [elementRef, threshold, root, rootMargin]);

  return entry;
}

// Hook for performance monitoring
export function usePerformanceMonitor() {
  const monitor = useMemo(() => PerformanceMonitor.getInstance(), []);

  const measurePerformance = useCallback(
    (name: string, fn: () => void) => {
      monitor.startMeasure(name);
      fn();
      return monitor.endMeasure(name);
    },
    [monitor]
  );

  const measureAsync = useCallback(
    async (name: string, fn: () => Promise<void>) => {
      monitor.startMeasure(name);
      await fn();
      return monitor.endMeasure(name);
    },
    [monitor]
  );

  return {
    measurePerformance,
    measureAsync,
    getAverageTime: monitor.getAverageTime.bind(monitor),
    logMetrics: monitor.logMetrics.bind(monitor),
  };
}

// Hook for idle callback detection
export function useIdleCallback(
  callback: () => void,
  deps: React.DependencyList,
  options: IdleRequestOptions = {}
) {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const id = requestIdleCallback(callback, options);
      return () => cancelIdleCallback(id);
    } else {
      // Fallback for browsers without requestIdleCallback
      const id = setTimeout(callback, 0);
      return () => clearTimeout(id);
    }
  }, deps);
}

// Hook for optimized local storage
export function useOptimizedLocalStorage<T>(
  key: string,
  initialValue: T,
  options: {
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
    debounceTime?: number;
  } = {}
) {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    debounceTime = 300,
  } = options;

  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    
    try {
      const item = localStorage.getItem(key);
      return item ? deserialize(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const debouncedSave = useMemo(
    () => debounce((newValue: T) => {
      try {
        localStorage.setItem(key, serialize(newValue));
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    }, debounceTime),
    [key, serialize, debounceTime]
  );

  const setStoredValue = useCallback((newValue: T | ((prev: T) => T)) => {
    setValue(prevValue => {
      const valueToStore = typeof newValue === 'function' 
        ? (newValue as (prev: T) => T)(prevValue)
        : newValue;
      
      debouncedSave(valueToStore);
      return valueToStore;
    });
  }, [debouncedSave]);

  return [value, setStoredValue] as const;
}

// Hook for component cleanup
export function useCleanup(cleanup: () => void) {
  const cleanupRef = useRef(cleanup);
  
  useEffect(() => {
    cleanupRef.current = cleanup;
  }, [cleanup]);

  useEffect(() => {
    return () => {
      cleanupRef.current();
    };
  }, []);
}

// Hook for previous value tracking
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  
  useEffect(() => {
    ref.current = value;
  });
  
  return ref.current;
}

// Hook for force update
export function useForceUpdate() {
  const [, setTick] = useState(0);
  
  return useCallback(() => {
    setTick(tick => tick + 1);
  }, []);
}

// Hook for window size with throttling
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  const handleResize = useThrottledCallback(() => {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, 100);

  useEventListener('resize', handleResize);

  return windowSize;
}