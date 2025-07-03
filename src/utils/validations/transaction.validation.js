const { body, param } = require("express-validator");
const validatorMiddleware = require("../../middleware/validatorMiddleware");
const Course = require("../../models/Course.model");

exports.createTransactionValidator = [
  body("userId")
    .notEmpty()
    .withMessage("User ID is required")
    .isMongoId()
    .withMessage("Invalid User ID"),
  body("courseId")
    .notEmpty()
    .withMessage("Course ID is required")
    .isMongoId()
    .withMessage("Invalid Course ID")
    // .custom(async (courseId) => {
    //   const course = await Course.findById(courseId);
    //   if (!course) {
    //     throw new Error("Course not found");
    //   }
    // })
    ,
  body("phoneNumber")
    .notEmpty()
    .withMessage("Phone number is required")
    .isMobilePhone("ar-EG")
    .withMessage("Invalid phone number")
    .isLength({ min: 10, max: 15 })
    .withMessage("Phone number must be between 10 and 15 digits"),
  body("paymentReceipt")
    .notEmpty()
    .withMessage("Payment receipt is required")
    .isURL()
    .withMessage("Invalid payment receipt URL"),
  body("amountTransferred")
    .notEmpty()
    .withMessage("Amount transferred is required")
    .isNumeric()
    .withMessage("Invalid amount transferred")
    .isDecimal({ min: 0 })
    .withMessage("Amount transferred must be non-negative"),
];

exports.approveTransactionValidator = [
  param("id") // Use param validation for route parameters
    .notEmpty()
    .withMessage("Transaction ID is required")
    .isMongoId()
    .withMessage("Invalid Transaction ID"),
];

exports.rejectTransactionValidator = [
  param("id") // Use param validation for route parameters
    .notEmpty()
    .withMessage("Transaction ID is required")
    .isMongoId()
    .withMessage("Invalid Transaction ID"),
  body("rejectionReason") // Validate rejectionReason if provided
    .optional()
    .isLength({ min: 3 })
    .withMessage("Rejection reason must be at least 3 characters long"),
];

exports.getTransactionValidator = [
  param("id").isMongoId().withMessage("invalid mongo id"),
  validatorMiddleware,
];
