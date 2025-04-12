const {
    openPopup,
    openExamplePage,
} = require('../testUtils.js');

describe('Popup Tests', () => {
    test('Should render popup correctly', async () => {
        // Arrange
        const popup = await openPopup();

        // Assert
        await expect(popup.$('input[type="radio"][value="1"]')).resolves.not.toBeNull(); // Debug
        await expect(popup.$('input[type="radio"][value="2"]')).resolves.not.toBeNull(); // Profile
        await expect(popup.$('input[type="radio"][value="3"]')).resolves.not.toBeNull(); // Trace
        await expect(popup.$('input[type="radio"][value="0"]')).resolves.not.toBeNull(); // Disable
        await expect(popup.$('#options')).resolves.not.toBeNull(); // Options link
    });

    test('Should toggle debug mode and set XDEBUG_SESSION cookie', async () => {
        // Arrange
        const page = await openExamplePage();
        const popup = await openPopup();

        // Act
        await popup.locator('label[for="debug"]').click();

        // Assert
        await page.waitForFunction(() => document.cookie);
        const cookies = await global.browser.cookies();
        const xdebugSessionCookie = cookies.find(cookie => cookie.name === 'XDEBUG_SESSION');
        expect(cookies.length).toBe(1);
        expect(xdebugSessionCookie.value).toBe(config.defaultKey);
        await page.close();
    });

    test('Should toggle trace mode and set XDEBUG_TRACE cookie', async () => {
        // Arrange
        const page = await openExamplePage();
        const popup = await openPopup();

        // Act
        await popup.locator('label[for="trace"]').click();

        // Assert
        await page.waitForFunction(() => document.cookie);
        const cookies = await global.browser.cookies();
        const xdebugTraceCookie = cookies.find(cookie => cookie.name === 'XDEBUG_TRACE');
        expect(cookies.length).toBe(1);
        expect(xdebugTraceCookie.value).toBe(config.defaultKey);
        await page.close();
    });

    test('Should toggle profile mode and set XDEBUG_PROFILE cookie', async () => {
        // Arrange
        const page = await openExamplePage();
        const popup = await openPopup()

        // Act
        await popup.locator('label[for="profile"]').click();

        // Assert
        await page.waitForFunction(() => document.cookie);
        const cookies = await global.browser.cookies();
        const xdebugProfileCookie = cookies.find(cookie => cookie.name === 'XDEBUG_PROFILE');
        expect(cookies.length).toBe(1);
        expect(xdebugProfileCookie.value).toBe(config.defaultKey);
        await page.close();
    });

    test('Should toggle disabled mode and remove all extension cookies', async () => {
        // Arrange
        const page = await openExamplePage();
        const popup = await openPopup();

        // Act
        await popup.locator('label[for="disable"]').click();

        // Assert
        await page.waitForFunction(() => !document.cookie);
        const cookies = await global.browser.cookies();
        expect(cookies.length).toBe(0);
        await page.close();
    });

    test('Should open options page in new tab via the link', async () => {
        // Arrange
        const popup = await openPopup();

        // Act
        await popup.click('#options');

        // Assert
        const options = await global.browser.waitForTarget(
            target =>
                target.url() === `${global.extensionPath}/options.html`
        );
        expect(options).toBeTruthy();
    });
});

