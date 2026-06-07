/**
 * Server-Sent Events (SSE) Manager
 * Manages active browser client connections listening to live test run streams.
 */

class SSEManager {
  constructor() {
    // Maps testRunId -> Set of express Response objects
    this.clients = new Map();
  }

  /**
   * Registers a client connection to a test run metrics stream.
   * @param {string} testRunId - The unique test run ID
   * @param {Object} res - Express Response object
   */
  registerClient(testRunId, res) {
    if (!this.clients.has(testRunId)) {
      this.clients.set(testRunId, new Set());
    }
    
    const clientSet = this.clients.get(testRunId);
    clientSet.add(res);

    console.log(`SSE client connected to stream: ${testRunId}. Total active: ${clientSet.size}`);

    // Clean up when client disconnects
    res.on('close', () => {
      clientSet.delete(res);
      console.log(`SSE client disconnected from stream: ${testRunId}. Remaining active: ${clientSet.size}`);
      if (clientSet.size === 0) {
        this.clients.delete(testRunId);
      }
    });
  }

  /**
   * Broadcasts a JSON message to all registered clients for a test run.
   * @param {string} testRunId - Unique test run ID
   * @param {string} event - Event name (e.g. 'metrics', 'completed', 'status')
   * @param {Object} data - Payload data
   */
  broadcast(testRunId, event, data) {
    const clientSet = this.clients.get(testRunId);
    if (!clientSet || clientSet.size === 0) {
      return;
    }

    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

    clientSet.forEach(res => {
      try {
        res.write(payload);
      } catch (err) {
        console.error(`Error writing to SSE stream ${testRunId}:`, err.message);
      }
    });
  }

  /**
   * Get active connection counts for a given test run.
   */
  getActiveClientCount(testRunId) {
    const clientSet = this.clients.get(testRunId);
    return clientSet ? clientSet.size : 0;
  }
}

// Export single shared instance
module.exports = new SSEManager();
