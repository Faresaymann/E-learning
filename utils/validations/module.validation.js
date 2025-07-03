const { body, param } = require("express-validator");
const validatorMiddleware = require("../../middleware/validatorMiddleware");
const Category = require("../../models/Category.model");
const Section = require("../../models/section.model");

// //we wont be using it, but check it anyway
// exports.createModuleValidator = [
//   body("file")
//     .notEmpty()
//     .withMessage("file is required"),
//   body("sectionId")
//     .notEmpty()
//     .withMessage("sectionId is required")
//     .custom(async (categoryId) => {
//       if (categoryId) {
//         const category = await Category.findById(categoryId);
//         if (!category) {
//           throw new Error("Category not found");
//         }
//       }
//     }),
//   validatorMiddleware,
// ];

exports.getModuleValidator = [
  param("id").isMongoId().withMessage("Invalid module ID"),
  validatorMiddleware,
];

exports.updateModuleValidator = [
  body("name").optional().notEmpty().withMessage("Module name is required"),
  body("isFree").optional().notEmpty().withMessage("Module price is required"),
  body("videos").optional(),
  validatorMiddleware,
];

exports.deleteModuleValidator = [
  param("id").isMongoId().withMessage("Invalid module ID"),
  validatorMiddleware,
];

exports.getModulesBySectionIdValidator = [
  param("sectionId").isMongoId().withMessage("Invalid section ID"),
  validatorMiddleware,
];
