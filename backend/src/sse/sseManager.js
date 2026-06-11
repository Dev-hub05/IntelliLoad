class SSEManager {
  constructor() {
    this.clients = new Map(); // testId -> Set of client response objects
  }

  /**
   * Register a new client for a test stream
   * @param {string} testId 
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  register(testId, req, res) {
    // Set headers for SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    // Send initial ping/keep-alive comment
    res.write(': ping\n\n');

    if (!this.clients.has(testId)) {
      this.clients.set(testId, new Set());
    }
    
    this.clients.get(testId).add(res);

    // Remove client on connection close
    req.on('close', () => {
      const testClients = this.clients.get(testId);
      if (testClients) {
        testClients.delete(res);
        if (testClients.size === 0) {
          this.clients.delete(testId);
        }
      }
    });
  }

  /**
   * Broadcast a metric snapshot to all connected clients for a test
   * @param {string} testId 
   * @param {Object} data - Metrics snapshot to broadcast
   */
  broadcast(testId, data) {
    const testClients = this.clients.get(testId);
    if (!testClients || testClients.size === 0) return;

    const payload = `data: ${JSON.stringify(data)}\n\n`;
    
    for (const client of testClients) {
      try {
        client.write(payload);
      } catch (err) {
        console.error(`Error sending SSE payload to client for test ${testId}:`, err.message);
      }
    }
  }

  /**
   * Close all active client connections for a test
   * @param {string} testId 
   */
  closeConnections(testId) {
    const testClients = this.clients.get(testId);
    if (!testClients) return;

    for (const client of testClients) {
      try {
        client.end();
      } catch (err) {}
    }
    
    this.clients.delete(testId);
  }
}

module.exports = new SSEManager();
