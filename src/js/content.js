// 백그라운드 스크립트 또는 팝업으로부터 메시지를 수신하는 리스너
browser.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
        if (request.action === "getPageContent") {
            const defuddle = new Defuddle(document);
            const result = defuddle.parse();
            sendResponse({ content: result.content });
        }  else if (request.action === "getSelectedText") {
            const selectedText = window.getSelection().toString();
            sendResponse({ content: selectedText });
        }
    }
);