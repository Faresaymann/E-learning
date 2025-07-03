const { body, param } = require("express-validator");
const validatorMiddleware = require("../../middleware/validatorMiddleware");

exports.createSectionValidator = [
  body("title").optional(),
  body("courseId").notEmpty().withMessage("course id is required"),
  validatorMiddleware,
];

exports.getSectionValidator = [
  param("id").isMongoId().withMessage("Invalid module ID"),
  validatorMiddleware,
];

exports.updateSectionValidator = [
  body("title").optional(),
  validatorMiddleware,
  /*body('sectionDuration')
        .optional()
        .isNumeric()
        .withMessage('Section duration must be a numeric value')
        .isInt({ min: 0 })
        .withMessage('Section duration must be a non-negative integer'),*/
];

exports.deleteSectionValidator = [
  param("id").isMongoId().withMessage("Invalid section ID"),
  validatorMiddleware,
];

exports.getSectionsByCourseIdValidator = [
  // Check if courseId is in query parameters
  param("courseId")
    .optional()
    .isMongoId()
    .withMessage("Invalid course ID in path parameter"),
  // Check if courseId is in query
  body("courseId")
    .optional()
    .isMongoId()
    .withMessage("Invalid course ID in body"),
  // Custom validator to check if courseId exists in either params or query
  (req, res, next) => {
    // Prioritize query parameter for the format /v1/section/course?courseId=xxx
    if (!req.params.courseId && !req.query.courseId && !req.body.courseId) {
      return res.status(400).json({
        status: "fail",
        message:
          "Course ID is required in either path parameter, query parameter, or request body",
      });
    }
    next();
  },
  validatorMiddleware,
];







