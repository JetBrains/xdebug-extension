const puppeteer = require('puppeteer');
const path = require('path');
const config = {
    chromiumPath: process.env.CHROMIUM_PATH || '/usr/bin/chromium-browser',
    extensionDir: path.join(process.cwd(), '../src'),
    examplePage: 'https://example.com',
    defaultKey: 'XDEBUG_ECLIPSE',
    timeout: 30000 // milliseconds
};

let browser = null;
let extensionPath = null;

// Helper Functions

/**
 * Launches the Chromium browser with the extension loaded.
 * @param {object} config The configuration object.
 * @returns {Promise<puppeteer.Browser>} The launched browser instance.
 * @throws {Error} If the browser fails to launch.
 */
async function launchBrowser(config) {
    try {
        return await puppeteer.launch({
            executablePath: config.chromiumPath,
            headless: false,
            // slowMo: 500, // Uncomment for debugging
            // devtools: true, // Uncomment for debugging
            args: [
                `--disable-extensions-except=${config.extensionDir}`,
                `--load-extension=${config.extensionDir}`
            ],
            timeout: config.timeout
        });
    } catch (error) {
        console.error("Failed to launch browser:", error);
        throw error;
    }
}

/**
 * Gets the extension path by inspecting the service worker.
 * @param {puppeteer.Browser} browser The browser instance.
 * @param {object} config The configuration object.
 * @returns {Promise<string>} The extension path (chrome-extension://...).
 * @throws {Error} If the extension path cannot be determined.
 */
async function getExtensionPath(browser, config) {
    try {
        const [page] = await browser.pages();
        await page.goto(config.examplePage);
        const workerTarget = await browser.waitForTarget(target =>
            target.type() === 'service_worker'
            && target.url().endsWith('service_worker.js'), { timeout: config.timeout });
        const worker = await workerTarget.worker();
        const extensionId = await worker.evaluate(() => chrome.runtime.id);
        return `chrome-extension://${extensionId}`;
    } catch (error) {
        console.error("Failed to get extension path:", error);
        throw error;
    }
}

/**
 * Opens the extension's popup in a new page.
 * @param {puppeteer.Browser} browser The browser instance.
 * @param {string} extensionPath The extension path.
 * @returns {Promise<puppeteer.Page>} The popup page.
 */
async function openPopup(browser, extensionPath) {
    const popupPage = await browser.newPage();
    await popupPage.goto(`${extensionPath}/popup.html`);
    return popupPage;
}

/**
 * Finds a specific Xdebug cookie by name.
 * @param {Array<object>} cookies An array of cookie objects.
 * @param {string} cookieName The name of the Xdebug cookie (e.g., 'XDEBUG_SESSION').
 * @returns {object | undefined} The cookie object, or undefined if not found.
 */
function getXdebugCookie(cookies, cookieName) {
    return cookies.find(cookie => cookie.name === cookieName);
}

/**
 * Waits for a cookie to be set (i.e., document.cookie to be non-empty).
 * @param {puppeteer.Page} page
 */
async function waitForCookieToExist(page) {
    return await page.waitForFunction(async () => { return document.cookie !== ''; }, { timeout: config.timeout });
}

/**
 * Waits for all cookies to be cleared (i.e., document.cookie to be empty).
 * @param {puppeteer.Page} page
 */
async function waitForCookieToClear(page) {
    return await page.waitForFunction(async () => { return document.cookie === ''; }, { timeout: config.timeout });
}


// Test Setup

beforeEach(async () => {
    browser = await launchBrowser(config);
    extensionPath = await getExtensionPath(browser, config);
});

afterEach(async () => {
    try {
        if (browser) {
            await browser.close();
        }
    } finally {
        browser = null;
        extensionPath = null;
    }
});

// Test Suites

describe('Options Page Tests', () => {
    test('renders correctly', async () => {
        // Arrange
        const [page] = await browser.pages();
        await page.goto(`${extensionPath}/options.html`);

        // Assert
        await expect(page.$('#idekey')).resolves.not.toBeNull(); // IDE Key
        await expect(page.$('#tracetrigger')).resolves.not.toBeNull(); // Trace Trigger
        await expect(page.$('#profiletrigger')).resolves.not.toBeNull(); // Profile Trigger
        await expect(page.$('button[type="reset"]')).resolves.not.toBeNull(); // Clear
        await expect(page.$('button[type="submit"]')).resolves.not.toBeNull(); // Save
    });
});

describe('Popup Tests', () => {
    test('renders correctly', async () => {
        // Arrange
        const [page] = await browser.pages();
        await page.goto(`${extensionPath}/popup.html`);

        // Assert
        await expect(page.$('input[type="radio"][value="1"]')).resolves.not.toBeNull(); // Debug
        await expect(page.$('input[type="radio"][value="2"]')).resolves.not.toBeNull(); // Profile
        await expect(page.$('input[type="radio"][value="3"]')).resolves.not.toBeNull(); // Trace
        await expect(page.$('input[type="radio"][value="0"]')).resolves.not.toBeNull(); // Disable
        await expect(page.$('#options')).resolves.not.toBeNull(); // Options link
    });

    test('toggles debug mode and sets XDEBUG_SESSION cookie', async () => {
        // Arrange
        const [page] = await browser.pages();
        await page.goto(config.examplePage);
        const popupPage = await openPopup(browser, extensionPath);

        // Act
        await popupPage.waitForSelector('label[for="debug"]', { timeout: config.timeout });
        await popupPage.click('label[for="debug"]');

        // Assert
        await waitForCookieToExist(page);
        const cookies = await browser.cookies(config.examplePage);
        const xdebugSessionCookie = getXdebugCookie(cookies, 'XDEBUG_SESSION');
        expect(xdebugSessionCookie).not.toBeNull();
        expect(xdebugSessionCookie.value).toBe(config.defaultKey);
    });

    test('toggles trace mode and sets XDEBUG_TRACE cookie', async () => {
        // Arrange
        const [page] = await browser.pages();
        await page.goto(config.examplePage);
        const popupPage = await openPopup(browser, extensionPath);

        // Act
        await popupPage.waitForSelector('label[for="trace"]', { timeout: config.timeout });
        await popupPage.click('label[for="trace"]');

        // Assert
        await waitForCookieToExist(page);
        const cookies = await browser.cookies(config.examplePage);
        const xdebugTraceCookie = getXdebugCookie(cookies, 'XDEBUG_TRACE');
        expect(xdebugTraceCookie).not.toBeNull();
        expect(xdebugTraceCookie.value).toBe(config.defaultKey);
    });

    test('toggles profile mode and sets XDEBUG_PROFILE cookie', async () => {
        // Arrange
        const [page] = await browser.pages();
        await page.goto(config.examplePage);
        const popupPage = await openPopup(browser, extensionPath);

        // Act
        await popupPage.waitForSelector('label[for="profile"]', { timeout: config.timeout });
        await popupPage.click('label[for="profile"]');

        // Assert
        await waitForCookieToExist(page);
        const cookies = await browser.cookies(config.examplePage);
        const xdebugProfileCookie = getXdebugCookie(cookies, 'XDEBUG_PROFILE');
        expect(xdebugProfileCookie).not.toBeNull();
        expect(xdebugProfileCookie.value).toBe(config.defaultKey);
    });

    test('toggles disabled mode and removes all cookies', async () => {
        // Arrange
        const [page] = await browser.pages();
        await page.goto(config.examplePage);
        const popupPage = await openPopup(browser, extensionPath);

        // Act
        await popupPage.waitForSelector('label[for="disable"]', { timeout: config.timeout });
        await popupPage.click('label[for="disable"]');

        // Assert
        await waitForCookieToClear(page);
        const cookies = await browser.cookies(config.examplePage);
        expect(cookies.length).toBe(0);
    });
});