import { useCallback, useState } from 'react';

/**
 * 与 localStorage 同步的 useState。
 * 读取时自动反序列化；写入时自动序列化。
 * 序列化/反序列化出错时安全降级到 initialValue。
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value) => {
      setStoredValue((prev) => {
        const next = typeof value === 'function' ? value(prev) : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // 存储配额已满时静默忽略
        }
        return next;
      });
    },
    [key],
  );

  return [storedValue, setValue];
}
