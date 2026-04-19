const xss = require('xss');

/**
 * Middleware to sanitize `req.body` to prevent basic XSS attacks.
 * Uses the `xss` library to filter out malicious tags.
 */
function sanitizeInput(req, res, next) {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key].trim());
      }
    }
  }
  next();
}

module.exports = sanitizeInput;
