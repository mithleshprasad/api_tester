function setupUI(elements, callbacks) {
    const {
        headersTableBody, addHeaderBtn, authType, authFields,
        tabs, tabContents, responseTabs, responseContents,
        paramsTableBody, addParamBtn, clearHistoryBtn,
        addFlowNodeBtn, flowCanvas, runFlowBtn, responseStatus
    } = elements;
    
    addHeaderBtn.addEventListener('click', () => {
        addRow(headersTableBody, 'header');
        animateElement(addHeaderBtn, 'pulse');
    });
    authType.addEventListener('change', () => {
        updateAuthFields(authType, authFields);
        animateElement(authFields, 'fadeIn');
    });
    addParamBtn.addEventListener('click', () => {
        addRow(paramsTableBody, 'param');
        animateElement(addParamBtn, 'pulse');
    });
    clearHistoryBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear history?')) {
            localStorage.removeItem('apiHistory');
            callbacks.loadHistory();
            animateElement(clearHistoryBtn, 'pulse');
        }
    });
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`${tab.getAttribute('data-tab')}-tab`).classList.add('active');
            animateElement(tab, 'fadeIn');
        });
    });
    
    responseTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            responseTabs.forEach(t => t.classList.remove('active'));
            responseContents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`response-${tab.getAttribute('data-response-tab')}`).classList.add('active');
            animateElement(tab, 'fadeIn');
        });
    });
    
    // Setup modal
    setupModal(elements, callbacks);
    
    // Initialize flow builder
    setupFlowBuilder(addFlowNodeBtn, flowCanvas, runFlowBtn, callbacks, responseStatus);
}

function addRow(tableBody, type) {
    const row = document.createElement('tr');
    row.innerHTML = type === 'header' ? `
        <td><input type="text" class="header-key" placeholder="Header name"></td>
        <td><input type="text" class="header-value" placeholder="Header value"></td>
        <td><input type="text" class="header-desc" placeholder="Optional description"></td>
        <td><button class="remove-${type}">×</button></td>
    ` : `
        <td><input type="text" class="param-key" placeholder="Parameter name"></td>
        <td><input type="text" class="param-value" placeholder="Parameter value"></td>
        <td><button class="remove-${type}">×</button></td>
    `;
    
    tableBody.appendChild(row);
    animateElement(row, 'slideInUp');
    
    row.querySelector(`.remove-${type}`).addEventListener('click', () => {
        animateElement(row, 'fadeOut', () => row.remove());
    });
}

function updateAuthFields(authType, authFields) {
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
    animateElement(authFields, 'fadeIn');
}

function renderResponse(elements, response, format) {
    const { responseBody, responseHeaders, responseCookies, responseStatus, modalBody, modalHeaders, modalCookies } = elements;
    
    responseStatus.classList.remove('loading');
    
    // Render to main response section
    if (format === 'json' && typeof response.body !== 'string') {
        responseBody.innerHTML = syntaxHighlight(response.body);
    } else {
        responseBody.textContent = typeof response.body === 'string' ? 
            response.body : JSON.stringify(response.body, null, 2);
    }
    
    responseHeaders.innerHTML = response.headers.map(([key, value]) => 
        `<div><strong>${key}:</strong> ${value}</div>`
    ).join('');
    
    responseCookies.textContent = 'No cookies available';
    
    // Render to modal
    if (format === 'json' && typeof response.body !== 'string') {
        modalBody.innerHTML = syntaxHighlight(response.body);
    } else {
        modalBody.textContent = typeof response.body === 'string' ? 
            response.body : JSON.stringify(response.body, null, 2);
    }
    
    modalHeaders.innerHTML = response.headers.map(([key, value]) => 
        `<div><strong>${key}:</strong> ${value}</div>`
    ).join('');
    
    modalCookies.textContent = 'No cookies available';
    
    animateElement(responseBody, 'fadeIn');
}

function setupModal(elements, callbacks) {
    const { responseContents, modal, modalTabs, modalTabContents } = elements;
    
    responseContents.forEach(content => {
        content.addEventListener('click', () => {
            modal.style.display = 'flex';
            animateElement(modal, 'fadeIn');
            
            // Sync active tab with response section
            const activeResponseTab = document.querySelector('.response-tab.active').getAttribute('data-response-tab');
            modalTabs.forEach(t => t.classList.remove('active'));
            modalTabContents.forEach(c => c.classList.remove('active'));
            document.querySelector(`.modal-tab[data-modal-tab="${activeResponseTab}"]`).classList.add('active');
            document.getElementById(`modal-${activeResponseTab}`).classList.add('active');
        });
    });
    
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => {
        animateElement(modal, 'fadeOut', () => {
            modal.style.display = 'none';
        });
    });
    
    modalTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            modalTabs.forEach(t => t.classList.remove('active'));
            modalTabContents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`modal-${tab.getAttribute('data-modal-tab')}`).classList.add('active');
            animateElement(tab, 'fadeIn');
        });
    });
    
    // Close modal when clicking outside
    modal.addEventListener('click', e => {
        if (e.target === modal) {
            animateElement(modal, 'fadeOut', () => {
                modal.style.display = 'none';
            });
        }
    });
}

function setupFlowBuilder(addFlowNodeBtn, flowCanvas, runFlowBtn, callbacks, responseStatus) {
    const ctx = flowCanvas.getContext('2d');
    let flow = { nodes: [], connections: [] };
    let selectedNode = null;
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };
    
    function redraw() {
        ctx.clearRect(0, 0, flowCanvas.width, flowCanvas.height);
        
        // Draw connections with animated pulse
        flow.connections.forEach(conn => {
            const fromNode = flow.nodes.find(n => n.id === conn.from);
            const toNode = flow.nodes.find(n => n.id === conn.to);
            if (fromNode && toNode) {
                ctx.beginPath();
                ctx.moveTo(fromNode.x + 100, fromNode.y + 25);
                ctx.lineTo(toNode.x, toNode.y + 25);
                ctx.strokeStyle = conn.condition ? 'var(--primary)' : 'var(--secondary)';
                ctx.lineWidth = 3;
                ctx.setLineDash([8, 4]);
                ctx.stroke();
                ctx.setLineDash([]);
                
                // Draw condition label with background
                if (conn.condition) {
                    const midX = (fromNode.x + 100 + toNode.x) / 2;
                    const midY = (fromNode.y + 25 + toNode.y + 25) / 2;
                    ctx.fillStyle = 'rgba(33, 33, 33, 0.8)';
                    ctx.fillRect(midX - 40, midY - 20, 80, 20);
                    ctx.fillStyle = 'var(--light)';
                    ctx.font = '12px Roboto';
                    ctx.fillText(`Status: ${conn.condition.value}`, midX - 30, midY - 5);
                }
            }
        });
        
        // Draw nodes with hover effect
        flow.nodes.forEach(node => {
            ctx.fillStyle = node === selectedNode ? 'var(--primary)' : 'var(--dark)';
            ctx.fillRect(node.x, node.y, 200, 50);
            ctx.strokeStyle = node === selectedNode ? 'var(--light)' : 'var(--gray)';
            ctx.lineWidth = 2;
            ctx.strokeRect(node.x, node.y, 200, 50);
            
            ctx.fillStyle = node === selectedNode ? 'var(--light)' : 'var(--light)';
            ctx.font = '14px Roboto';
            ctx.fillText(`${node.data.method} ${node.data.url || 'No URL'}`, node.x + 10, node.y + 30);
        });
    }
    
    addFlowNodeBtn.addEventListener('click', () => {
        const node = {
            id: generateUUID(),
            type: 'request',
            x: 50,
            y: 50 + flow.nodes.length * 70,
            data: {
                method: 'GET',
                url: '',
                headers: {},
                body: ''
            }
        };
        flow.nodes.push(node);
        redraw();
        animateElement(flowCanvas, 'pulse');
    });
    
    flowCanvas.addEventListener('mousedown', e => {
        const rect = flowCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        selectedNode = flow.nodes.find(node => 
            x >= node.x && x <= node.x + 200 && y >= node.y && y <= node.y + 50
        );
        
        if (selectedNode) {
            isDragging = true;
            dragOffset.x = x - selectedNode.x;
            dragOffset.y = y - selectedNode.y;
            
            // Prompt for node configuration
            const method = prompt('Enter HTTP method (GET, POST, etc.):', selectedNode.data.method);
            const url = prompt('Enter URL:', selectedNode.data.url);
            if (method && url) {
                selectedNode.data.method = method.toUpperCase();
                selectedNode.data.url = url;
            }
            
            // Prompt for connection
            const connectTo = prompt('Connect to another node? (Enter node index or leave blank)');
            if (connectTo) {
                const toNode = flow.nodes[parseInt(connectTo)];
                if (toNode) {
                    const status = prompt('Enter condition status code (e.g., 200):');
                    flow.connections.push({
                        from: selectedNode.id,
                        to: toNode.id,
                        condition: status ? { type: 'status', value: status } : null
                    });
                }
            }
            
            animateElement(flowCanvas, 'pulse');
        }
        
        redraw();
    });
    
    flowCanvas.addEventListener('mousemove', e => {
        if (isDragging && selectedNode) {
            const rect = flowCanvas.getBoundingClientRect();
            selectedNode.x = e.clientX - rect.left - dragOffset.x;
            selectedNode.y = e.clientY - rect.top - dragOffset.y;
            redraw();
        }
    });
    
    flowCanvas.addEventListener('mouseup', () => {
        isDragging = false;
    });
    
    runFlowBtn.addEventListener('click', () => {
        responseStatus.classList.add('loading');
        callbacks.runFlow(flow);
        animateElement(runFlowBtn, 'pulse');
    });
}

function animateElement(element, animation, callback) {
    element.classList.add(animation);
    setTimeout(() => {
        element.classList.remove(animation);
        if (callback) callback();
    }, 400);
}