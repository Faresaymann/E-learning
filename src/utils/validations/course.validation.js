const { body, param } = require("express-validator");
const Category = require("../../models/Category.model");
const validatorMiddleware = require("../../middleware/validatorMiddleware");

const createCourseValidator = [

  body("title")
    .notEmpty()
    .withMessage("Course title is required")
    .isLength({ min: 3 })
    .withMessage("Too short course title")
    .optional(),
  body("subTitle")
    .notEmpty()
    .withMessage("Course subtitle is required")
    .optional(),
  body("requirements")
    .notEmpty()
    .withMessage("Requirements are required")
    .optional(),
  body("targetAudience")
    .notEmpty()
    .withMessage("Target audience is required")
    .optional(),
  body("whatWillBeTaught")
    .notEmpty()
    .withMessage("What will be taught is required")
    .optional(),
  body("courseDescription")
    .notEmpty()
    .withMessage("Course description is required")
    .optional(),
  body("videoTrailer")
    .optional()
    .notEmpty()
    .withMessage("Video trailer is required")
    .isURL()
    .withMessage("Invalid video trailer URL")
    .optional(),
  body("thumbnail")
    .optional()
    .notEmpty()
    .notEmpty().
    withMessage("Thumbnail URL is required")
    .isURL()
    .withMessage("Invalid thumbnail URL")
    .optional(),
  body("language")
    .notEmpty()
    .withMessage("Language is required")
    .optional(),
  body("category")
    .notEmpty()
    .withMessage("Category is required")
    .isMongoId()
    .withMessage("Invalid category ID")
    .custom(async (categoryId) => {
      const category = await Category.findById(categoryId);
      if (!category) {
        throw new Error("Category not found");
      }
    }).optional(),
  body("instructor")
    .notEmpty()
    .withMessage("Instructor is required")
    .isMongoId()
    .withMessage("Invalid instructor ID")
    .optional(),
  body("level")
    .optional(),
  body("durationHours")
    .isInt({ min: 0 })
    .withMessage("Invalid course duration")
    .optional(),
  body("section")
    .optional(),
  validatorMiddleware,
];

const getCourseValidator = [
  param("id").isMongoId().withMessage("Invalid course ID"),
  validatorMiddleware,
];

const updateCourseValidator = [
  body("title")
    .optional()
    .isLength({ min: 3 })
    .withMessage("Too short course title"),
  body("subTitle")
    .optional(),
  body("category")
    .optional()
    .isMongoId()
    .withMessage("Invalid category ID")
    .custom(async (categoryId) => {
      if (categoryId) {
        const category = await Category.findById(categoryId);
        if (!category) {
          throw new Error("Category not found");
        }
      }
    }),
  body("language")
    .optional(),
  body("level")
    .optional(),
  body("durationHours")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Invalid course duration"),
  body("thumbnail")
    .optional()
    .isURL()
    .withMessage("Invalid thumbnail URL"),
  body("videoTrailer")
    .optional()
    .isURL()
    .withMessage("Invalid video trailer URL"),
  body("courseDescription")
    .optional(),
  body("whatWillBeTaught")
    .optional(),
  body("targetAudience")
    .optional(),
  body("requirements")
    .isArray({ min: 1 })
    .withMessage("At least one requirement is required")
    .optional(),
  body("section")
    .optional(),
  validatorMiddleware,
];

const deleteCourseValidator = [
  param("id").isMongoId().withMessage("Invalid course ID"),
  validatorMiddleware,
];

module.exports = {
  createCourseValidator,
  getCourseValidator,
  updateCourseValidator,
  deleteCourseValidator
};