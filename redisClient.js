const redis = require('redis');
require('dotenv').config();

const client = redis.createClient({
  url: process.env.REDIS_URI
});

client.on('error', (err) => {
  console.error('Redis client error', err);
});

client.connect();

module.exports = client;
