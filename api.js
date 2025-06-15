async function sendRequest(config) {
    const { method, url, headers, body, onStatusUpdate } = config;
    
    if (!url) {
        throw new Error('Please enter a URL');
    }
    
    const options = {
        method,
        headers
    };
    
    if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
        options.body = body;
        if (!headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }
    }
    
    try {
        onStatusUpdate('Loading...');
        const startTime = Date.now();
        const response = await fetch(url, options);
        const endTime = Date.now();
        
        const responseData = await response.json().catch(async () => {
            return await response.text();
        });
        
        const statusText = `${response.status} ${response.statusText}`;
        onStatusUpdate(`Status: ${statusText} • Time: ${endTime - startTime}ms • Size: ${formatBytes(JSON.stringify(responseData).length)}`);
        
        return {
            status: statusText,
            body: responseData,
            headers: Array.from(response.headers.entries()),
            time: endTime - startTime
        };
    } catch (error) {
        onStatusUpdate('Error');
        throw error;
    }
}

function handleAuth(headers, authConfig) {
    const { type, credentials } = authConfig;
    
    switch(type) {
        case 'basic':
            if (credentials.username && credentials.password) {
                headers['Authorization'] = `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`;
            }
            break;
        case 'bearer':
            if (credentials.token) {
                headers['Authorization'] = `Bearer ${credentials.token}`;
            }
            break;
        case 'api-key':
            if (credentials.key && credentials.value) {
                if (credentials.location === 'header') {
                    headers[credentials.key] = credentials.value;
                } else {
                    return { key: credentials.key, value: credentials.value };
                }
            }
            break;
    }
    return null;
}

async function executeFlow(flow, config) {
    const results = [];
    for (const node of flow.nodes) {
        if (node.type === 'request') {
            try {
                const response = await sendRequest({
                    ...node.data,
                    headers: node.data.headers || {},
                    onStatusUpdate: config.onStatusUpdate
                });
                results.push({ nodeId: node.id, response });
                
                // Check conditions for connected nodes
                const connections = flow.connections.filter(c => c.from === node.id);
                for (const conn of connections) {
                    if (conn.condition) {
                        if (evaluateCondition(conn.condition, response)) {
                            const nextNode = flow.nodes.find(n => n.id === conn.to);
                            if (nextNode) {
                                // Recursive call for next node
                                const subResults = await executeFlow({
                                    nodes: [nextNode],
                                    connections: flow.connections
                                }, config);
                                results.push(...subResults);
                            }
                        }
                    }
                }
            } catch (error) {
                results.push({ nodeId: node.id, error: error.message });
            }
        }
    }
    return results;
}

function evaluateCondition(condition, response) {
    // Simple condition evaluation (e.g., status code check)
    if (condition.type === 'status') {
        return response.status.split(' ')[0] === condition.value;
    }
    return true;
}