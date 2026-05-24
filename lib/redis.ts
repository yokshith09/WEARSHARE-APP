import { Redis } from "@upstash/redis";

export const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

export async function setAvailabilityLock(key: string, ttlSeconds = 15 * 60) {
  if (!redis) return true;
  const result = await redis.set(key, "locked", { nx: true, ex: ttlSeconds });
  return result === "OK";
}

export async function releaseAvailabilityLock(key: string) {
  if (!redis) return;
  await redis.del(key);
}
