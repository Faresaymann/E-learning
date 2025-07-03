const responseCode = require("./responseCode");
const responseStatus = require("./responseStatus");

module.exports = {
  failure: (data = {}) => ({
    statusCode: responseCode.success,
    body: {
      status: responseStatus.failure,
      message: data.message || "Some error occurred while performing action.",
      data: data.data && Object.keys(data.data).length ? data.data : null,
    },
  }),

  badRequest: (data = {}) => (
    console.log(data),
    {
      statusCode: responseCode.badRequest,
      body: {
        status: responseStatus.badRequest,
        message: data.message || "Request parameters are invalid or missing.",
        data: data.data && Object.keys(data.data).length ? data.data : null,
      },
    }
  ),

  recordNotFound: (data = {}) => ({
    statusCode: responseCode.success,
    body: {
      status: responseStatus.recordNotFound,
      message: data.message || "Record(s) not found with specified criteria.",
      data: data.data && Object.keys(data.data).length ? data.data : null,
    },
  }),

  validationError: (data = {}) => ({
    statusCode: responseCode.validationError,
    body: {
      status: responseStatus.validationError,
      message:
        data.data && Array.isArray(data.data) && data.data.length > 0
          ? data.data[0].message || data.data[0].msg
          : data.message || "Invalid Data, Validation Failed.",
      data: data.data && Object.keys(data.data).length ? data.data : null,
    },
  }),

  unAuthorized: (data = {}) => ({
    statusCode: responseCode.unAuthorized,
    body: {
      status: responseStatus.unAuthorized,
      message: data.message || "You are not authorized to access the request",
      data: data.data && Object.keys(data.data).length ? data.data : null,
    },
  }),

  routeNotFound: (data = {}) => ({
    statusCode: responseCode.notFound,
    body: {
      status: responseStatus.notFound,
      message: data.message || "Can't find this route",
      data: data.data && Object.keys(data.data).length ? data.data : null,
    },
  }),
};
