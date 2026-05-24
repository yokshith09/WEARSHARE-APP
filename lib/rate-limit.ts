import { redis } from "@/lib/redis";

export const rateLimit = (options?: {
  interval?: number;
  uniqueTokenPerInterval?: number;
}) => {
  const tokenCache = new Map();
  const interval = options?.interval || 60000; // 1 minute
  const limit = options?.uniqueTokenPerInterval || 10;

  return {
    check: async (limit: number, token: string) => {
      if (redis) {
        const key = `rate:${token}`;
        const count = await redis.incr(key);
        if (count === 1) {
          await redis.expire(key, Math.ceil(interval / 1000));
        }
        if (count > limit) {
          throw new Error("Rate limit exceeded");
        }
        return;
      }

      return new Promise<void>((resolve, reject) => {
        const tokenCount = tokenCache.get(token) || [0];
        if (tokenCount[0] === 0) {
          tokenCache.set(token, [1]);
          setTimeout(() => {
            tokenCache.delete(token);
          }, interval);
          resolve();
        } else {
          tokenCount[0] += 1;
          tokenCache.set(token, tokenCount);
          if (tokenCount[0] > limit) {
            reject(new Error("Rate limit exceeded"));
          } else {
            resolve();
          }
        }
      });
    },
  };
};

// Global rate limiter instance (In-memory, suitable for single-instance Next.js MVP)
export const apiLimiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500, // Max 500 users per interval
});
