const factory = require('../services/factory.service');
const Category = require('../models/Category.model');

// @desc    Get list of categories
// @route   GET /api/v1/getCategory
// @access  Public
exports.getCategories = factory.getAll(Category);

// @desc    Get specific category by id
// @route   GET /api/v1/getCategory/:id
// @access  Public
exports.getCategory = factory.getOne(Category);

// @desc    Create category
// @route   POST  /api/v1/createCategory
// @access  Private/Admin
exports.createCategory = factory.createOne(Category);

// @desc    Update specific category
// @route   PUT /api/v1/updateCategory/:id
// @access  Private/Admin
exports.updateCategory = factory.updateOne(Category);

// @desc    Delete specific category
// @route   DELETE /api/v1//deleteCategory/:id
// @access  Private/Admin
exports.deleteCategory = factory.deleteOne(Category);
