$(document).ready(function () {
    // 1. 페이지 로드 시 기존 설정값 불러오기
    browser.storage.local.get(['ollamaServerUrl', 'defaultModel'], function (result) {
        if (result.ollamaServerUrl) {
            $('#ollama-server-input').val(result.ollamaServerUrl);
            fetchModels(result.ollamaServerUrl, result.defaultModel);
        }
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
        const statusMessage = $('#connection-status');
        statusMessage.text(message).removeClass('hidden text-red-600 text-green-600 text-gray-600').addClass(colorClass).addClass('block');
    }
});