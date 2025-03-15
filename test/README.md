# Xdebug Helper by JetBrains Tests

These tests use Puppeteer to automate interactions with the Xdebug Helper.
By default the browser is run headless and the extension is tested against a local sever on port `8765`.

## Prerequisites

Ensure you have the following prerequisites installed:

* **Compatible Browser:** Needed for Puppeteer to control a browser instance (uses chromium by defualt)
* **Node.js and npm:** Required for running the test suite and managing dependencies.

## Installation

1. **Install Dependencies (WSL2 in this example):**

```bash
sudo apt update
sudo apt upgrade
sudo apt install nodejs
sudo snap install chromium
```

2. **Install npm Dependencies (within the test directory):**

```bash
cd test
npm install
```

## Running the Tests

From the test directory, execute the following command:

```bash
npm test
```

Upon successful execution, you should see output similar to this:

```bash
> xdebug-extension-test@1.0.1 test
> jest

 PASS  __TEST__/options.test.js
  Options Tests
    ✓ Should render options correctly (552 ms)
    ✓ Should render default shortcuts correctly (621 ms)
    ✓ Should set Debug Trigger correctly and save (559 ms)
    ✓ Should set Trace Trigger correctly and save (561 ms)
    ✓ Should set Profile Trigger correctly and save (552 ms)
    ✓ Should clear all text inputs when the clear button is clicked (489 ms)

 PASS  __TEST__/popup.test.js
  Popup Tests
    ✓ Should render popup correctly (760 ms)
    ✓ Should toggle debug mode and sets XDEBUG_SESSION cookie (844 ms)
    ✓ Should toggle trace mode and sets XDEBUG_TRACE cookie (799 ms)
    ✓ Should toggle profile mode and sets XDEBUG_PROFILE cookie (755 ms)
    ✓ Should toggle disabled mode and removes all cookies (720 ms)
    ✓ Should open options page in new tab (673 ms)

Test Suites: 2 passed, 2 total
Tests:       12 passed, 12 total
Snapshots:   0 total
Time:        5.022 s
Ran all test suites.
```
## Configuration

You can customize the test execution using the following environment variables.

---

`BROWSER_PATH` Specifies the path to the browser executable. Defaults to `/snap/bin/chromium`.
```bash
BROWSER_PATH=/usr/bin/google-chrome npm test
```
---

`EXAMPLE_PAGE` Sets the URL of the page used in tests. Defaults to `http://localhost:8765`.
```bash
EXAMPLE_PAGE=https://example.com/ npm test
```
---

`DEFAULT_TRIGGER_VALUE` Configures the default trigger value key for the Xdebug extension. Defaults to `YOUR-NAME`.
```bash
DEFAULT_TRIGGER_VALUE=MY_CUSTOM_KEY npm test
```
---

`TIMEOUT` Sets the timeout for browser operations (in milliseconds). Defaults to `3000` (3 seconds).
```bash
TIMEOUT=60000 npm test
```
---

`HEADLESS` Determines whether to run the browser in headless mode. Set to false for non-headless. Defaults to `true`.
```bash
HEADLESS=false npm test
```
---

`SLOW_MO` Slows down Puppeteer operations by the specified amount of time (in milliseconds). Defaults to `0`.
```bash
SLOW_MO=100 npm test
```
---

`DEV_TOOLS` Specifies whether to open DevTools when launching the browser. Set to true to open DevTools, false to keep them closed. Defaults to false.

```bash
DEV_TOOLS=true npm test
```

## Troubleshooting

### Browser was not found at the configured executablePath

Please verify that a compatible browser (like Chromium) is installed and accessible.

The expected default location is `/snap/bin/chromium`.

If your browser is installed elsewhere, set the `BROWSER_PATH` environment variable before running the tests. For example:

```bash
BROWSER_PATH=/path/to/your/browser npm test
```

### Failed to launch the browser process! Missing X server or $DISPLAY

If you are using a non-GUI distribution, such as in WSL/WSL2, you will need to set the `DISPLAY` environment variable. You can do this using the command:

```bash
export DISPLAY=:0
```
