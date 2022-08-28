import app from './app';

/**
 * Start Express Server
 */
(async () => {
    const port = process.env.PORT || 3000;
    await app.start(port);
    console.log(`Bolt app is running in port ${port}`);
})();
