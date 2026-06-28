const axios = require('axios');
const config = require('@/config');
const logger = require('@/utils/logger');

function getBaseUrl() {
    return config.notificationServiceUrl || 'http://localhost:3001';
}

async function sendConfirmationEmail(email, repo, confirmToken, unsubscribeToken) {
    const confirmUrl = `${config.appUrl}/api/confirm/${confirmToken}`;
    try {
        await axios.post(`${getBaseUrl()}/api/notify/confirmation`, {
            to: email,
            repo,
            confirmUrl,
            unsubscribeToken,
        }, { timeout: 15000 });

        logger.info(`Confirmation notification dispatched for ${email} (${repo})`);
    } catch (err) {
        logger.error(`Failed to dispatch confirmation notification for ${email}`, err.message);
        throw err;
    }
}


async function sendReleaseNotification(email, repo, release, unsubscribeToken) {
    const unsubscribeUrl = `${config.appUrl}/api/unsubscribe/${unsubscribeToken}`;

    try {
        await axios.post(`${getBaseUrl()}/api/notify/release`, {
            to: email,
            repo,
            release,
            unsubscribeUrl,
        }, { timeout: 15000 });

        logger.info(`Release notification dispatched for ${email} (${repo}@${release.tag})`);
    } catch (err) {
        logger.error(`Failed to dispatch release notification for ${email}`, err.message);
    }
}

module.exports = { sendConfirmationEmail, sendReleaseNotification };
