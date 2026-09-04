const DEFAULT_TRIGGER_VALUE = 'YOUR-NAME';
const COOKIE_LIFETIME_SECONDS = 365 * 24 * 60 * 60;

const getSettings = async () => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get({
            xdebugDebugTrigger: DEFAULT_TRIGGER_VALUE,
            xdebugTraceTrigger: DEFAULT_TRIGGER_VALUE,
            xdebugProfileTrigger: DEFAULT_TRIGGER_VALUE
        }, (settings) => {
            if (chrome.runtime.lastError) {
                return reject(new Error(chrome.runtime.lastError));
            }
            resolve(settings);
        });
    });
};

const getTab = async () => {
    try {
        const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        return tab;
    } catch (error) {
        console.log('Error getting active tab:', error);
        return null;
    }
};

const getStatusMap = (settings) => ({
    1: { name: 'XDEBUG_SESSION', trigger: settings.xdebugDebugTrigger },
    2: { name: 'XDEBUG_PROFILE', trigger: settings.xdebugProfileTrigger },
    3: { name: 'XDEBUG_TRACE', trigger: settings.xdebugTraceTrigger },
});

const isHttpUrl = (url) => {
    try {
        return ['http:', 'https:'].includes(new URL(url).protocol);
    } catch {
        return false;
    }
};

const decodeCookieValue = (value) => {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
};

const getStatusFromCookies = async (url, settings) => {
    const cookies = await chrome.cookies.getAll({ url });
    const statusMap = getStatusMap(settings);

    for (const [status, { name, trigger }] of Object.entries(statusMap)) {
        const cookie = cookies.find(candidate => candidate.name === name);
        if (cookie && decodeCookieValue(cookie.value) === trigger) {
            return Number(status);
        }
    }

    return 0;
};

const removeCookie = async (cookie) => {
    const domain = cookie.domain.replace(/^\./, '');
    const details = {
        url: `${cookie.secure ? 'https' : 'http'}://${domain}${cookie.path}`,
        name: cookie.name,
        storeId: cookie.storeId,
    };

    if (cookie.partitionKey) {
        details.partitionKey = cookie.partitionKey;
    }

    await chrome.cookies.remove(details);
};

const setStatusWithCookies = async (url, status, settings) => {
    const statusMap = getStatusMap(settings);
    const statusCookieNames = new Set(Object.values(statusMap).map(({ name }) => name));
    const cookies = await chrome.cookies.getAll({ url });

    await Promise.all(
        cookies
            .filter(cookie => statusCookieNames.has(cookie.name))
            .map(removeCookie)
    );

    if (status > 0 && statusMap[status]) {
        const { name, trigger } = statusMap[status];
        await chrome.cookies.set({
            url,
            name,
            value: encodeURIComponent(trigger),
            path: '/',
            expirationDate: Date.now() / 1000 + COOKIE_LIFETIME_SECONDS,
        });
    }

    return status;
};

const sendTabCommand = async (tab, message, settings) => {
    try {
        return await chrome.tabs.sendMessage(tab.id, message);
    } catch (error) {
        if (!isHttpUrl(tab.url)) {
            throw error;
        }

        if (message.cmd === 'getStatus') {
            return { status: await getStatusFromCookies(tab.url, settings) };
        }

        if (message.cmd === 'setStatus') {
            return { status: await setStatusWithCookies(tab.url, message.status, settings) };
        }

        throw error;
    }
};

const updateIcon = (status, tabId) => {
    const iconInfo = {
        0: { title: 'Disabled', image: 'img/disable32.png' },
        1: { title: 'Debugging', image: 'img/debug32.png' },
        2: { title: 'Profiling', image: 'img/profile32.png' },
        3: { title: 'Tracing', image: 'img/trace32.png' }
    }[status] || iconInfo[0];
    if (typeof chrome !== 'undefined' && chrome.action) {
        chrome.action.setTitle({ tabId, title: iconInfo.title });
        chrome.action.setIcon({ tabId, path: iconInfo.image });
    } else if (typeof browser !== 'undefined' && browser.pageAction) {
        browser.pageAction.setTitle({ tabId, title: iconInfo.title });
        browser.pageAction.setIcon({ tabId: tabId, path: iconInfo.image });
    }
};

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if ((changeInfo?.status || tab?.status) !== 'complete') {
        return;
    }

    try {
        const { xdebugDebugTrigger, xdebugTraceTrigger, xdebugProfileTrigger } = await getSettings();
        const response = await sendTabCommand(tab, {
            cmd: 'getStatus',
            debugTrigger: xdebugDebugTrigger,
            traceTrigger: xdebugTraceTrigger,
            profileTrigger: xdebugProfileTrigger
        }, { xdebugDebugTrigger, xdebugTraceTrigger, xdebugProfileTrigger });

        updateIcon(response?.status, tabId);
    } catch (error) {
        console.log('Error during tab update:', error);
    }
});

chrome.commands.onCommand.addListener(async (command) => {
    try {
        const tab = await getTab();
        if (!tab) {
            return;
        }

        const settings = await getSettings();
        const response = await sendTabCommand(tab, {
            cmd: 'getStatus',
            debugTrigger: settings.xdebugDebugTrigger,
            traceTrigger: settings.xdebugTraceTrigger,
            profileTrigger: settings.xdebugProfileTrigger
        }, settings);

        let newState;

        switch (command) {
            case 'run-toggle-debug':
                newState = response?.status === 1 ? 0 : 1; // Toggle debug (1 <-> 0)
                break;
            case 'run-toggle-profile':
                newState = response?.status === 2 ? 0 : 2; // Toggle profile (2 <-> 0)
                break;
            case 'run-toggle-trace':
                newState = response?.status === 3 ? 0 : 3; // Toggle trace (3 <-> 0)
                break;
            default:
                return; // Ignore unknown commands
        }

        const setResponse = await sendTabCommand(tab, {
            cmd: 'setStatus',
            status: newState,
            debugTrigger: settings.xdebugDebugTrigger,
            traceTrigger: settings.xdebugTraceTrigger,
            profileTrigger: settings.xdebugProfileTrigger
        }, settings);
        updateIcon(setResponse?.status, tab.id);
    } catch (error) {
        console.log('Error during command execution:', error);
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!['getStatus', 'setStatus'].includes(request.cmd)) {
        return;
    }

    (async () => {
        try {
            const settings = await getSettings();
            const tab = await getTab();
            if (!tab) {
                return { status: 0 };
            }

            const response = await sendTabCommand(tab, {
                ...request,
                debugTrigger: settings.xdebugDebugTrigger,
                traceTrigger: settings.xdebugTraceTrigger,
                profileTrigger: settings.xdebugProfileTrigger
            }, settings);

            updateIcon(response?.status, tab.id);
            return response;
        } catch (error) {
            console.log(`Error during ${request.cmd}:`, error);
            return { status: 0 };
        }
    })().then(sendResponse);

    return true;
});

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        chrome.runtime.setUninstallURL('https://forms.gle/XmCBqknF5BZJQhHX6');
        chrome.commands.getAll((commands) => {
            let missingShortcuts = [];
            for (let { name, shortcut } of commands) {
                if (shortcut === '') {
                    missingShortcuts.push(name);
                }
            }

            if (missingShortcuts.length > 0) {
                console.log('Missing shortcuts:', missingShortcuts);
            }
        });
    }
});

