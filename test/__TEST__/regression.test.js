const {
    openPopup,
    openExamplePage,
    getDomainForCookie,
    getExtensionServiceWorker,
} = require('../testUtils.js');

describe('Cookie Domain Regression Tests', () => {
    const testCases = [
        { name: 'localhost', url: 'http://localhost:8765' },
        { name: '127.0.0.1', url: 'http://127.0.0.1:8765' },
        { name: 'Subdomain (test.localhost)', url: 'http://test.localhost:8765' }
    ];

    for (const { name, url } of testCases) {
        test(`Should persist Debug mode on ${name}`, async () => {
            const page = await global.browser.newPage();
            await page.goto(url);

            try {
                const popup = await openPopup();

                // Act
                await popup.locator('label[for="debug"]').click();

                // Assert
                await page.waitForFunction(() => document.cookie.includes('XDEBUG_SESSION'));
                let cookies = await global.browser.cookies();
                let xdebugCookie = cookies.find(c => c.name === 'XDEBUG_SESSION');
                expect(xdebugCookie).toBeDefined();

                const domain = await getDomainForCookie(page);
                expect(xdebugCookie.domain.endsWith(domain)).toBe(true);

                // Act
                await page.reload();

                // Assert
                const popup2 = await openPopup();
                const isChecked = await popup2.$eval('#debug', (radio) => radio.checked);
                expect(isChecked).toBe(true);

                // Verify cookie still exists after reload
                cookies = await global.browser.cookies();
                xdebugCookie = cookies.find(c => c.name === 'XDEBUG_SESSION');
                expect(xdebugCookie).toBeDefined();

            } finally {
                await page.close();
            }
        });
    }

    test('Should handle probe logic correctly (simulated by multi-part hostname)', async () => {
        // Note: Real public suffixes like .co.uk are hard to test without DNS/Hosts file entries.
        const page = await openExamplePage();
        const popup = await openPopup();

        await popup.locator('label[for="debug"]').click();
        await page.waitForFunction(() => document.cookie.includes('XDEBUG_SESSION'));
        
        const domain = await getDomainForCookie(page);
        const cookies = await global.browser.cookies();
        const xdebugCookie = cookies.find(c => c.name === 'XDEBUG_SESSION');

        // Assert
        expect(xdebugCookie.domain.endsWith(domain)).toBe(true);
        
        await page.close();
    });

    test('Should fall back to the cookies API when a content script is unavailable', async () => {
        const page = await openExamplePage();
        const worker = await getExtensionServiceWorker();

        const result = await worker.evaluate(async () => {
            const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
            const settings = await getSettings();
            const tabWithoutContentScript = { ...tab, id: chrome.tabs.TAB_ID_NONE };

            const setResponse = await sendTabCommand(
                tabWithoutContentScript,
                { cmd: 'setStatus', status: 1 },
                settings
            );
            const getResponse = await sendTabCommand(
                tabWithoutContentScript,
                { cmd: 'getStatus' },
                settings
            );

            return { setStatus: setResponse.status, currentStatus: getResponse.status };
        });

        expect(result).toEqual({ setStatus: 1, currentStatus: 1 });
        const cookies = await global.browser.cookies();
        expect(cookies).toContainEqual(expect.objectContaining({
            name: 'XDEBUG_SESSION',
            value: 'YOUR-NAME',
        }));

        await page.close();
    });
});
