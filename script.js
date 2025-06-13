  document.addEventListener('DOMContentLoaded', function() {
            // DOM Elements
            const methodSelect = document.getElementById('method-select');
            const urlInput = document.getElementById('url-input');
            const sendBtn = document.getElementById('send-btn');
            const headersTableBody = document.getElementById('headers-table-body');
            const addHeaderBtn = document.getElementById('add-header');
            const requestBody = document.getElementById('request-body');
            const responseStatus = document.getElementById('response-status');
            const responseBody = document.getElementById('response-body');
            const responseHeaders = document.getElementById('response-headers');
            const responseCookies = document.getElementById('response-cookies');
            const historyList = document.getElementById('history-list');
            const authType = document.getElementById('auth-type');
            const authFields = document.getElementById('auth-fields');
            const tabs = document.querySelectorAll('.tab');
            const tabContents = document.querySelectorAll('.tab-content');
            const responseTabs = document.querySelectorAll('.response-tab');
            const responseContents = document.querySelectorAll('.response-content');
            
            // Initialize
            loadHistory();
            updateAuthFields();
            
            // Event Listeners
            sendBtn.addEventListener('click', sendRequest);
            addHeaderBtn.addEventListener('click', addHeaderRow);
            authType.addEventListener('change', updateAuthFields);
            
            // Tab switching
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    tabs.forEach(t => t.classList.remove('active'));
                    tabContents.forEach(c => c.classList.remove('active'));
                    
                    tab.classList.add('active');
                    const tabId = tab.getAttribute('data-tab') + '-tab';
                    document.getElementById(tabId).classList.add('active');
                });
            });
            
            // Response tab switching
            responseTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    responseTabs.forEach(t => t.classList.remove('active'));
                    responseContents.forEach(c => c.classList.remove('active'));
                    
                    tab.classList.add('active');
                    const tabId = 'response-' + tab.getAttribute('data-response-tab');
                    document.getElementById(tabId).classList.add('active');
                });
            });
            
            // Functions
            function addHeaderRow() {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><input type="text" class="header-key" placeholder="Header name"></td>
                    <td><input type="text" class="header-value" placeholder="Header value"></td>
                    <td><input type="text" class="header-desc" placeholder="Optional description"></td>
                    <td><button class="remove-header">×</button></td>
                `;
                headersTableBody.appendChild(row);
                
                row.querySelector('.remove-header').addEventListener('click', () => {
                    row.remove();
                });
            }
            
            function updateAuthFields() {
                const type = authType.value;
                let html = '';
                
                switch(type) {
                    case 'basic':
                        html = `
                            <div style="margin-top: 1rem;">
                                <label>Username</label>
                                <input type="text" id="basic-username" style="width: 100%; margin-bottom: 0.5rem;">
                                
                                <label>Password</label>
                                <input type="password" id="basic-password" style="width: 100%;">
                            </div>
                        `;
                        break;
                    case 'bearer':
                        html = `
                            <div style="margin-top: 1rem;">
                                <label>Token</label>
                                <input type="text" id="bearer-token" style="width: 100%;">
                            </div>
                        `;
                        break;
                    case 'api-key':
                        html = `
                            <div style="margin-top: 1rem;">
                                <label>Key</label>
                                <input type="text" id="api-key" style="width: 100%; margin-bottom: 0.5rem;">
                                
                                <label>Value</label>
                                <input type="text" id="api-value" style="width: 100%; margin-bottom: 0.5rem;">
                                
                                <label>Add to</label>
                                <select id="api-key-location" style="width: 100%;">
                                    <option value="header">Headers</option>
                                    <option value="query">Query Params</option>
                                </select>
                            </div>
                        `;
                        break;
                }
                
                authFields.innerHTML = html;
            }
            
            async function sendRequest() {
                const method = methodSelect.value;
                const url = urlInput.value;
                
                if (!url) {
                    alert('Please enter a URL');
                    return;
                }
                
                // Collect headers
                const headers = {};
                document.querySelectorAll('#headers-table-body tr').forEach(row => {
                    const key = row.querySelector('.header-key').value;
                    const value = row.querySelector('.header-value').value;
                    if (key && value) {
                        headers[key] = value;
                    }
                });
                
                // Handle authentication
                handleAuth(headers);
                
                // Prepare request options
                const options = {
                    method,
                    headers
                };
                
                // Add body if needed
                if (['POST', 'PUT', 'PATCH'].includes(method)) {
                    const body = requestBody.value;
                    if (body) {
                        options.body = body;
                        if (!headers['Content-Type']) {
                            headers['Content-Type'] = 'application/json';
                        }
                    }
                }
                
                try {
                    // Show loading state
                    responseStatus.textContent = 'Loading...';
                    responseBody.textContent = '';
                    responseHeaders.textContent = '';
                    responseCookies.textContent = '';
                    
                    // Make the request
                    const startTime = Date.now();
                    const response = await fetch(url, options);
                    const endTime = Date.now();
                    
                    // Process response
                    const responseData = await response.json().catch(async () => {
                        return await response.text();
                    });
                    
                    // Display response
                    const statusText = `${response.status} ${response.statusText}`;
                    responseStatus.textContent = `Status: ${statusText} • Time: ${endTime - startTime}ms • Size: ${formatBytes(JSON.stringify(responseData).length)}`;
                    
                    // Format and display response body
                    if (typeof responseData === 'string') {
                        responseBody.textContent = responseData;
                    } else {
                        responseBody.innerHTML = syntaxHighlight(responseData);
                    }
                    
                    // Display headers
                    const headersArray = Array.from(response.headers.entries());
                    responseHeaders.innerHTML = headersArray.map(([key, value]) => 
                        `<div><strong>${key}:</strong> ${value}</div>`
                    ).join('');
                    
                    // Add to history
                    addToHistory(method, url, statusText);
                    
                } catch (error) {
                    responseStatus.textContent = 'Error';
                    responseBody.textContent = error.message;
                    console.error('Request failed:', error);
                }
            }
            
            function handleAuth(headers) {
                const type = authType.value;
                
                switch(type) {
                    case 'basic':
                        const username = document.getElementById('basic-username')?.value;
                        const password = document.getElementById('basic-password')?.value;
                        if (username && password) {
                            headers['Authorization'] = `Basic ${btoa(`${username}:${password}`)}`;
                        }
                        break;
                    case 'bearer':
                        const token = document.getElementById('bearer-token')?.value;
                        if (token) {
                            headers['Authorization'] = `Bearer ${token}`;
                        }
                        break;
                    case 'api-key':
                        const key = document.getElementById('api-key')?.value;
                        const value = document.getElementById('api-value')?.value;
                        const location = document.getElementById('api-key-location')?.value;
                        
                        if (key && value) {
                            if (location === 'header') {
                                headers[key] = value;
                            } else {
                                // For query params, we'd need to modify the URL
                                // This is a simplified implementation
                                const separator = urlInput.value.includes('?') ? '&' : '?';
                                urlInput.value += `${separator}${key}=${encodeURIComponent(value)}`;
                            }
                        }
                        break;
                }
            }
            
            function syntaxHighlight(json) {
                if (typeof json === 'string') {
                    try {
                        json = JSON.parse(json);
                    } catch (e) {
                        return json; // Return as plain text if not JSON
                    }
                }
                
                const jsonStr = JSON.stringify(json, null, 2);
                return jsonStr.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, 
                    function(match) {
                        let cls = 'json-number';
                        if (/^"/.test(match)) {
                            if (/:$/.test(match)) {
                                cls = 'json-key';
                            } else {
                                cls = 'json-string';
                            }
                        } else if (/true|false/.test(match)) {
                            cls = 'json-boolean';
                        } else if (/null/.test(match)) {
                            cls = 'json-null';
                        }
                        return `<span class="${cls}">${match}</span>`;
                    });
            }
            
            function formatBytes(bytes) {
                if (bytes === 0) return '0 Bytes';
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
            }
            
            function addToHistory(method, url, status) {
                const history = JSON.parse(localStorage.getItem('apiHistory') || '[]');
                
                // Check if this request is already in history
                const existingIndex = history.findIndex(item => 
                    item.method === method && item.url === url
                );
                
                if (existingIndex >= 0) {
                    history.splice(existingIndex, 1);
                }
                
                // Add to beginning of array
                history.unshift({
                    method,
                    url,
                    status,
                    timestamp: new Date().toISOString()
                });
                
                // Keep only the last 50 items
                if (history.length > 50) {
                    history.pop();
                }
                
                localStorage.setItem('apiHistory', JSON.stringify(history));
                loadHistory();
            }
            
            function loadHistory() {
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
            
            // Initialize with one header row
            addHeaderRow();
        });
