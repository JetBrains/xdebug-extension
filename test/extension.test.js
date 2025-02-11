const config = require('./test-config');
const {
    launchBrowser,
    getExtensionPath,
    openPopup,
    findCookie,
    waitForCookieToExist,
    waitForCookieToClear,
    waitForStoredValue,
} = require('./test-utils.js');


let browser = null;
let extensionPath = null;

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

    test('sets IDE Key correctly and saves', async () => {
        // Arrange
        const [page] = await browser.pages();
        await page.goto(`${extensionPath}/options.html`);

        // Act
        const ideKey = 'IDE_KEY_TEST';
        await page.waitForSelector('#idekey');
        await page.evaluate(() => document.getElementById('idekey').value = '');
        await page.type('#idekey', ideKey);
        await page.waitForSelector('button[type="submit"]');
        await page.click('button[type="submit"]');

        // Assert
        await page.waitForSelector('form.success');
        const storedValue = await waitForStoredValue(page, 'xdebugIdeKey');
        expect(storedValue).toBe(ideKey);
    });

    test('sets Trace Trigger correctly and saves', async () => {
        // Arrange
        const [page] = await browser.pages();
        await page.goto(`${extensionPath}/options.html`);

        // Act
        const traceTrigger = 'TRACE_TRIGGER_TEST';
        await page.waitForSelector('#tracetrigger');
        await page.evaluate(() => document.getElementById('tracetrigger').value = '');
        await page.type('#tracetrigger', traceTrigger);
        await page.waitForSelector('button[type="submit"]');
        await page.click('button[type="submit"]');

        // Assert
        await page.waitForSelector('form.success');
        const storedValue = await waitForStoredValue(page, 'xdebugTraceTrigger');
        expect(storedValue).toBe(traceTrigger);
    });

    test('sets Profile Trigger correctly and saves', async () => {
        // Arrange
        const [page] = await browser.pages();
        await page.goto(`${extensionPath}/options.html`);

        // Act
        const profileTrigger = 'PROFILE_TRIGGER_TEST';
        await page.waitForSelector('#profiletrigger');
        await page.evaluate(() => document.getElementById('profiletrigger').value = '');
        await page.type('#profiletrigger', profileTrigger);
        await page.waitForSelector('button[type="submit"]');
        await page.click('button[type="submit"]');

        // Assert
        await page.waitForSelector('form.success');
        const storedValue = await waitForStoredValue(page, 'xdebugProfileTrigger');
        expect(storedValue).toBe(profileTrigger);
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
        await popupPage.click('label[for="debug"]');

        // Assert
        await waitForCookieToExist(page);
        const cookies = await browser.cookies(config.examplePage);
        const xdebugSessionCookie = findCookie(cookies, 'XDEBUG_SESSION');
        expect(xdebugSessionCookie).not.toBeNull();
        expect(xdebugSessionCookie.value).toBe(config.defaultKey);
    });

    test('toggles trace mode and sets XDEBUG_TRACE cookie', async () => {
        // Arrange
        const [page] = await browser.pages();
        await page.goto(config.examplePage);
        const popupPage = await openPopup(browser, extensionPath);

        // Act
        await popupPage.click('label[for="trace"]');

        // Assert
        await waitForCookieToExist(page);
        const cookies = await browser.cookies(config.examplePage);
        const xdebugTraceCookie = findCookie(cookies, 'XDEBUG_TRACE');
        expect(xdebugTraceCookie).not.toBeNull();
        expect(xdebugTraceCookie.value).toBe(config.defaultKey);
    });

    test('toggles profile mode and sets XDEBUG_PROFILE cookie', async () => {
        // Arrange
        const [page] = await browser.pages();
        await page.goto(config.examplePage);
        const popupPage = await openPopup(browser, extensionPath);

        // Act
        await popupPage.click('label[for="profile"]');

        // Assert
        await waitForCookieToExist(page);
        const cookies = await browser.cookies(config.examplePage);
        const xdebugProfileCookie = findCookie(cookies, 'XDEBUG_PROFILE');
        expect(xdebugProfileCookie).not.toBeNull();
        expect(xdebugProfileCookie.value).toBe(config.defaultKey);
    });

    test('toggles disabled mode and removes all cookies', async () => {
        // Arrange
        const [page] = await browser.pages();
        await page.goto(config.examplePage);
        const popupPage = await openPopup(browser, extensionPath);

        // Act
        await popupPage.click('label[for="disable"]');

        // Assert
        await waitForCookieToClear(page);
        const cookies = await browser.cookies(config.examplePage);
        expect(cookies.length).toBe(0);
    });
});
