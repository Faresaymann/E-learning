const { body } = require("express-validator");
const User = require("../../models/user.model");
const validatorMiddleware = require("../../middleware/validatorMiddleware");

exports.registerValidator = [
  body("name")
    .notEmpty()
    .withMessage("user name is required")
    .isLength({ min: 3 })
    .withMessage("Too short user name"),
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .bail() // Stops further validation if this fails
    .isEmail()
    .withMessage("Email must be valid")
    .bail() // Stops further validation if this fails
    .custom(async (val) => {
      const user = await User.findOne({ email: val });
      if (user) {
        return Promise.reject(new Error("E-mail is already in use"));
      }
    }),

  //body("roles").notEmpty().withMessage("roles is required"),

  // body("phone")
  //   .notEmpty()
  //   .withMessage("Phone number is required")
  //   .isMobilePhone("ar-EG")
  //   .withMessage("Invalid Egyptian phone number"),
  body("password")
    .notEmpty()
    .withMessage("user password is required")
    .bail()
    .isStrongPassword({
      minLength: 8,
      minNumbers: 1,
      minUppercase: 1,
      minSymbols: 1,
    })
    .withMessage(
    "Password must be at least 8 characters long, include at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character."
),
  // body("passwordConfirm")
  //   .notEmpty()
  //   .withMessage("confirm password is required")
  //   .custom((input, { req }) => {
  //     return req.body.password === input;
  //   }),
  validatorMiddleware,
];

exports.loginValidator = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be valid"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Too Short Password"),
  validatorMiddleware,
];

exports.forgetPasswordValidator = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be valid"),
  validatorMiddleware,
];

exports.confirmResetValidator = [
  body("resetCode")
    .notEmpty()
    .withMessage("reset code is required")
    .isLength({ max: 6, min: 6 })
    .withMessage("reset code must be 6 numbers"),
  validatorMiddleware,
];

exports.resetPasswordValidator = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be valid"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Too Short Password"),
  body("passwordConfirm")
    .notEmpty()
    .withMessage("confirm password is required")
    .custom((input, { req }) => {
      return req.body.password === input;
    }),
  validatorMiddleware,
];
