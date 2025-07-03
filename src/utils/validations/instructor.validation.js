const { check, body } = require("express-validator");
const validatorMiddleware = require("../../middleware/validatorMiddleware");


exports.getInstractorValidator = [
    check('id').isMongoId().withMessage('Invalid instracotr id format'),
    validatorMiddleware,
];

exports.becomeInstracotrValidator = [
    body("jobTitle").
        notEmpty().
        withMessage("Job Title is required").
        isLength({ min: 3 }).
        withMessage("too short title"),
    body("jobDescription").
        notEmpty().
        withMessage("Job description is required").
        isLength({ min: 5 }).
        withMessage("too short description"),
    body("facebookUrl").
        optional(),
    body("linkedinUrl").
        optional(),
    body("instagramUrl").
        optional(),
    body("profileImage").optional(),
    validatorMiddleware,
];

exports.updateInstracotrVAlidator = [
    check('id').isMongoId().withMessage('Invalid category id format'),
    validatorMiddleware,
];

exports.deleteInstracotrVAlidator = [
    check('id').isMongoId().withMessage('Invalid category id format'),
    validatorMiddleware,
];