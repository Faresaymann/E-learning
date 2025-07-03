const mongoose = require('mongoose');
// 1- Create Schema
const categorySchema = new mongoose.Schema(
    {
      name: {
        type: String,
        required: [true, 'Category required'],
        unique: [true, 'Category must be unique'],
        minlength: [3, 'Too short category name'],
        maxlength: [32, 'Too long category name'],
      },
      // Add a reference to the Course model
      courses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
      }],
    },
    { timestamps: true }
  );

// 2- Create model
const CategoryModel = mongoose.model('Category', categorySchema);

module.exports = CategoryModel;