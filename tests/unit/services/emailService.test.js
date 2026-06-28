const axios = require('axios');

jest.mock('axios');
jest.mock('@/utils/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
}));
jest.mock('@/config', () => ({
    appUrl: 'http://localhost:3000',
    notificationServiceUrl: 'http://localhost:3001',
    resend: { apiKey: '' },
    smtp: { user: '', pass: '' },
}));

const notificationClient = require('@/modules/notification/notificationClient');
const logger = require('@/utils/logger');

afterEach(() => {
    jest.clearAllMocks();
});

describe('notificationClient', () => {
    describe('sendConfirmationEmail', () => {
        it('should POST to notification service with correct payload', async () => {
            axios.post.mockResolvedValue({ data: { success: true } });

            await notificationClient.sendConfirmationEmail(
                'user@example.com', 'nodejs/node', 'confirm-token', 'unsub-token',
            );

            expect(axios.post).toHaveBeenCalledWith(
                'http://localhost:3001/api/notify/confirmation',
                {
                    to: 'user@example.com',
                    repo: 'nodejs/node',
                    confirmUrl: 'http://localhost:3000/api/confirm/confirm-token',
                    unsubscribeToken: 'unsub-token',
                },
                { timeout: 15000 },
            );
            expect(logger.info).toHaveBeenCalled();
        });

        it('should throw when notification service is unavailable', async () => {
            axios.post.mockRejectedValue(new Error('ECONNREFUSED'));

            await expect(
                notificationClient.sendConfirmationEmail(
                    'user@example.com', 'nodejs/node', 'confirm-token', 'unsub-token',
                ),
            ).rejects.toThrow('ECONNREFUSED');
        });
    });

    describe('sendReleaseNotification', () => {
        it('should POST to notification service with correct payload', async () => {
            axios.post.mockResolvedValue({ data: { success: true } });

            const release = {
                tag: 'v1.0.0',
                name: 'Release 1',
                url: 'https://github.com/nodejs/node/releases/tag/v1.0.0',
                publishedAt: '2024-01-01',
            };

            await notificationClient.sendReleaseNotification(
                'user@example.com', 'nodejs/node', release, 'unsub-token',
            );

            expect(axios.post).toHaveBeenCalledWith(
                'http://localhost:3001/api/notify/release',
                {
                    to: 'user@example.com',
                    repo: 'nodejs/node',
                    release,
                    unsubscribeUrl: 'http://localhost:3000/api/unsubscribe/unsub-token',
                },
                { timeout: 15000 },
            );
            expect(logger.info).toHaveBeenCalled();
        });

        it('should swallow errors for release notifications', async () => {
            axios.post.mockRejectedValue(new Error('network error'));

            await expect(
                notificationClient.sendReleaseNotification(
                    'user@example.com', 'nodejs/node',
                    { tag: 'v1.0.0', name: 'R1', url: 'http://gh', publishedAt: '2024-01-01' },
                    'unsub-token',
                ),
            ).resolves.toBeUndefined();

            expect(logger.error).toHaveBeenCalled();
        });
    });
});
