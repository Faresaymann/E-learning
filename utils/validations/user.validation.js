const { body, param } = require("express-validator");
const User = require("../../models/user.model");
const validatorMiddleware = require("../../middleware/validatorMiddleware");

exports.createUserValidator = [
  body("name")
    .notEmpty()
    .withMessage("user name is required")
    .isLength({ min: 3 })
    .withMessage("Too short user name"),
  body("email")
    .notEmpty()
    .withMessage("user email is required")
    .isEmail()
    .withMessage("email must be valid")
    .custom((val) =>
      User.findOne({ email: val }).then((user) => {
        if (user) {
          return Promise.reject(new Error("E-mail already in user"));
        }
      })
    ),
  body("password")
    .notEmpty()
    .withMessage("user password is required")
    //.isStrongPassword({ minLength: 8, minNumbers: 1, minUppercase: 1, minSymbols: 1 })
    .withMessage("Strong password required")
  , body("passwordConfirm")
    .notEmpty()
    .withMessage("confirm password is required")
    .custom((input, { req }) => {
      return req.body.password === input;
    }),
  body("phone")
    .optional()
    .isMobilePhone(["ar-EG"])
    .withMessage("phone number must be from Egypt"),
  body("roles")
    .custom((input) => {
      return input === "Admin" || input === "Instructor" || input === "User";
    })
    .withMessage("role must be admin or instractor or user"),
  body("profileImage").optional(),
  validatorMiddleware,
];

exports.getUserValidator = [
  param("id").isMongoId().withMessage("invalid mongo id"),
  validatorMiddleware,
];

exports.updateUserValidator = [
  body("name")
    .optional()
    .isLength({ min: 3 })
    .withMessage("Too short user name"),
  body("email")
    .optional()
    .isEmail()
    .withMessage("email must be valid")
    .custom((val) =>
      User.findOne({ email: val }).then((user) => {
        if (user) {
          return Promise.reject(new Error("E-mail already in user"));
        }
      })
    ),
  body("phone")
    .optional()
    .isMobilePhone(["ar-EG"])
    .withMessage("phone number must be from Egypt"),
  body("gender")
    .optional()
    .custom((input) => {
      return ["Male", "Female"].includes(input);
    })
    .withMessage("Invalid gender"),
  body("roles")
    .optional()
    .custom((input) => {
      return input === "Instructor" || input === "User" || input === "Admin";
    })
    .withMessage("role must be admin or instractor or user"),
  body("bio")
    .optional()
    .notEmpty()
    .withMessage("Bio is required")
    .isLength({ max: 500 })
    .withMessage("Bio must be at most 500 characters"),
  validatorMiddleware,
  body("profileImg").optional(),
  validatorMiddleware,
];


exports.updateUserPasswordValidator = [
  param("id").isMongoId().withMessage("invalid mongo id"),
  body("password")
    .notEmpty()
    .withMessage("new password is required")
    .isLength({ min: 8 })
    .withMessage("Too short password"),
  body("passwordConfirm")
    .notEmpty()
    .withMessage("confirm password is required")
    .custom((input, { req }) => {
      return req.body.password === input;
    }),
  validatorMiddleware,
];

exports.deleteUserValidator = [
  param("id").isMongoId().withMessage("invalid mongo id"),
  validatorMiddleware,
];

exports.updateLoggedUserValidator = [
  body("name")
    .optional()
    .isLength({ min: 3 })
    .withMessage("Too short user name"),
  body("email")
    .optional()
    .isEmail()
    .withMessage("Email must be valid")
    .custom((val) =>
      User.findOne({ email: val }).then((user) => {
        if (user) {
          return Promise.reject(new Error("Email already in use"));
        }
      })
    ),
  body("phone")
    .optional()
    .isMobilePhone(["ar-EG"])
    .withMessage("Phone number must be from Egypt"),
  body("gender")
    .optional()
    .custom((input) => {
      return ["Male", "Female"].includes(input);
    })
    .withMessage("Invalid gender"),
  body("profileImage")
    .optional(),
  body("bio")
    .optional()
    .notEmpty()
    .withMessage("Bio is required")
    .isLength({ max: 500 })
    .withMessage("Bio must be at most 500 characters"),
  body("jobTitle").
    optional().
    notEmpty().
    withMessage("Job Title is required").
    isLength({ min: 3 }).
    withMessage("too short title"),
  body("jobDescription").
    notEmpty().
    withMessage("Job description is required").
    isLength({ min: 5 }).
    withMessage("too short description").
    optional(),
  body("facebookUrl")
    .optional()
    .custom((value) => {
      if (value && !isValidUrl(value)) {
        throw new Error('Invalid Facebook URL');
      }
      return true;
    }),
  body("linkedinUrl")
    .optional()
    .custom((value) => {
      if (value && !isValidUrl(value)) {
        throw new Error('Invalid LinkedIn URL');
      }
      return true;
    }),

  body("instagramUrl")
    .optional()
    .custom((value) => {
      if (value && !isValidUrl(value)) {
        throw new Error('Invalid Instagram URL');
      }
      return true;
    }),
  validatorMiddleware,
];
// Function to check if a given string is a valid URL
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

exports.updateLoggedUserPasswordValidator = [
  body("oldPassword")
    .notEmpty()
    .withMessage("old password is required")
    .isLength({ min: 8 })
    .withMessage("Too short password"),
  body("newPassword")
    .notEmpty()
    .withMessage("new password is required")
    .isLength({ min: 8 })
    .withMessage("Too short password"),
  body("passwordConfirm")
    .notEmpty()
    .withMessage("confirm password is required")
    .custom((input, { req }) => {
      return req.body.newPassword === input;
    }),
  validatorMiddleware,


];


const msg = {
  to: 'recipient@example.com',
  from: 'your-email@example.com',
  subject: 'Your OTP Code',
  text: 'Your OTP code is 123456',
};


