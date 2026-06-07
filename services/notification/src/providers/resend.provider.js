const axios = require('axios');
const config = require('../config');
const logger = require('../logger');

function isAvailable() {
    return Boolean(config.resend.apiKey);
}

async function send(mailOptions) {
    if (!isAvailable()) {
        return false;
    }

    try {
        await axios.post(
            'https://api.resend.com/emails',
            {
                from: config.resend.from,
                to: [mailOptions.to],
                subject: mailOptions.subject,
                html: mailOptions.html,
            },
            {
                headers: {
                    Authorization: `Bearer ${config.resend.apiKey}`,
                    'Content-Type': 'application/json',
                },
                timeout: config.resend.timeoutMs,
            },
        );

        return true;
    } catch (err) {
        const details = err.response
            ? { status: err.response.status, data: err.response.data }
            : { message: err.message };
        logger.warn('Failed to send email via Resend API. Falling back to SMTP.', details);
        return false;
    }
}

module.exports = { send, isAvailable };
