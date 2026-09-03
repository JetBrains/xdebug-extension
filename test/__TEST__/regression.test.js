const {
    openPopup,
    openExamplePage,
    getDomainForCookie
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
                expect(xdebugCookie.domain).toBe(domain);

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

    test('Should scope cookies to the current host', async () => {
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

    test('Should remove legacy parent-domain cookies when disabling', async () => {
        const page = await global.browser.newPage();
        await page.goto('http://test.127.0.0.1.nip.io:8765');

        await page.evaluate(() => {
            document.cookie = 'XDEBUG_SESSION=YOUR-NAME;domain=127.0.0.1.nip.io;path=/';
        });
        const legacyCookies = await global.browser.cookies();
        expect(legacyCookies.some(cookie => cookie.name === 'XDEBUG_SESSION')).toBe(true);

        const popup = await openPopup();
        await popup.locator('label[for="disable"]').click();
        await page.waitForFunction(() => !document.cookie.includes('XDEBUG_SESSION'));

        const cookies = await global.browser.cookies();
        expect(cookies.filter(cookie => cookie.name === 'XDEBUG_SESSION')).toHaveLength(0);

        await page.close();
    });
});
