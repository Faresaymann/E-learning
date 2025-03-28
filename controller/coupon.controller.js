const Coupon = require("../models/coupon.model");
const User = require("../models/user.model");
const Course = require("../models/Course.model");
const {
  getOne,
  updateOne,
  deleteOne,
  getAll
} = require("../services/factory.service");
const asyncHandler = require("express-async-handler");
const { success } = require("../utils/response/response");
const crypto = require('crypto');
const {
  recordNotFound,
  validationError,
} = require("../utils/response/errors");

const generateCouponCode = (length = 8) => {
  return crypto.randomBytes(length)
    .toString('base64')
    .slice(0, length)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
};

exports.createCoupon = asyncHandler(async (req, res, next) => {
  try {
    const { name, expire, discount, description, maximumUses, course } = req.body;

    // Convert the expire date string to a Date object
    const expireDate = new Date(expire);
    if (isNaN(expireDate.getTime())) {
      return next(validationError({ message: 'Invalid expire date' }));
    }

    // Generate unique 
    let code = generateCouponCode();

    // Generate unique name with counter
    const defaultName = name; // Assuming name is provided from the frontend
    const count = await Coupon.countDocuments() + 1;
    const nameWithCounter = `${defaultName}_${count}`;

    if (discount == 100) {
      code += '100';
    }

    const instr = req.user._id;
    const instructor = await User.findById(instr);
    const cour = await Course.findById(course);

    if (!cour) {
      return next(recordNotFound({ message: 'Course not found' }));
    }

    if (instructor.roles === "Instructor" && !cour.instructor.equals(instr)) {
      return next(validationError({ message: 'You cannot create a coupon for a course you do not own!' }));
    }

    // Create coupon with specified data
    const coupon = await Coupon.create({
      instructor: req.user._id,
      course,
      name: nameWithCounter,
      code,
      expire: expireDate,
      discount,
      description,
      maximumUses,
    });

    const { statusCode, body } = success({
      message: 'Coupon created successfully',
      data: coupon,
    });
    res.status(statusCode).json(body);
  } catch (err) {
    console.error(err);
    next(err);
  }
});


exports.getCoupons = getAll(Coupon, "name");

exports.getCoupon = getOne(Coupon);



exports.updateCoupon = updateOne(Coupon);

exports.deleteCoupon = deleteOne(Coupon);
