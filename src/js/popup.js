$(document).ready(function () {
    const OLLAMA_IMAGE = "ollama-image"
    const OLLAMA_TEXT = "ollama-text"

    browser.runtime.sendMessage({ action: "requestContext" })
        .then(response => {
            if (response) {
                const { context, imageUrl, selectionText} = response;
                $('#input_context').val(context)
                $('#input_imageUrl').val(imageUrl || "")
                $('#input_selectionText').val(selectionText || "")
                initializeUIForContext(context, imageUrl, selectionText);
            }
        })
        .catch(error => {
            console.error(error);
            showError("컨텍스트 정보를 가져오는 데 실패했습니다.");
        });

    browser.storage.local.get(['ollamaServerUrl', 'defaultModel', 'textPrompts', 'imagePrompts'], function (result) {
        const ollamaServerUrl = result.ollamaServerUrl || '';
        const defaultModel = result.defaultModel || '';
        const textPrompts = result.textPrompts || [];
        const imagePrompts = result.imagePrompts || [];

        initializePopup(ollamaServerUrl, defaultModel, textPrompts, imagePrompts);
    });

    $('#prompt-list').on('change', function () {
        const selectedPrompt = $(this).val();
        if (selectedPrompt) {
            $('#prompt-input').val(selectedPrompt);
        }
    });

    $('#save-prompt-button').on('click', function () {
        const promptContent = $('#prompt-input').val();
        if (promptContent.trim() === '') {
            showStatusMessage('저장할 프롬프트 내용을 입력하세요.', 'text-red-600');
            return;
        }

        const isImageContext = isImageAction()
        const dbKey = isImageContext ? 'imagePrompts' : 'textPrompts';

        browser.storage.local.get(dbKey, function (result) {
            const prompts = result[dbKey] || [];
            prompts.push(promptContent.trim().replace(/"/g,"'"));
            browser.storage.local.set({ [dbKey]: prompts }, function () {
                showStatusMessage('프롬프트가 성공적으로 저장되었습니다!', 'text-green-600');
                updatePromptList(prompts);
            });
        });
    });

    $('#run-button').on('click', async function () {
        const promptText = $('#prompt-input').val();
        const selectedModel = $('#model-list').val();

        if (!promptText || !selectedModel) {
            showError('프롬프트 내용과 모델을 모두 선택해주세요.');
            return;
        }

        $('#run-button').prop('disabled', true);
        $('#loading-spinner').removeClass('hidden');
        $('#response-output').html('');
        hideError();
        hideStatusMessage();

        const isImageContext = isImageAction() 
        if ( isImageContext) {
            const imageUrl =  $("#input_imageUrl").val() 
            callImageAction(promptText, selectedModel, imageUrl)
        } else {
            callTextAction(promptText, selectedModel)
        }
    });

    async function callTextAction(promptText, selectedModel) {
        await fetchAndProcessResponse(promptText, selectedModel, false);
    }

    async function callImageAction(promptText, selectedModel, imageUrl) {
        await fetchAndProcessResponse(promptText, selectedModel, true, imageUrl);
    }

    async function fetchAndProcessResponse(promptText, selectedModel, isImageContext, imageUrl = "") {
        const [currentTab] = await browser.tabs.query({ active: true, currentWindow: true });

        const action = getContentAction();
        let content;
        let images

        try {
            if (isImageContext) {
                images = [(await browser.runtime.sendMessage({ action: action, imageUrl: imageUrl })).content];
                content = ""
            } else {
                content = (await browser.tabs.sendMessage(currentTab.id, { action: action })).content;
                images = []
            }
        } catch (error) {
            showError(`현재 탭의 컨텐츠를 가져오는 데 실패했습니다. ${error}`);
            disableRunButtonAndHideSpinner();
            return;
        }

        try {
            const ollamaResponse = await callOllamaApi(promptText, selectedModel, content, images);
            const renderedHtml = marked.parse(ollamaResponse);
            $('#response-output').html(renderedHtml);
        } catch (error) {
            showError(error.message);
        } finally {
            disableRunButtonAndHideSpinner();
        }
    }

    function disableRunButtonAndHideSpinner() {
        $('#run-button').prop('disabled', false);
        $('#loading-spinner').addClass('hidden');
    }

    function isImageAction() {
        return $('#input_context').val() === OLLAMA_IMAGE
    }

    function getContentAction(){
        const context = $('#input_context').val()
        if(context === OLLAMA_TEXT){
            return "getSelectedText"
        }else if(context === OLLAMA_IMAGE){
            return "getImageData"
        }    
        return "getPageContent"
    }


    async function initializePopup(ollamaServerUrl, defaultModel, textPrompts, imagePrompts) {
        if (!ollamaServerUrl) {
            showError('설정 화면에서 Ollama 서버 주소를 먼저 설정해주세요.');
            return;
        }

        try {
            const models = await fetchModels(ollamaServerUrl);
            updateModelList(models, defaultModel);

            if($('#input_context').val().length<1){
                updatePromptList(textPrompts);
            }

            if(getContentAction()=="getPageContent"){
                const [currentTab] = await browser.tabs.query({ active: true, currentWindow: true });
                content = (await browser.tabs.sendMessage(currentTab.id, { action: "getPageContent"})).content;
                $('#response-output').html(content)


            }
        } catch (error) {
            showError(error.message);
        }
    }

    function initializeUIForContext(context, imageUrl, selectionText) {
        if (context === OLLAMA_IMAGE) {
            showStatusMessage('이미지를 분석할 준비가 되었습니다.', 'text-green-600');
            $('#model-list option').each(function () {
                if (!$(this).hasClass('image-model')) {
                    $(this).hide();
                } else {
                    $(this).show();
                }
            });
            browser.storage.local.get('imagePrompts', (result) => {
                updatePromptList(result.imagePrompts || []);
            });
        } else if (context === OLLAMA_TEXT) {
            showStatusMessage('선택된 텍스트를 분석할 준비가 되었습니다.', 'text-green-600');
            $('#model-list option').show();
            browser.storage.local.get('textPrompts', (result) => {
                updatePromptList(result.textPrompts || []);
            });
        }
    }

    async function fetchModels(url) {
        try {
            const response = await fetch(`${url}/api/tags`);
            if (!response.ok) {
                throw new Error('Ollama 서버에 연결할 수 없습니다. 주소를 확인해주세요.');
            }
            const data = await response.json();
            return data.models;
        } catch (error) {
            throw new Error(`모델 목록을 가져오는 데 실패했습니다: ${error.message}`);
        }
    }

    function updateModelList(models, defaultModel) {
        const modelList = $('#model-list');
        modelList.prop('disabled', false).empty();

        models.forEach(model => {
            const option = `<option value="${model.name}">${model.name}</option>`;
            modelList.append(option);
            if (model.name.includes('llava') || model.name.includes('vision')) {
                modelList.find(`option[value="${model.name}"]`).addClass('image-model');
            }
        });

        if (defaultModel && modelList.find(`option[value="${defaultModel}"]`).length) {
            modelList.val(defaultModel);
        }
    }

    function updatePromptList(prompts) {
        const promptList = $('#prompt-list');
        promptList.empty().append('<option value="">프롬프트를 선택하세요</option>');
        prompts.forEach(prompt => {
            const option = `<option value="${prompt}">${prompt.substring(0, 30)}...</option>`;
            promptList.append(option);
        });
    }

    async function callOllamaApi(prompt, model, content, images) {
        const ollamaServerUrl = await browser.storage.local.get('ollamaServerUrl').then(r => r.ollamaServerUrl);
        if (!ollamaServerUrl) { throw new Error('Ollama 서버 주소가 설정되지 않았습니다.');
        }

        const input_prompt = content.length > 0 ? `${prompt}\n\n${content}` : `${prompt}\n\n`
        const url = `${ollamaServerUrl}/api/chat`;
        const payload = {
            model: model,
            messages: [
                {
                    role: "system",
                    content: prompt,
                },
                {
                    role: "user",
                    content: content,
                    images: images
                }
            ],
            stream: true
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error('Ollama API 호출에 실패했습니다.');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let result = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.trim() === '') continue;
                try {
                    const data = JSON.parse(line);
                    if (data.message && data.message.content) {
                        result += data.message.content;
                        $('#response-output').html(marked.parse(result));
                    }
                } catch (e) {
                    console.error('JSON 파싱 오류:', e);
                }
            }
        }
        return result;
    }

    function showStatusMessage(message, colorClass) {
        const statusMessage = $('#status-message');
        statusMessage.text(message).removeClass('hidden').removeClass('text-red-600 text-green-600').addClass(colorClass).addClass('block');
        setTimeout(() => {
            statusMessage.addClass('hidden');
        }, 3000);
    }

    function showError(message) {
        $('#error-message').text(message).removeClass('hidden');
    }

    function hideError() {
        $('#error-message').addClass('hidden');
    }

    function hideStatusMessage() {
        $('#status-message').addClass('hidden').removeClass('text-red-600 text-green-600');
    }
});
