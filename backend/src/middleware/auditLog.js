const prisma = require('../utils/db');

/**
 * Middleware to intercept PATCH and DELETE methods and record them to the AuditLog table.
 * It strictly enforces the requirement to maintain an Audit Trail.
 */
function auditLogger(entityNameParam) {
  return async (req, res, next) => {
    // Intercept finish response to log after successful DB operation
    const originalSend = res.send;
    
    res.send = function (body) {
      if ((req.method === 'PATCH' || req.method === 'DELETE' || req.method === 'PUT') && res.statusCode >= 200 && res.statusCode < 300) {
        
        // Define entity Name and ID
        const entityName = entityNameParam || 'Unknown';
        const entityId = req.params.id || 'bulk';
        
        prisma.auditLog.create({
          data: {
            entityName: entityName,
            entityId: entityId,
            action: req.method,
            userId: req.user ? req.user.id : 'anonymous', // Role/User to be completed later
            changes: req.method === 'DELETE' ? { __deleted: true } : req.body
          }
        }).catch(err => {
          console.error("Audit Log Error: ", err);
        });
      }
      originalSend.call(this, body);
    };

    next();
  };
}

module.exports = auditLogger;
