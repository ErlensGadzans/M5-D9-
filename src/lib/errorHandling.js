const notFoundHandler = (err, req, res, next) => {
  if (err.httpStatusCode === 404) {
    res
      .status(404)
      .send(
        err.message ? err.message : "We can't find what you're looking for!"
      );
  }
  next(err);
};

const unauthorizedHandler = (err, req, res, next) => {
  if (err.httpStatusCode === 401) {
    res
      .status(401)
      .send(
        err.message
          ? err.message
          : "You don't possess the required authorization codes."
      );
  }
  next(err);
};

const forbiddenHandler = (err, req, res, next) => {
  if (err.httpStatusCode === 403) {
    res
      .status(403)
      .send(err.message ? err.message : "THESE ARE THE FORBIDDEN TEXTS");
  }
  next(err);
};

const badRequestHandler = (err, req, res, next) => {
  if (err.httpStatusCode === 400) {
    res
      .status(400)
      .send(err.message ? err.message : "You've sent us a bad request");
  }
  next(err);
};

const catchAllHandler = (err, req, res, next) => {
  if (!res.headersSent) {
    res.status(500).send("We don't know whats gone wrong");
  }
};

module.exports = {
  notFoundHandler,
  unauthorizedHandler,
  forbiddenHandler,
  badRequestHandler,
  catchAllHandler,
};
