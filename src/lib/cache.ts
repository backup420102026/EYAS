// Tiny per-instance in-memory cache. It shields the database from bursts of visitors:
// many requests inside the TTL share one set of queries (and concurrent ones share one in-flight query).
type Entry = { at: number; value: unknown; pending?: Promise<unknown> };

const store = new Map<string, Entry>();

export async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const entry = store.get(key);
  if (entry && entry.value !== undefined && Date.now() - entry.at < ttlMs) {
    return entry.value as T;
  }
  if (entry?.pending) return entry.pending as Promise<T>;

  const pending = fn()
    .then((value) => {
      store.set(key, { at: Date.now(), value });
      return value;
    })
    .catch((error) => {
      store.delete(key);
      throw error;
    });
  store.set(key, { at: entry?.at ?? 0, value: entry?.value, pending });
  return pending;
}

/** Call after the admin changes something the public page shows. */
export function clearCache() {
  store.clear();
}
