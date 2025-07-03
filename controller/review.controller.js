// review.controller.js
const mongoose = require("mongoose");
const Review = require("../models/review.model");
const factory = require("../services/factory.service");
const { recordNotFound } = require("../utils/response/errors");
const asyncHandler = require("express-async-handler");
const Course = require("../models/Course.model");
const { success } = require("../utils/response/response");

/**
 * @description create new Review
 * @route POST /api/v1/review
 * @access protected
 */
exports.createReview = asyncHandler(async (req, res, next) => {
  const { rate, comment, courseID } = req.body;
  const { _id: userId } = req.user;

  const course = await Course.findById(courseID);
  if (!course) {
    return next(recordNotFound({ message: "Course not found" }));
  }

  // Check if review exists
  let review = await Review.findOne({ user: userId, course: courseID });
  if (review) {
    // Update existing review
    review.comment = comment || review.comment;
    review.rate = rate || review.rate;
    await review.save();
  } else {
    //create new review
    review = await Review.create({
      comment,
      rate,
      user: userId,
      course: courseID,
    });

    await Course.findByIdAndUpdate(courseID, {
      $push: { ratings: review._id },
    });
  }

  // Use the static method to calculate average ratings
  console.log(`Triggering ratings calculation for course: ${courseID}`);
  await Review.calcAverageRatingsAndQuantity(courseID);

  // Populate user information for the response
  await review.populate({
    path: "user",
    select: "name profileImage",
  });

  const { statusCode, body } = success({ data: review });
  res.status(statusCode).json(body);
});

/**
 * @description update Review by id
 * @route PUT /api/v1/review/:id
 * @access protected owner
 */
exports.updateReview = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { rate, comment } = req.body;

  const review = await Review.findById(id);
  if (!review) {
    return next(recordNotFound({ message: "Review not found" }));
  }

  const updatedReviewData = {};
  if (comment !== undefined && comment !== review.comment) {
    updatedReviewData.comment = comment;
  }
  if (rate !== undefined && rate !== review.rate) {
    updatedReviewData.rate = rate;
  }

  const updatedReview = await Review.findByIdAndUpdate(id, updatedReviewData, {
    new: true,
  });

  // Use the static method to calculate average ratings
  console.log(`Triggering ratings calculation for course: ${review.course}`);
  await Review.calcAverageRatingsAndQuantity(review.course);

  // Populate user information for the response
  await updatedReview.populate({
    path: "user",
    select: "name profileImage",
  });

  const { statusCode, body } = success({ data: updatedReview });
  res.status(statusCode).json(body);
});

/**
 * @description delete Review by id
 * @route DELETE /api/v1/review/:id
 * @access protected [owner | admin]
 */
exports.deleteReview = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const review = await Review.findById(id);
  if (!review) {
    return next(recordNotFound({ message: "Review not found" }));
  }

  const courseId = review.course;

  await Course.findByIdAndUpdate(courseId, {
    $pull: { ratings: review._id },
  });

  // Use deleteOne which will trigger the deleteOne middleware
  await review.deleteOne();

  // The calcAverageRatingsAndQuantity will be called by the middleware
  // but we'll call it explicitly as a fallback to ensure it runs
  console.log(`Triggering ratings calculation for course: ${courseId}`);
  await Review.calcAverageRatingsAndQuantity(courseId);

  const { statusCode, body } = success({ data: null });
  res.status(statusCode).json(body);
});

/**
 * @description get all reviews
 * @route GET /api/v1/review
 * @access public
 */
exports.getReviews = factory.getAll(Review);

/**
 * @description get Review by id
 * @route GET /api/v1/review/:id
 * @access public
 */
exports.getReview = factory.getOne(Review, {
  path: "user",
  select: "name profileImage",
});

/**
 * @description get Reviews by course id
 * @route GET /api/v1/review/course/:courseId
 * @access public
 */
exports.getReviewsByCourse = asyncHandler(async (req, res, next) => {
  const { courseId } = req.params;

  // Validate courseId is a valid MongoDB ObjectId
  if (!mongoose.isValidObjectId(courseId)) {
    return next(recordNotFound({ message: "Invalid course ID format" }));
  }

  // Check if course exists
  const course = await Course.findById(courseId);
  if (!course) {
    return next(recordNotFound({ message: "Course not found" }));
  }

  // Find all reviews for this course
  const reviews = await Review.find({ course: courseId }).populate({
    path: "user",
    select: "name profileImage",
  });

  // Wrap the reviews data in a result object as requested
  const { statusCode, body } = success({ data: { result: reviews } });
  res.status(statusCode).json(body);
});
