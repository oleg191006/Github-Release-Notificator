require('dotenv').config();

const config = require('./config');
const logger = require('./logger');
const createApp = require('./app');

async function main() {
    try {
        const app = createApp();

        const server = app.listen(config.port, () => {
            logger.info(`Notification service listening on port ${config.port} (${config.nodeEnv})`);
        });

        const shutdown = (signal) => {
            logger.info(`Received ${signal}. Shutting down...`);
            server.close(() => {
                logger.info('Notification service shut down');
                process.exit(0);
            });

            setTimeout(() => {
                process.exit(1);
            }, 5000);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    } catch (err) {
        logger.error('Failed to start notification service', err);
        process.exit(1);
    }
}

main();
