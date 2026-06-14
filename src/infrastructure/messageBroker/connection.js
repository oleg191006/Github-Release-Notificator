const config = require('@/config');
const logger = require('@/utils/logger');

function getRedisConnection() {
    const { url } = config.redis;
    if (!url) {
        logger.warn('Message broker: REDIS_URL not set, queue publishing disabled');
        return null;
    }

    const parsed = new URL(url);
    return {
        host: parsed.hostname,
        port: parseInt(parsed.port, 10) || 6379,
        password: parsed.password || undefined,
        maxRetriesPerRequest: null,
        enableOfflineQueue: false,
        lazyConnect: true,
        retryStrategy: (times) => {
            if (times > 3) {
                return null;
            }
            return Math.min(times * 500, 2000);
        },
    };
}

module.exports = { getRedisConnection };
