import { ICacheClient } from "@azure/msal-node";
import { RedisClientType } from "redis";
import { CacheConfig } from "./types.ts";
import { getLogger } from "@gc-fwcs/logger";

// Default cache configuration
const DEFAULT_CACHE_TTL = 60 * 60 * 24; // 24 hours
const EMPTY_STRING = "";

/**
 * Creates an MSAL cache client backed by Redis
 * 
 * This wraps an existing Redis client instance to implement MSAL's ICacheClient
 * interface for distributed token caching. The cache client handles storing
 * and retrieving tokens and related data with configurable TTL.
 *
 * @param redisClient - Existing Redis client instance
 * @param cacheConfig - Optional cache configuration
 * @returns MSAL-compatible cache client
 */
const createMsalCacheClient = (cacheClient: RedisClientType, cacheConfig?: CacheConfig): ICacheClient => {
    const log = getLogger("auth/createMsalCacheClient");

    return {
        get: async (key: string): Promise<string> => {
            if (key === EMPTY_STRING) return EMPTY_STRING;
            try {
                return await cacheClient.get(key) || EMPTY_STRING;
            } catch (error) {
                log.error(error);
                return EMPTY_STRING;
            }
        },

        set: async (key: string, value: string): Promise<string> => {
            if (key === EMPTY_STRING) return EMPTY_STRING;
            try {
                return (await cacheClient.set(key, value, {
                    EX: cacheConfig?.ttl ?? DEFAULT_CACHE_TTL
                })) || EMPTY_STRING;
            } catch (error) {
                log.error(error);
                return EMPTY_STRING;
            }
        }
    }
};

export default createMsalCacheClient;
