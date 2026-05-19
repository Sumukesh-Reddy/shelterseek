const redis = require('redis');

let redisClient;

const initRedis = async () => {
    try {
        redisClient = redis.createClient({
            url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 30) {
                        // Try very slowly after 30 attempts to avoid spamming
                        return 30000; // 30 seconds
                    }
                    return Math.min(retries * 500, 5000); // Gradual backoff up to 5 seconds
                }
            }
        });

        redisClient.on('error', (err) => {
            const isConnectionError = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'EHOSTUNREACH'].includes(err.code) || err.message.includes('getaddrinfo');
            if (isConnectionError) {
                if (!redisClient.isRefused) {
                    console.log(`⚠️ Redis server is unavailable (${err.message}). Caching will be skipped.`);
                    redisClient.isRefused = true;
                }
            } else {
                if (!redisClient.isRefused) {
                    console.log('Redis Cache Error: ', err.message);
                }
            }
        });

        redisClient.on('connect', () => {
            console.log('Redis connected successfully');
            redisClient.isRefused = false;
        });

        await redisClient.connect();
    } catch (err) {
        console.error('Failed to initialize Redis:', err.message);
    }
};

const cacheMiddleware = (expirationInSeconds = 300) => {
    return async (req, res, next) => {
        if (!redisClient || !redisClient.isReady) {
            return next(); // Skip caching if redis isn't up
        }

        const key = `cache:${req.originalUrl || req.url}`;
        
        try {
            const cachedData = await redisClient.get(key);
            if (cachedData) {
                console.log(`[Cache Hit] Serving ${key} from Redis`);
                // Time measurement for performance report
                res.setHeader('X-Cache', 'HIT');
                return res.status(200).json(JSON.parse(cachedData));
            }
            
            console.log(`[Cache Miss] Fetching ${key} from MongoDB`);
            res.setHeader('X-Cache', 'MISS');
            
            // Override res.json to cache the response before sending it
            const originalJson = res.json.bind(res);
            res.json = (body) => {
                // If it's a success response, cache it
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    redisClient.setEx(key, expirationInSeconds, JSON.stringify(body)).catch(err => {
                        console.error('Redis Set Error:', err);
                    });
                }
                return originalJson(body);
            };
            
            next();
        } catch (err) {
            console.error('Cache Middleware Error:', err);
            next();
        }
    };
};

const clearCachePattern = async (pattern) => {
    if (!redisClient || !redisClient.isReady) return;
    try {
        const keys = await redisClient.keys(`cache:${pattern}`);
        if (keys.length > 0) {
            await redisClient.del(keys);
            console.log(`Cleared cache for keys matching: ${pattern}`);
        }
    } catch (err) {
        console.error('Error clearing cache:', err);
    }
};

// Start redis immediately
initRedis();

module.exports = {
    cacheMiddleware,
    clearCachePattern,
    redisClient
};
