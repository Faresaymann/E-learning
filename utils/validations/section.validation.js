const { body, param } = require("express-validator");
const validatorMiddleware = require("../../middleware/validatorMiddleware");

exports.createSectionValidator = [
    body("title")
        .optional(),
    body("courseId")
        .notEmpty()
        .withMessage('course id is required'),
    validatorMiddleware
];

exports.getSectionValidator = [
    param("id").isMongoId().withMessage('Invalid module ID'),
    validatorMiddleware,
];

exports.updateSectionValidator = [
    body('title')
        .optional(),
    validatorMiddleware,
    /*body('sectionDuration')
        .optional()
        .isNumeric()
        .withMessage('Section duration must be a numeric value')
        .isInt({ min: 0 })
        .withMessage('Section duration must be a non-negative integer'),*/

];

exports.deleteSectionValidator = [
    param('id')
        .isMongoId()
        .withMessage('Invalid section ID'),
    validatorMiddleware,
];







