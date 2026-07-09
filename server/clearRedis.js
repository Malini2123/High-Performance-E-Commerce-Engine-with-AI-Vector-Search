const { createClient } = require('redis');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function clearCache() {
  try {
    const client = createClient({ url: process.env.REDIS_URL });
    client.on('error', (err) => console.log('Redis Client Error', err));
    await client.connect();
    console.log('Connected to Redis');
    
    const res = await client.flushAll();
    console.log('Redis Flush Result:', res);
    
    await client.disconnect();
    console.log('Done!');
    process.exit(0);
  } catch (err) {
    console.error('Redis error:', err);
    process.exit(1);
  }
}

clearCache();
