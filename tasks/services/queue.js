var Queue = require("bull");

const redisConfig = process.env.NODE_ENV === 'production' 
  ? { tls: true, enableTLSForSentinelMode: false }
  : {};

var baseQueue = new Queue("base-queue", `${process.env.TASKS_REDIS_URL}2`, {
    redis: redisConfig,
});
var agentQueue = new Queue("agent-queue", `${process.env.TASKS_REDIS_URL}2`, {
    redis: redisConfig,
});
var integrationsQueue = new Queue(
    "integrations-queue",
    `${process.env.TASKS_REDIS_URL}2`,
    { redis: redisConfig }
);
var flowQueue = new Queue("flow-queue", `${process.env.TASKS_REDIS_URL}2`, {
    redis: redisConfig,
});
var vectorQueue = new Queue("vector-queue", `${process.env.TASKS_REDIS_URL}2`, {
    redis: redisConfig,
});

const browserQueue = new Queue(
    "browser-queue",
    `${process.env.TASKS_REDIS_URL}2`,
    {
        redis: redisConfig,
    }
);

module.exports = {
    baseQueue,
    agentQueue,
    flowQueue,
    integrationsQueue,
    vectorQueue,
    browserQueue,
};
