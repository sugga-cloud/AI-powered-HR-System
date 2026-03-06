import dotenv from "dotenv";
dotenv.config();

/**
 * Centralized Redis configuration object
 * Used by all Bull queues in the application
 */
const redisClient = {
  port: process.env.REDIS_PORT || 17487,
  host: process.env.REDIS_HOST || "redis-17487.crce217.ap-south-1-1.ec2.redns.redis-cloud.com",
  password: process.env.REDIS_PASSWORD || "PUPIU547h1BiS2MWjaym3nBSzaxmyry6",
  username: process.env.REDIS_USERNAME || "default",
};

export default redisClient;
