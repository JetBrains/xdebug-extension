const DEFAULT_TRIGGER_VALUE = 'YOUR-NAME';

const getCookie = name =>
    decodeURIComponent(document.cookie.split(';').find(cookie => cookie.trim().startsWith(`${name}=`))?.split('=')[1]);

const setCookie = (name, value, days = 365) =>
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()};path=/`;

const getStatusMap = (settings) => {
    const { xdebugDebugTrigger, xdebugTraceTrigger, xdebugProfileTrigger } = settings;
    return {
        1: { name: 'XDEBUG_SESSION', trigger: xdebugDebugTrigger },
        2: { name: 'XDEBUG_PROFILE', trigger: xdebugProfileTrigger },
        3: { name: 'XDEBUG_TRACE', trigger: xdebugTraceTrigger },
    };
};

const getCurrentStatus = () => {
    return new Promise((resolve) => {
        chrome.storage.local.get({
            xdebugDebugTrigger: DEFAULT_TRIGGER_VALUE,
            xdebugTraceTrigger: DEFAULT_TRIGGER_VALUE,
            xdebugProfileTrigger: DEFAULT_TRIGGER_VALUE
        }, (settings) => {
            const statusMap = getStatusMap(settings);
            for (const [idx, { name, trigger }] of Object.entries(statusMap)) {
                if (getCookie(name) === trigger) {
                    resolve(+idx);
                    return;
                }
            }

            resolve(0);
        });
    });
};

const setStatus = status => {
    return new Promise((resolve) => {
        chrome.storage.local.get({
            xdebugDebugTrigger: DEFAULT_TRIGGER_VALUE,
            xdebugTraceTrigger: DEFAULT_TRIGGER_VALUE,
            xdebugProfileTrigger: DEFAULT_TRIGGER_VALUE
        }, (settings) => {
            const statusMap = getStatusMap(settings);
            for (const { name } of Object.values(statusMap)) {
                setCookie(name, null, -1); // Delete existing cookies
            }

            if (status > 0 && statusMap[status]) {
                const { name, trigger } = statusMap[status];
                setCookie(name, trigger);
            }

            resolve();
        });
    });
};

// Listens for messages from the background script
chrome.runtime.onMessage.addListener((msg, _, res) => {
    switch (msg.cmd) {
        case 'getStatus':
            getCurrentStatus().then(status => res({ status }));
            return true;
        case 'setStatus':
            setStatus(msg.status).then(() => res({ status: msg.status }));
            return true;
        default:
            res({ status: 0 });
            return true;
    }
});
