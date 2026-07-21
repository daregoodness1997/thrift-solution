const pendingRequests = new Map<string, Promise<any>>();
const responseCache = new Map<string, { data: any; timestamp: number }>();

const DEFAULT_TTL = 30_000;

function makeCacheKey(url: string, init?: RequestInit): string {
  return `${init?.method || "GET"}:${url}:${JSON.stringify(init?.headers || {})}`;
}

export async function fetchDeduped<T = any>(
  url: string,
  init?: RequestInit,
  ttlMs = DEFAULT_TTL,
): Promise<T> {
  const key = makeCacheKey(url, init);

  const cached = responseCache.get(key);
  if (cached && Date.now() - cached.timestamp < ttlMs) {
    return cached.data as T;
  }

  const pending = pendingRequests.get(key);
  if (pending) {
    return pending as Promise<T>;
  }

  const promise = fetch(url, init).then(async (res) => {
    const data = await res.json();
    responseCache.set(key, { data, timestamp: Date.now() });
    return data;
  }).finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, promise);
  return promise as Promise<T>;
}

export function invalidateCache(urlPattern: string): void {
  for (const key of responseCache.keys()) {
    if (key.includes(urlPattern)) {
      responseCache.delete(key);
    }
  }
}

export function clearAllCache(): void {
  responseCache.clear();
  pendingRequests.clear();
}
