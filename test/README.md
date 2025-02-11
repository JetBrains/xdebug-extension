# Xdebug Extension Tests

These tests use Puppeteer to automate interactions with the Xdebug Chrome extension.

## Prerequisites

Ensure you have the following prerequisites installed:

* **Chromium:** Needed for Puppeteer to control a browser instance.
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
> xdebug-extension-test@1.0.0 test
> npx jest .

 PASS  ./extension.test.js (8.03 s)
  Options Page Tests
    ✓ renders correctly (2599 ms)
  Popup Tests
    ✓ renders correctly (979 ms)
    ✓ toggles debug mode and sets XDEBUG_SESSION cookie (960 ms)
    ✓ toggles trace mode and sets XDEBUG_TRACE cookie (1070 ms)
    ✓ toggles profile mode and sets XDEBUG_PROFILE cookie (1100 ms)
    ✓ toggles disabled mode and removes all cookies (1070 ms)

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Snapshots:   0 total
Time:        8.057 s
Ran all test suites matching /./i.
```

## Troubleshooting

### Browser was not found at the configured executablePath

Double-check that Chromium is installed correctly and is at the exptected path by running the command:

```bash
which chromium-browser
```

The `config.chromiumPath` proptery in `extension.test.js` should match the output of this, e.g.

```js
const config = {
    chromiumPath: process.env.CHROMIUM_PATH || '/usr/bin/chromium-browser' <- should match 
    ...
```

Alternatively you can pass the `CHROMIUM_PATH` at runtime using the command:

```bash
CHROMIUM_PATH=/path/to/your/chromium-browser npm test
```

### Failed to launch the browser process! Missing X server or $DISPLAY

If you are using a non-GUI distribution, such as in WSL/WSL2, you will need to set the `DISPLAY` environment variable. You can do this using the command: 

```bash
export DISPLAY=:0
```