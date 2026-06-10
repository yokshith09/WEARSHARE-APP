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

export async function setActiveSession(userId: string, sessionId: string, ttlSeconds: number) {
  if (!redis) return;
  await redis.set(`auth:active-session:${userId}`, sessionId, { ex: ttlSeconds });
}

export async function isActiveSession(userId: string, sessionId: string) {
  if (!redis) return true;
  const activeSessionId = await redis.get<string>(`auth:active-session:${userId}`);
  return activeSessionId === sessionId;
}

export async function releaseActiveSession(userId: string, sessionId: string) {
  if (!redis) return;
  const key = `auth:active-session:${userId}`;
  const activeSessionId = await redis.get<string>(key);
  if (activeSessionId === sessionId) {
    await redis.del(key);
  }
}
