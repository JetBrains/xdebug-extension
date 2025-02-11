module.exports = {
    chromiumPath: process.env.CHROMIUM_PATH || '/usr/bin/chromium-browser',
    extensionDir: '../src',
    examplePage: process.env.EXAMPLE_PAGE || 'https://example.com',
    defaultKey: process.env.DEFAULT_KEY || 'XDEBUG_ECLIPSE',
    timeout: process.env.TIMEOUT || 30000,
    headless: process.env.HEADLESS || false,
    slowMo: process.env.SLOW_MO || 0,
    devtools: process.env.DEV_TOOLS || false,
};