const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    Instructor: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    course: {
      type: mongoose.Types.ObjectId,
      ref: "Course",
      required: [true, 'Course required'],
    },
    name: {
      type: String,
      trim: true, // Removes leading and trailing whitespace
      unique: true, // Ensure the name is unique if provided
    },
    code: {
      type: String,
      unique: true, // Ensure the code is unique
      uppercase: true, // Converts the code to uppercase
      trim: true, // Removes leading and trailing whitespace
    },
    expire: {
      type: Date,
      required: [true, 'Coupon expire time required'],
    },
    discount: {
      type: Number,
      required: [true, 'Coupon discount value required'],
    },
    description: {
      type: String,
      trim: true, // Removes leading and trailing whitespace
    },
    uses: {
      type: Number,
      default: 0,
    },
    maximumUses: {
      type: Number,
      default: null, // Allow unlimited uses by default
    },
    usersUsedBy: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
    }, // Array of user IDs who have used the coupon
  },
  { timestamps: true }
);

module.exports = mongoose.model('Coupon', couponSchema);
