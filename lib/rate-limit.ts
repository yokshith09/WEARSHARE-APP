import { redis } from "@/lib/redis";

export const rateLimit = (options?: {
  interval?: number;
  uniqueTokenPerInterval?: number;
}) => {
  const tokenCache = new Map<string, number[]>();
  const interval = options?.interval || 60000; // 1 minute

  return {
    check: async (limit: number, token: string) => {
      if (redis) {
        try {
          const key = `rate:${token}`;
          const count = await redis.incr(key);
          if (count === 1) {
            await redis.expire(key, Math.ceil(interval / 1000));
          }
          if (count > limit) {
            throw new Error("Rate limit exceeded");
          }
          return;
        } catch (redisErr: any) {
          if (redisErr?.message === "Rate limit exceeded") throw redisErr;
          // Fall through to in-memory on Redis connection issues
        }
      }

      const now = Date.now();
      const timestamps = tokenCache.get(token) || [];
      const windowStart = now - interval;
      const recentTimestamps = timestamps.filter((t) => t > windowStart);

      if (recentTimestamps.length >= limit) {
        throw new Error("Rate limit exceeded");
      }

      recentTimestamps.push(now);
      tokenCache.set(token, recentTimestamps);

      // Clean up old entries periodically
      if (tokenCache.size > 1000) {
        tokenCache.forEach((v, k) => {
          if (v.every((t) => t <= windowStart)) {
            tokenCache.delete(k);
          }
        });
      }
    },
    reset: async (token: string) => {
      if (redis) {
        try {
          await redis.del(`rate:${token}`);
          return;
        } catch {
          // ignore
        }
      }
      tokenCache.delete(token);
    },
  };
};

// Global rate limiter instance (In-memory, suitable for single-instance Next.js MVP)
export const apiLimiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500, // Max 500 users per interval
});

export const dailyLimiter = rateLimit({
  interval: 24 * 60 * 60 * 1000, // 24 hours
  uniqueTokenPerInterval: 5000,
});

export const otpVerificationLimiter = rateLimit({
  interval: 15 * 60 * 1000, // 15 minutes
  uniqueTokenPerInterval: 1000,
});
