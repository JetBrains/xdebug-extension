const puppeteer = require('puppeteer-core');

/**
 * Geta a configured browser instance with the extension loaded
 * @returns {Promise<puppeteer.browser>} A Promise that resolves to the browser once it is launched with the extension.
 * @throws {Error} If the browser fails to launch
 */
async function getBrowser() {
    return await puppeteer.launch({
        executablePath: config.browserPath,
        headless: config.headless,
        slowMo: config.slowMo,
        devtools: config.devtools,
        args: [
            '--window-name=Xdebug Helper Tests',
            '--window-size=800,600',
            '--no-first-run',
            `--disable-extensions-except=${config.extensionDir}`,
            `--load-extension=${config.extensionDir}`
        ],
        timeout: config.timeout
    });
}

/**
 * Waits for the extension's service worker and returns the worker instance.
 * @param {puppeteer.Browser} browser The Puppeteer browser instance.
 * @returns {Promise<puppeteer.Worker>} A Promise that resolves to the service worker instance.
 * @throws {Error} If the service worker is not found.
 */
async function getExtensionServiceWorker() {
    const workerTarget = await global.browser.waitForTarget(
        target =>
            target.type() === 'service_worker' &&
            target.url().endsWith('service_worker.js'),
    );

    return await workerTarget.worker();
}


/**
 * Retrieves the extension's id by inspecting the service worker.
 * @returns {Promise<string>} A Promise that resolves to the extension id when it is determined.
 * @throws {Error} If the extension id cannot be determined
 */
async function getExtensionId() {
    const page = await openExamplePage();
    const worker = await getExtensionServiceWorker();
    const extensionId = await worker.evaluate(() => chrome.runtime.id);
    await page.close();

    return extensionId;
}

/**
 * Opens the extension's popup.
 * @returns {Promise<puppeteer.Page>} A Promise that resolves with the Puppeteer Page object representing the opened popup.
 * @throws {Error} If the service worker or popup page are not found within a reasonable timeout.
 */
async function openPopup() {
    const worker = await getExtensionServiceWorker();
    await worker.evaluate(() => chrome.action.openPopup());
    const popupTarget = await global.browser.waitForTarget(
        target =>
            target.type() === 'page' &&
            target.url().endsWith('popup.html')
    );

    return popupTarget.asPage();
}

/**
 * Opens the extension's options.
 * @returns {Promise<puppeteer.Page>} A Promise that resolves with the Puppeteer Page object representing the opened options.
 * @throws {Error} If the options page is not found within a reasonable timeout.
 */
async function openOptions() {
    const page = await global.browser.newPage();
    await page.goto(`${global.extensionPath}/options.html`);

    return page;
}

/**
 * Opens the config.examplePage
 * @returns {Promise<puppeteer.Page>} A Promise that resolves with the Puppeteer Page object representing the example page.
 * @throws {Error} If the example page is not found within a reasonable timeout.
 */
async function openExamplePage() {
    const page = await global.browser.newPage();
    await page.goto(config.examplePage);

    return page;
}

/**
 * Retrieves a value from `chrome.storage.local`.
 * @param {puppeteer.Page} page The Puppeteer Page object representing the extension's page.
 * @param {string} key The key under which the value is stored in `chrome.storage.local`.
 * @returns {Promise<any>} A Promise that resolves with the stored value. Resolves with `undefined` if the key is not found.
 * @throws {Error} If there's an issue accessing `chrome.storage.local` or if the promise within `page.evaluate` rejects.
 */
async function waitForStoredValue(page, key) {
    return await page.evaluate((k) => {
        return new Promise((resolve) => {
            chrome.storage.local.get(k, (result) => {
                resolve(result[k]);
            });
        });
    }, key);
}

module.exports = {
    getBrowser,
    getExtensionId,
    openPopup,
    openOptions,
    openExamplePage,
    waitForStoredValue,
};
