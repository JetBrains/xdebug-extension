module.exports = {
    verbose: true,
    setupFilesAfterEnv: ['./testSetup.js'],
    globalSetup: './globalSetup.js',
    globalTeardown: './globalTeardown.js',
    globals: {
        config: {
            extensionDir: '../src',
            browserPath: process.env.BROWSER_PATH || '/snap/bin/chromium',
            examplePage: process.env.EXAMPLE_PAGE || 'http://localhost:8765',
            defaultKey: process.env.DEFAULT_KEY || 'PHPSTORM',
            timeout: process.env.TIMEOUT || 3000,
            slowMo: process.env.SLOW_MO || 0,
            devtools: process.env.DEV_TOOLS || false,
            headless: process.env.HEADLESS === 'false' ? false : true,
        }
    }
};