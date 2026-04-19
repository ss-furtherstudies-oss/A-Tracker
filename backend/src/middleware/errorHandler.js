function errorHandler(err, req, res, next) {
  console.error(err.stack);

  let statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || 'Internal Server Error';

  // Specific Prisma Error Codes (SQLite/PostgreSQL wrapper)
  if (err.code === 'P2002') {
    statusCode = 409;
    message = `Unique constraint failed: ${err.meta?.target?.join(', ')}`;
  } else if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Record not found to update or delete';
  }

  res.status(statusCode).json({
    message: message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
}

module.exports = errorHandler;
