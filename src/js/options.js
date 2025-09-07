$(document).ready(function () {
    // 1. 페이지 로드 시 기존 설정값 불러오기
    browser.storage.local.get(['ollamaServerUrl', 'defaultModel','textPrompts','imagePrompts'], function (result) {
        if (result.ollamaServerUrl) {
            $('#ollama-server-input').val(result.ollamaServerUrl);
            fetchModels(result.ollamaServerUrl, result.defaultModel);
        }
        updatePromptList('text-prompt-list',result.textPrompts)
        updatePromptList('image-prompt-list',result.imagePrompts)
    });

    // 2. '연결 테스트' 버튼 클릭 이벤트
    $('#test-connection-button').on('click', function () {
        const url = $('#ollama-server-input').val();
        if (!url) {
            updateStatus('서버 주소를 입력해주세요.', 'text-red-600');
            return;
        }
        updateStatus('연결 테스트 중...', 'text-gray-600');
        fetchModels(url);
    });

    // 3. '설정 저장' 버튼 클릭 이벤트
    $('#save-settings-button').on('click', function () {
        const ollamaServerUrl = $('#ollama-server-input').val();
        const defaultModel = $('#model-select').val();

        if (!ollamaServerUrl || !defaultModel) {
            updateStatus('서버 주소와 기본 모델을 모두 선택해주세요.', 'text-red-600');
            return;
        }

        browser.storage.local.set({
            ollamaServerUrl: ollamaServerUrl,
            defaultModel: defaultModel
        }, function () {
            updateStatus('설정이 저장되었습니다!', 'text-green-600');
        });
    });

    // 4. Ollama API에서 모델 목록을 가져오는 함수
    function fetchModels(url, defaultModel = null) {
        const modelSelect = $('#model-select');
        modelSelect.prop('disabled', true).empty();
        modelSelect.append('<option value="">모델 목록 로드 중...</option>');

        fetch(`${url}/api/tags`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Ollama 서버에 연결할 수 없습니다. 주소를 확인해주세요.');
                }
                return response.json();
            })
            .then(data => {
                modelSelect.prop('disabled', false).empty();
                data.models.forEach(model => {
                    modelSelect.append(`<option value="${model.name}">${model.name}</option>`);
                });

                if (defaultModel) {
                    modelSelect.val(defaultModel);
                }

                updateStatus('연결 테스트 성공! 모델 목록이 로드되었습니다.', 'text-green-600');
            })
            .catch(error => {
                modelSelect.empty();
                modelSelect.prop('disabled', true);
                modelSelect.append('<option value="">서버에 연결할 수 없습니다</option>');
                updateStatus(error.message, 'text-red-600');
            });
    }

    // 5. 상태 메시지를 업데이트하는 헬퍼 함수
    function updateStatus(message, colorClass) {
        const statusMessage = $('#status-message');
        statusMessage.text(message).removeClass('hidden text-red-600 text-green-600 text-gray-600').addClass(colorClass).addClass('block');
    }

    // 탭 클릭 시 동작
    $('.tabs li').click(function() {
        var tabId = $(this).data('tab');
        
        // 현재 활성화된 탭을 비활성화
        $('.tabs .active').removeClass('active');
        $('.tab-content.active').removeClass('active');

        // 클릭한 탭과 해당 내용을 활성화
        $(this).addClass('active');
        $('#' + tabId).addClass('active');

        $('#status-message').addClass("hidden").text("")
    });

    function updatePromptList(promptId, prompts) {
        const promptList = $(`#${promptId}`);
        promptList.empty().append('<option value="">프롬프트를 선택하세요</option>');
        prompts.forEach(prompt => {
            const option = `<option value="${prompt}">${prompt.substring(0, 30)}...</option>`;
            promptList.append(option);
        });
    }

    $('#text-prompt-list,#image-prompt-list').on('change', function () {
        const selectedPrompt = $(this).val();
        const id = $(this).attr('id')
        if(id === 'text-prompt-list'){
            $('#text-prompt-input').val(selectedPrompt);
        } else if ( id === "image-prompt-list"){
            $('#image-prompt-input').val(selectedPrompt);
        }
    });

    function addPromptContent(inputId, promptDbKey, promptListId){
        const promptContent = $(`#${inputId}`).val();
        if (promptContent.trim() === '') {
            updateStatus('저장할 프롬프트 내용을 입력하세요.', 'text-red-600');
            return;
        }
        browser.storage.local.get(promptDbKey, function (result) {
            const prompts = result[promptDbKey] || [];
            prompts.push(promptContent.trim().replace(/"/g,"'"));
            browser.storage.local.set({ [promptDbKey]: prompts }, function () {
                updateStatus('프롬프트가 성공적으로 저장되었습니다!', 'text-green-600');
                updatePromptList(promptListId, prompts);
            });
        });
    }

    $('#text-add-prompot-button,#image-add-prompot-button').on('click', function () {
        const id = $(this).attr("id")
        if(id === "text-add-prompot-button"){
            addPromptContent('text-prompt-input','textPrompts','text-prompt-list')
        } else if ( id == "image-add-prompot-button"){
            addPromptContent('image-prompt-input','imagePrompts','image-prompt-list')
        }
    });

    function deletePromptContent(promptDbKey, promptListId){
        const selectedIndex = $(`#${promptListId}`).prop('selectedIndex')
        if (selectedIndex < 1) {
            updateStatus('삭제할 프롬프트을 선택하세요', 'text-red-600');
            return;
        }
        browser.storage.local.get(promptDbKey, function (result) {
            const prompts = result[promptDbKey] || [];
            if ( prompts.length >= selectedIndex) {
                const newPrompts = prompts.filter( (_, index) => index != selectedIndex-1)
                browser.storage.local.set({ [promptDbKey]: newPrompts }, function () {
                    updateStatus('프롬프트를  성공적으로 삭제 했습니다.', 'text-green-600');
                    updatePromptList(promptListId, newPrompts);
                });
            }
        });
    }

    $('#text-delete-prompt-button,#image-delete-prompt-button').on('click', function () {
        const id = $(this).attr("id")
        if(id === "text-delete-prompt-button"){
            deletePromptContent('textPrompts','text-prompt-list')
        } else if ( id === "image-delete-prompt-button"){
            deletePromptContent('imagePrompts','image-prompt-list')
        }
    });

});