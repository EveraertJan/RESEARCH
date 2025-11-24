const { AppError } = require('./errorHandler');

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
      return next(new AppError(errorMessage, 400));
    }

    req.validatedBody = value;
    next();
  };
};

const checkRequiredFields = (fields) => {
  return (req, res, next) => {
    const missingFields = fields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return next(
        new AppError(`Missing required fields: ${missingFields.join(', ')}`, 400)
      );
    }

    next();
  };
};

module.exports = {
  validate,
  checkRequiredFields
};
