// Polyfill Map.groupBy for Node.js < 21
if (typeof (Map as any).groupBy !== 'function') {
  (Map as any).groupBy = function <K, T>(items: Iterable<T>, callbackFn: (item: T, index: number) => K): Map<K, T[]> {
    const map = new Map<K, T[]>();
    let index = 0;
    for (const item of items) {
      const key = callbackFn(item, index++);
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(item);
    }
    return map;
  };
}

if (typeof (Object as any).groupBy !== 'function') {
  (Object as any).groupBy = function <K extends PropertyKey, T>(items: Iterable<T>, callbackFn: (item: T, index: number) => K): Record<K, T[]> {
    const obj = Object.create(null);
    let index = 0;
    for (const item of items) {
      const key = callbackFn(item, index++);
      if (!(key in obj)) {
        obj[key] = [];
      }
      obj[key].push(item);
    }
    return obj;
  };
}

