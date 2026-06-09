import { useCallback, useState } from "react";

/**
 * Reusable bulk selection state for lists/tables.
 * Manages a Set of selected IDs with toggle, toggleAll, and clear.
 */
export function useBulkSelect<T extends string = string>(allIds: T[]) {
  const [selected, setSelected] = useState<Set<T>>(new Set());

  const toggle = useCallback((id: T) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      if (prev.size === allIds.length) return new Set();
      return new Set(allIds);
    });
  }, [allIds]);

  const clear = useCallback(() => setSelected(new Set()), []);

  const isAllSelected = allIds.length > 0 && selected.size === allIds.length;
  const hasSelection = selected.size > 0;

  return {
    selected,
    toggle,
    toggleAll,
    clear,
    isAllSelected,
    hasSelection,
    count: selected.size,
  };
}
