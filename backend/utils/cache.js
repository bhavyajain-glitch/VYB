/**
 * Cache Service
 * 
 * Provides caching functionality with Redis (production) or in-memory fallback (development).
 * Auto-detects Redis availability.
 */

let redis = null;
let isRedisConnected = false;

// In-memory cache fallback
const memoryCache = new Map();
const memoryCacheTTL = new Map();

/**
 * Initialize Redis connection (optional)
 * Falls back to in-memory if Redis is unavailable
 */
async function initCache() {
    // Try to connect to Redis if available
    if (process.env.REDIS_URL) {
        try {
            const Redis = require('ioredis');
            redis = new Redis(process.env.REDIS_URL, {
                maxRetriesPerRequest: 3,
                retryDelayOnFailover: 100,
                lazyConnect: true,
            });

            await redis.connect();
            isRedisConnected = true;
            console.log('[Cache] Redis connected successfully');
        } catch (error) {
            console.log('[Cache] Redis unavailable, using in-memory cache');
            redis = null;
            isRedisConnected = false;
        }
    } else {
        console.log('[Cache] No REDIS_URL, using in-memory cache');
    }
}

/**
 * Set a cache value
 */
async function set(key, value, ttlSeconds = 300) {
    const serialized = JSON.stringify(value);

    if (isRedisConnected && redis) {
        try {
            await redis.setex(key, ttlSeconds, serialized);
            return true;
        } catch (error) {
            console.error('[Cache] Redis set error:', error.message);
        }
    }

    // Fallback to memory cache
    memoryCache.set(key, serialized);
    memoryCacheTTL.set(key, Date.now() + (ttlSeconds * 1000));
    return true;
}

/**
 * Get a cache value
 */
async function get(key) {
    if (isRedisConnected && redis) {
        try {
            const value = await redis.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('[Cache] Redis get error:', error.message);
        }
    }

    // Fallback to memory cache
    const ttl = memoryCacheTTL.get(key);
    if (ttl && ttl < Date.now()) {
        memoryCache.delete(key);
        memoryCacheTTL.delete(key);
        return null;
    }

    const value = memoryCache.get(key);
    return value ? JSON.parse(value) : null;
}

/**
 * Delete a cache key
 */
async function del(key) {
    if (isRedisConnected && redis) {
        try {
            await redis.del(key);
        } catch (error) {
            console.error('[Cache] Redis del error:', error.message);
        }
    }

    memoryCache.delete(key);
    memoryCacheTTL.delete(key);
}

/**
 * Delete keys by pattern (e.g., 'feed:*')
 */
async function delByPattern(pattern) {
    if (isRedisConnected && redis) {
        try {
            const keys = await redis.keys(pattern);
            if (keys.length > 0) {
                await redis.del(...keys);
            }
            return;
        } catch (error) {
            console.error('[Cache] Redis delByPattern error:', error.message);
        }
    }

    // Memory cache pattern delete
    const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
    for (const key of memoryCache.keys()) {
        if (regex.test(key)) {
            memoryCache.delete(key);
            memoryCacheTTL.delete(key);
        }
    }
}

/**
 * Cache wrapper for async functions
 * Caches the result of the function with the given key
 */
async function cached(key, fn, ttlSeconds = 300) {
    // Try to get from cache first
    const cached = await get(key);
    if (cached !== null) {
        return cached;
    }

    // Execute function and cache result
    const result = await fn();
    await set(key, result, ttlSeconds);
    return result;
}

// Cache key generators
const cacheKeys = {
    followingFeed: (userId, page) => `feed:following:${userId}:${page}`,
    exploreFeed: (page) => `feed:explore:${page}`,
    reelsFeed: (page) => `feed:reels:${page}`,
    trendingHashtags: () => `trending:hashtags`,
    trendingPosts: () => `trending:posts`,
    userPosts: (userId) => `posts:user:${userId}`,
    post: (postId) => `post:${postId}`,
};

// TTL constants (in seconds)
const TTL = {
    FOLLOWING_FEED: 5 * 60,    // 5 minutes
    EXPLORE_FEED: 15 * 60,     // 15 minutes
    REELS_FEED: 10 * 60,       // 10 minutes
    TRENDING_HASHTAGS: 30 * 60, // 30 minutes
    TRENDING_POSTS: 15 * 60,   // 15 minutes
    USER_POSTS: 5 * 60,        // 5 minutes
    POST: 60,                  // 1 minute
};

module.exports = {
    initCache,
    set,
    get,
    del,
    delByPattern,
    cached,
    cacheKeys,
    TTL,
    isConnected: () => isRedisConnected,
};
