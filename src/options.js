document.addEventListener('DOMContentLoaded', () => {
    const DEFAULT_IDE_KEY = 'XDEBUG_ECLIPSE';
    const ideKeyInput = document.getElementById('idekey');
    const traceTriggerInput = document.getElementById('tracetrigger');
    const profileTriggerInput = document.getElementById('profiletrigger');
    const saveButton = document.getElementById('save');

    chrome.storage.local.get({
        xdebugIdeKey: DEFAULT_IDE_KEY,
        xdebugTraceTrigger: DEFAULT_IDE_KEY,
        xdebugProfileTrigger: DEFAULT_IDE_KEY
    }, (settings) => {
        ideKeyInput.value = settings.xdebugIdeKey;
        traceTriggerInput.value = settings.xdebugTraceTrigger;
        profileTriggerInput.value = settings.xdebugProfileTrigger;
    });

    saveButton.addEventListener('click', () => {
        chrome.storage.local.set({
            xdebugIdeKey: ideKeyInput.value,
            xdebugTraceTrigger: traceTriggerInput.value,
            xdebugProfileTrigger: profileTriggerInput.value,
        });
    });

    chrome.commands.getAll((commands) => {
        const helpDiv = document.getElementById('help');
        const existingShortcuts = helpDiv.querySelectorAll('p');
        existingShortcuts.forEach(p => p.remove());

        if (commands.length === 0) {
            const newP = document.createElement('p');
            newP.appendChild(document.createTextNode("No shortcuts defined"));
            helpDiv.appendChild(newP);
            return;
        }

        for (const { name, shortcut } of commands) {
            if (!shortcut) {
                break;
            }
            const parts = shortcut.split('+');
            const newP = document.createElement('p');
            parts.forEach((part, index) => {
                const kbd = document.createElement('kbd');
                kbd.textContent = part;
                newP.appendChild(kbd);
                if (index < parts.length - 1) {
                    newP.appendChild(document.createTextNode(" + "));
                }
            });

            newP.appendChild(document.createTextNode(name.replace(/_|-|run/g, " ")));
            helpDiv.appendChild(newP);
        }
    });
});