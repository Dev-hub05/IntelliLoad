/**
 * Simple request validation middleware.
 * Validates test creation requests.
 */
function validateTestCreate(req, res, next) {
  const { targetUrl, method } = req.body;

  if (!targetUrl) {
    return res.status(400).json({ error: { message: 'targetUrl is required' } });
  }

  try {
    new URL(targetUrl);
  } catch (err) {
    return res.status(400).json({ error: { message: 'targetUrl must be a valid URL' } });
  }

  const validMethods = ['GET', 'POST', 'PUT', 'DELETE'];
  if (method && !validMethods.includes(method.toUpperCase())) {
    return res.status(400).json({ error: { message: `method must be one of: ${validMethods.join(', ')}` } });
  }

  // Normalize
  if (method) {
    req.body.method = method.toUpperCase();
  }

  // Enforce max connections cap
  if (req.body.config && req.body.config.connections) {
    req.body.config.connections = Math.min(req.body.config.connections, 500);
  }

  next();
}

module.exports = { validateTestCreate };
