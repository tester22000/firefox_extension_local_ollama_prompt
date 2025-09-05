
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