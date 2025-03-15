document.addEventListener('DOMContentLoaded', () => {
    const optionsForm = document.querySelector('form');
    const debugTriggerInput = document.getElementById('debugtrigger');
    const traceTriggerInput = document.getElementById('tracetrigger');
    const profileTriggerInput = document.getElementById('profiletrigger');
    const helpDiv = document.getElementById('help');

    document.querySelectorAll('[data-locale]').forEach(e => {
        e.innerText = chrome.i18n.getMessage(e.dataset.locale)
    });

    document.querySelector('button[type="reset"]').addEventListener('click', e => {
        e.preventDefault();
        debugTriggerInput.value = '';
        traceTriggerInput.value = '';
        profileTriggerInput.value = '';
    });

    document.querySelector('button[type="submit"]').addEventListener('click', e => {
        e.preventDefault();
        chrome.storage.local.set({
            xdebugDebugTrigger: debugTriggerInput.value,
            xdebugTraceTrigger: traceTriggerInput.value,
            xdebugProfileTrigger: profileTriggerInput.value
        });
        optionsForm.classList.add('success');
        setTimeout(() => optionsForm.classList.remove('success'), 1500);
    });

    chrome.storage.local.get({
        xdebugDebugTrigger: 'YOUR-NAME',
        xdebugTraceTrigger: null,
        xdebugProfileTrigger: null,
    }, (settings) => {
        debugTriggerInput.value = settings.xdebugDebugTrigger;
        traceTriggerInput.value = settings.xdebugTraceTrigger;
        profileTriggerInput.value = settings.xdebugProfileTrigger;
    });

    chrome.commands.getAll((commands) => {
        helpDiv.querySelectorAll('p').forEach(p => p.remove());

        if (commands.length === 0) {
            const newP = document.createElement('p');
            newP.appendChild(document.createTextNode('No shortcuts defined'));
            helpDiv.appendChild(newP);
            return;
        }

        for (const { name, shortcut , description } of commands) {    
            if (!shortcut) {
                break;
            }
            const parts = shortcut.split('+');
            const newP = document.createElement('p');
            parts.forEach((part, index) => {
                const newKbd = document.createElement('kbd');
                newKbd.textContent = part;
                newP.appendChild(newKbd);
                if (index < parts.length - 1) {
                    newP.appendChild(document.createTextNode(' + '));
                }
            });

            newP.appendChild(document.createTextNode(' ' + (description || chrome.i18n.getMessage("options_execute_action"))));
            helpDiv.appendChild(newP);
        }
    });
});
