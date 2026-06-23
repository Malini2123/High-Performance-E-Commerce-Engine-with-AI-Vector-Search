const { createClient } = require('redis');

const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 3) {
        console.log('Redis connection failed after 3 retries. Disabling cache reconnects.');
        return false;
      }
      return Math.min(retries * 200, 2000);
    }
  }
});

redisClient.on('error', (err) => {
  console.log('Redis Error:', err);
});

redisClient.on('connect', () => {
  console.log('Redis Connected!');
});

const connectRedis = async () => {
  await redisClient.connect();
};

module.exports = { redisClient, connectRedis };