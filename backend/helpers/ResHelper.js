const success = (res, payload, status = 200) => {
  res.status(status).json({
    status: "success",
    data: payload,
  });
};

const fail = (res, message, status = 400) => {
  res.status(status).json({
    status: "fail",
    message,
  });
};

const error = (res, err, status = 500) => {
  res.status(status).json({
    status: "error",
    message: err.message,
  });
};

module.exports = { success, fail, error };
