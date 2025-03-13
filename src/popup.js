document.addEventListener('DOMContentLoaded', async () => {
    const radioButtons = document.querySelectorAll('input[name="state"]');
    const optionsLink = document.querySelector('#options');

    document.querySelectorAll('[data-locale]').forEach(e => {
        const message = chrome.i18n.getMessage(e.dataset.locale);
        const lastNode = e.childNodes[e.childNodes.length - 1];
        if (lastNode.nodeType === Node.TEXT_NODE) {
            lastNode.textContent = message;
        } else if (e.childNodes.length === 0){
            e.innerText = message;
        }
    });

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) {
            return;
        }

        const response = await chrome.tabs.sendMessage(tab.id, { cmd: "getStatus" });
        if (response?.status === undefined) {
            return
        }

        const radioButton = document.querySelector(`input[name="state"][value="${response.status}"]`);
        if (radioButton) {
            radioButton.checked = true;
        }
    } catch (error) {
        console.log("Error retrieving status:", error);
    }

    optionsLink.addEventListener('click', e => {
        e.preventDefault();
        chrome.runtime.openOptionsPage()
    });

    radioButtons.forEach(button => {
        button.addEventListener('change', e => {
            chrome.runtime.sendMessage({
                cmd: "setStatus",
                status: +e.target.value
            }).then(() => window.close());
        });
    });
});
