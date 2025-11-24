const successResponse = (res, data, statusCode = 200, message = null) => {
  const response = {
    status: 'success',
    data
  };

  if (message) {
    response.message = message;
  }

  return res.status(statusCode).json(response);
};

const createdResponse = (res, data, message = 'Resource created successfully') => {
  return successResponse(res, data, 201, message);
};

const noContentResponse = (res) => {
  return res.status(204).send();
};

module.exports = {
  successResponse,
  createdResponse,
  noContentResponse
};
