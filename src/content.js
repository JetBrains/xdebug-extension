const DEFAULT_TRIGGER_VALUE = 'YOUR-NAME';

const getCookie = (name) => {
    const cookie = document.cookie.split(';').find((c) => c.trim().startsWith(`${name}=`));
    return cookie ? decodeURIComponent(cookie.split('=')[1]) : null;
};

const setCookie = (name, value, days = 365) => {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/`;
};

const getDomainForCookie = () => {
    return window.location.hostname;
};

const deleteCookie = name => {
    setCookie(name, null, -1);

    const hostname = window.location.hostname;
    if (hostname === 'localhost' || /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname)) {
        return;
    }

    const parts = hostname.split('.');
    for (let i = 0; i < parts.length - 1; i++) {
        const domain = parts.slice(i).join('.');
        document.cookie = `${name}=;domain=${domain};path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
};

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
                deleteCookie(name);
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
        case 'getDomain':
            res({ domain: getDomainForCookie() });
            return true;
        default:
            res({ status: 0 });
            return true;
    }
});
