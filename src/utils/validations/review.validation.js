const { body, param } = require("express-validator");
const validatorMiddleware = require("../../middleware/validatorMiddleware");
const Review = require("../../models/review.model");
exports.createReviewValidator = [
  body("comment").optional(),
  body("rate")
    .notEmpty()
    .withMessage("ratings value required")
    .isFloat({ min: 1, max: 5 })
    .withMessage("Ratings value must be between 1 to 5"),
  body("courseID")
    .isMongoId()
    .withMessage("Invalid courses id format")
    .custom((val, { req }) =>
      // Check if logged user create review before
      Review.findOne({ user: req.user._id, course: val }).then((review) => {
        if (review) {
          return Promise.reject(
            new Error("You already created a review before")
          );
        }
      })
    ),
  (req, res, next) => {
    req.body.user = req.user._id;
    next();
  },
  validatorMiddleware,
];

exports.getReviewValidator = [
  param("id").isMongoId().withMessage("Invalid Review id format"),
  validatorMiddleware,
];

exports.updateReviewValidator = [
  param("id")
    .isMongoId()
    .withMessage("Invalid Review id format")
    .custom((val, { req }) =>
      // Check review ownership before update
      Review.findById(val).then((review) => {
        if (!review) {
          return Promise.reject(new Error(`There is no review with id ${val}`));
        }

        if (review.user._id.toString() !== req.user._id.toString()) {
          return Promise.reject(
            new Error(`Your are not allowed to perform this action`)
          );
        }
      })
    ),
  body("title").optional(),
  body("ratings")
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage("Ratings value must be between 1 to 5"),
  validatorMiddleware,
];

exports.deleteReviewValidator = [
  param("id")
    .isMongoId()
    .withMessage("Invalid Review id format")
    .custom((val, { req }) => {
      // Check review ownership before delete
      if (req.user.role === "user") {
        return Review.findById(val).then((review) => {
          if (!review) {
            return Promise.reject(
              new Error(`There is no review with id ${val}`)
            );
          }
          if (review.user._id.toString() !== req.user._id.toString()) {
            return Promise.reject(
              new Error(`Your are not allowed to perform this action`)
            );
          }
        });
      }
      return true;
    }),
  validatorMiddleware,
];

exports.getCourseReviewsValidator = [
  param("courseId").isMongoId().withMessage("Invalid Course id format"),
  validatorMiddleware,
];