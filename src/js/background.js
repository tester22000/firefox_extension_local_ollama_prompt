let lastClickedContext = null;

browser.runtime.onInstalled.addListener(() => {
    browser.contextMenus.create({
        id: "ollama-text",
        title: "선택 텍스트를 Ollama로 분석",
        contexts: ["selection"]
    });

    browser.contextMenus.create({
        id: "ollama-image",
        title: "이미지를 Ollama로 분석",
        contexts: ["image"]
    });
});


browser.contextMenus.onClicked.addListener(async (info, tab) => {
    lastClickedContext = {
        context: info.menuItemId,
        pageUrl: info.pageUrl,
        imageUrl: info.srcUrl,
        selectionText: info.selectionText
    };

    browser.action.openPopup()
});

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "requestContext") {
        sendResponse(lastClickedContext);
        lastClickedContext = null;
    } else if (request.action === "getImageData") {
        const imageUrl = request.imageUrl;
        fetch(imageUrl)
            .then(response => response.blob())
            .then(blob => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64data = reader.result.split(',')[1];
                    sendResponse({ content: base64data });
                };
                reader.readAsDataURL(blob);
            })
            .catch(error => {
                sendResponse({ error: `이미지를 Base64로 변환하는 데 실패했습니다. ${error}` });
            });
        return true;
    }
});
