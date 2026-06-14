const { Worker } = require('bullmq');
const { NOTIFICATION_QUEUE, EventTypes } = require('./eventTypes');
const emailService = require('../services/emailService');
const logger = require('../logger');

function createJobProcessor(deps = {}) {
    const email = deps.emailService || emailService;
    const log = deps.logger || logger;

    return async function processJob(job) {
        log.info(`Processing job ${job.id} [${job.name}]`, { data: job.data });

        switch (job.name) {
        case EventTypes.SEND_CONFIRMATION_EMAIL: {
            const { to, repo, confirmUrl, unsubscribeToken } = job.data;
            if (!to || !repo || !confirmUrl) {
                throw new Error('Missing required fields: to, repo, confirmUrl');
            }
            await email.sendConfirmation({ to, repo, confirmUrl, unsubscribeToken });
            log.info(`Confirmation email sent to ${to} for ${repo}`, { jobId: job.id });
            break;
        }
        case EventTypes.SEND_RELEASE_NOTIFICATION: {
            const { to, repo, release, unsubscribeUrl } = job.data;
            if (!to || !repo || !release) {
                throw new Error('Missing required fields: to, repo, release');
            }
            await email.sendRelease({ to, repo, release, unsubscribeUrl });
            log.info(`Release notification sent to ${to} for ${repo}@${release.tag}`, { jobId: job.id });
            break;
        }
        default:
            log.warn(`Unknown event type: ${job.name}`, { jobId: job.id });
            throw new Error(`Unknown event type: ${job.name}`);
        }
    };
}

function startConsumer(redisConnection, deps = {}) {
    const processor = createJobProcessor(deps);
    const log = deps.logger || logger;

    const worker = new Worker(NOTIFICATION_QUEUE, processor, {
        connection: redisConnection,
        concurrency: 5,
    });

    worker.on('completed', (job) => {
        log.info(`Job ${job.id} [${job.name}] completed successfully`);
    });

    worker.on('failed', (job, err) => {
        log.error(`Job ${job?.id} [${job?.name}] failed: ${err.message}`, {
            attempt: job?.attemptsMade,
            maxAttempts: job?.opts?.attempts,
        });
    });

    worker.on('error', (err) => {
        log.error('Notification consumer error', { error: err.message });
    });

    log.info(`Notification consumer started, listening on queue: ${NOTIFICATION_QUEUE}`);

    return worker;
}

module.exports = { startConsumer, createJobProcessor };
