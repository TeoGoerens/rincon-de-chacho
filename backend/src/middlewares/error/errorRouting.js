const routingErrorHandler = (req, res, next) => {
  console.log("Middleware Routing Error Handling");

  const error = new Error(
    `The following endpoint was not found: ${req.method} ${req.originalUrl}`
  );
  error.status = 404;
  next(error);
};

export default routingErrorHandler;
