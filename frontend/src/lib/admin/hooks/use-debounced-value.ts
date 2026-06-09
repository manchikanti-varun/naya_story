import { useEffect, useState } from "react";

/**
 * Returns a debounced version of the input value.
 * Updates after `delay` ms of inactivity.
 */
export function useDebouncedValue<T>(value: T, delay = 280): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
