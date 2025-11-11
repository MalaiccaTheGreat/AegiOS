// File: server/middleware/cache.js
const NodeCache = require('node-cache');

// Create a cache instance
const cache = new NodeCache({ 
  stdTTL: 300, // 5 minutes default
  checkperiod: 600, // Check for expired items every 10 minutes
  useClones: false, // Better performance
});

// Middleware to cache responses
const cacheMiddleware = (ttl, getCacheKey) => {
  return (req, res, next) => {
    // Skip cache for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    const key = getCacheKey ? getCacheKey(req) : req.originalUrl;
    
    // Try to get cached response
    const cachedResponse = cache.get(key);
    if (cachedResponse) {
      return res.json(cachedResponse);
    }

    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = (body) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, body, ttl || 300); // Default to 5 minutes
      }
      originalJson.call(res, body);
    };

    next();
  };
};

// Clear cache for specific keys
const clearCache = (keys) => {
  if (Array.isArray(keys)) {
    keys.forEach(key => cache.del(key));
  } else {
    // Support wildcard clearing
    const allKeys = cache.keys();
    const matchingKeys = allKeys.filter(k => k.startsWith(keys.replace('*', '')));
    cache.del(matchingKeys);
  }
};

module.exports = cacheMiddleware;
module.exports.cache = cache;
module.exports.clearCache = clearCache;