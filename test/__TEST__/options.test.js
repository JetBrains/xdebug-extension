const {
    openOptions,
    waitForStoredValue,
} = require('../testUtils.js');


describe('Options Tests', () => {
    test('Should render options correctly', async () => {
        // Arrange
        const options = await openOptions();

        // Assert
        await expect(options.$('#debugtrigger')).resolves.not.toBeNull(); // Debug Trigger
        await expect(options.$('#tracetrigger')).resolves.not.toBeNull(); // Trace Trigger
        await expect(options.$('#profiletrigger')).resolves.not.toBeNull(); // Profile Trigger
        await expect(options.$('button[type="reset"]')).resolves.not.toBeNull(); // Clear
        await expect(options.$('button[type="submit"]')).resolves.not.toBeNull(); // Save
        await expect(options.$('#help')).resolves.not.toBeNull(); // Help
        await options.close();
    });

    test('Should render default shortcuts correctly', async () => {
        // Arrange
        const options = await openOptions();
        const commands = await options.evaluate(() => {
            const shortcuts = {};
            document.querySelectorAll('#help p').forEach(p => {
                const kbdElements = p.querySelectorAll('kbd');
                if (kbdElements.length === 2) {
                    const shortcut = Array.from(kbdElements).map(kbd => kbd.textContent).join('+');
                    shortcuts[shortcut] = p.lastChild.textContent.trim();
                }
            });

            return shortcuts;
        });

        // Assert
        expect(Object.entries(commands).length).toBe(4);
        expect(commands['Alt+X']).toBe('Execute action')
        expect(commands['Alt+C']).toBe('Toggle debugging')
        expect(commands['Alt+V']).toBe('Toggle profiling')
        expect(commands['Alt+B']).toBe('Toggle tracing')
        await options.close();
    });


    test('Should set Debug Trigger correctly and save', async () => {
        // Arrange
        const options = await openOptions();

        // Act
        const key = 'DEBUG_TRIGGER_TEST';
        await options.locator('#debugtrigger').fill(key);
        await options.locator('button[type="submit"]').click();

        // Assert
        await options.waitForSelector('form.success');
        const storedValue = await waitForStoredValue(options, 'xdebugDebugTrigger');
        expect(storedValue).toBe(key);
        await options.close();
    });

    test('Should set Trace Trigger correctly and save', async () => {
        // Arrange
        const options = await openOptions();

        // Act
        const key = 'TRACE_TRIGGER_TEST';
        await options.locator('#tracetrigger').fill(key);
        await options.locator('button[type="submit"]').click();

        // Assert
        await options.waitForSelector('form.success');
        const storedValue = await waitForStoredValue(options, 'xdebugTraceTrigger');
        expect(storedValue).toBe(key);
        await options.close();
    });

    test('Should set Profile Trigger correctly and save', async () => {
        // Arrange
        const options = await openOptions();

        // Act
        const key = 'PROFILE_TRIGGER_TEST';
        await options.locator('#profiletrigger').fill(key);
        await options.locator('button[type="submit"]').click();

        // Assert
        await options.waitForSelector('form.success');
        const storedValue = await waitForStoredValue(options, 'xdebugProfileTrigger');
        expect(storedValue).toBe(key);
        await options.close();
    });

    test('Should clear all text inputs when the clear button is clicked', async () => {
        // Arrange
        const options = await openOptions();

        // Act
        await options.locator('#debugtrigger').fill('foo');
        await options.locator('#tracetrigger').fill('bar');
        await options.locator('#profiletrigger').fill('bat');
        await options.click('button[type="reset"]');

        // Assert
        await expect(options.$eval('#debugtrigger', el => el.value)).resolves.toBe('');
        await expect(options.$eval('#tracetrigger', el => el.value)).resolves.toBe('');
        await expect(options.$eval('#profiletrigger', el => el.value)).resolves.toBe('');
        await options.close();
    });
});
