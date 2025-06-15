document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        methodSelect: document.getElementById('method-select'),
        urlInput: document.getElementById('url-input'),
        sendBtn: document.getElementById('send-btn'),
        headersTableBody: document.getElementById('headers-table-body'),
        addHeaderBtn: document.getElementById('add-header'),
        requestBody: document.getElementById('request-body'),
        responseStatus: document.getElementById('response-status'),
        responseBody: document.getElementById('response-body'),
        responseHeaders: document.getElementById('response-headers'),
        responseCookies: document.getElementById('response-cookies'),
        historyList: document.getElementById('history-list'),
        collectionsList: document.getElementById('collections-list'),
        authType: document.getElementById('auth-type'),
        authFields: document.getElementById('auth-fields'),
        tabs: document.querySelectorAll('.tab'),
        tabContents: document.querySelectorAll('.tab-content'),
        responseTabs: document.querySelectorAll('.response-tab'),
        responseContents: document.querySelectorAll('.response-content'),
        paramsTableBody: document.getElementById('params-table-body'),
        addParamBtn: document.getElementById('add-param'),
        clearHistoryBtn: document.getElementById('clear-history-btn'),
        responseFormat: document.getElementById('response-format'),
        newCollectionBtn: document.getElementById('new-collection-btn'),
        addFlowNodeBtn: document.getElementById('add-flow-node'),
        flowCanvas: document.getElementById('flow-canvas'),
        runFlowBtn: document.getElementById('run-flow'),
        modal: document.getElementById('response-modal'),
        modalTabs: document.querySelectorAll('.modal-tab'),
        modalTabContents: document.querySelectorAll('.modal-tab-content'),
        modalBody: document.getElementById('modal-body'),
        modalHeaders: document.getElementById('modal-headers'),
        modalCookies: document.getElementById('modal-cookies')
    };
    
    let lastResponse = null;
    
    const callbacks = {
        loadHistory: () => loadHistory(elements.historyList, elements.methodSelect, elements.urlInput),
        runFlow: async flow => {
            try {
                const results = await executeFlow(flow, {
                    onStatusUpdate: status => elements.responseStatus.textContent = status
                });
                
                elements.responseBody.innerHTML = results.map(result => 
                    `<div>Node ${result.nodeId}: ${result.error || JSON.stringify(result.response.body, null, 2)}</div>`
                ).join('<hr>');
                
                if (results.length > 0 && results[results.length - 1].response) {
                    lastResponse = results[results.length - 1].response;
                    renderResponse(elements, lastResponse, elements.responseFormat.value);
                    updateResponseTimeChart(lastResponse.time);
                }
            } catch (error) {
                elements.responseBody.textContent = error.message;
            }
        }
    };
    
    setupUI(elements, callbacks);
    addRow(elements.headersTableBody, 'header');
    loadHistory(elements.historyList, elements.methodSelect, elements.urlInput);
    
    elements.sendBtn.addEventListener('click', async () => {
        const headers = collectHeaders(elements.headersTableBody);
        const queryParams = collectQueryParams(elements.paramsTableBody);
        let url = elements.urlInput.value;
        
        if (queryParams.length) {
            const params = new URLSearchParams(queryParams);
            url += (url.includes('?') ? '&' : '?') + params.toString();
        }
        
        const authConfig = collectAuthConfig(elements.authType, elements.authFields);
        const queryAuth = handleAuth(headers, authConfig);
        
        if (queryAuth) {
            url += (url.includes('?') ? '&' : '?') + `${queryAuth.key}=${encodeURIComponent(queryAuth.value)}`;
        }
        
        try {
            elements.responseStatus.classList.add('loading');
            const response = await sendRequest({
                method: elements.methodSelect.value,
                url,
                headers,
                body: elements.requestBody.value,
                onStatusUpdate: status => elements.responseStatus.textContent = status
            });
            
            lastResponse = response;
            renderResponse(elements, response, elements.responseFormat.value);
            addToHistory(
                elements.historyList,
                elements.methodSelect.value,
                elements.urlInput.value,
                response.status,
                elements.methodSelect,
                elements.urlInput
            );
            
            updateResponseTimeChart(response.time);
        } catch (error) {
            elements.responseStatus.classList.remove('loading');
            elements.responseBody.textContent = error.message;
            console.error('Request failed:', error);
        }
    });
    
    elements.newCollectionBtn.addEventListener('click', () => {
        const name = prompt('Enter collection name:');
        if (name) {
            addCollection(elements.collectionsList, name, elements.methodSelect, elements.urlInput);
        }
    });
    
    elements.responseFormat.addEventListener('change', () => {
        if (lastResponse) {
            renderResponse(elements, lastResponse, elements.responseFormat.value);
        }
    });
});

function collectHeaders(headersTableBody) {
    const headers = {};
    headersTableBody.querySelectorAll('tr').forEach(row => {
        const key = row.querySelector('.header-key').value;
        const value = row.querySelector('.header-value').value;
        if (key && value) {
            headers[key] = value;
        }
    });
    return headers;
}

function collectQueryParams(paramsTableBody) {
    const params = [];
    paramsTableBody.querySelectorAll('tr').forEach(row => {
        const key = row.querySelector('.param-key').value;
        const value = row.querySelector('.param-value').value;
        if (key && value) {
            params.push([key, value]);
        }
    });
    return params;
}

function collectAuthConfig(authType, authFields) {
    const type = authType.value;
    const credentials = {};
    
    switch(type) {
        case 'basic':
            credentials.username = document.getElementById('basic-username')?.value;
            credentials.password = document.getElementById('basic-password')?.value;
            break;
        case 'bearer':
            credentials.token = document.getElementById('bearer-token')?.value;
            break;
        case 'api-key':
            credentials.key = document.getElementById('api-key')?.value;
            credentials.value = document.getElementById('api-value')?.value;
            credentials.location = document.getElementById('api-key-location')?.value;
            break;
    }
    
    return { type, credentials };
}

function addToHistory(historyList, method, url, status, methodSelect, urlInput) {
    const history = JSON.parse(localStorage.getItem('apiHistory') || '[]');
    
    const existingIndex = history.findIndex(item => 
        item.method === method && item.url === url
    );
    
    if (existingIndex >= 0) {
        history.splice(existingIndex, 1);
    }
    
    history.unshift({
        method,
        url,
        status,
        timestamp: new Date().toISOString()
    });
    
    if (history.length > 50) {
        history.pop();
    }
    
    localStorage.setItem('apiHistory', JSON.stringify(history));
    loadHistory(historyList, methodSelect, urlInput);
}

function loadHistory(historyList, methodSelect, urlInput) {
    const history = JSON.parse(localStorage.getItem('apiHistory') || '[]');
    historyList.innerHTML = '';
    
    history.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div>
                <span class="method-tag ${item.method}">${item.method}</span>
                <span>${item.url}</span>
            </div>
            <small>${item.status} • ${new Date(item.timestamp).toLocaleString()}</small>
        `;
        
        historyItem.addEventListener('click', () => {
            methodSelect.value = item.method;
            urlInput.value = item.url;
        });
        
        historyList.appendChild(historyItem);
    });
}

function addCollection(collectionsList, name, methodSelect, urlInput) {
    const collections = JSON.parse(localStorage.getItem('apiCollections') || '[]');
    const collection = {
        id: generateUUID(),
        name,
        requests: []
    };
    
    collections.push(collection);
    localStorage.setItem('apiCollections', JSON.stringify(collections));
    loadCollections(collectionsList, methodSelect, urlInput);
}

function loadCollections(collectionsList, methodSelect, urlInput) {
    const collections = JSON.parse(localStorage.getItem('apiCollections') || '[]');
    collectionsList.innerHTML = '';
    
    collections.forEach(collection => {
        const collectionItem = document.createElement('div');
        collectionItem.className = 'collection-item';
        collectionItem.textContent = collection.name;
        
        collectionItem.addEventListener('click', () => {
            // Implement collection view
        });
        
        collectionsList.appendChild(collectionItem);
    });
}

function updateResponseTimeChart(time) {
    const chart = document.getElementById('response-time-chart');
    chart.innerHTML = `<div style="width: ${Math.min(time/10, 100)}%; height: 20px; background-color: #4ecdc4;"></div>`;
}