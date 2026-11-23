interface Counter {
  count: number;
  resetAt: number;
}

const counters = new Map<string, Counter>();
let lastCleanedAt = 0;

function cleanup() {
  const now = Date.now();
  if (now - lastCleanedAt > 60_000) {
    for (const [key, item] of counters.entries()) {
      if (item.resetAt <= now) {
        counters.delete(key);
      }
    }
    lastCleanedAt = now;
  }
}

/**
 * Checks and increments rate limit for a given key.
 * @returns { success: boolean, remaining: number, resetAt: number }
 */
export function checkRateLimit(
  key: string,
  limit: number,
  durationMs: number
): { success: boolean; remaining: number; resetAt: number } {
  cleanup();
  const now = Date.now();
  let item = counters.get(key);

  if (!item || item.resetAt <= now) {
    item = { count: 1, resetAt: now + durationMs };
    counters.set(key, item);
    return { success: true, remaining: limit - 1, resetAt: item.resetAt };
  }

  if (item.count >= limit) {
    return { success: false, remaining: 0, resetAt: item.resetAt };
  }

  item.count += 1;
  return { success: true, remaining: limit - item.count, resetAt: item.resetAt };
}

/**
 * Reset rate limit counter for a key upon successful action.
 */
export function resetRateLimit(key: string): void {
  counters.delete(key);
}
