// review.controller.js
const Review = require("../models/review.model");
const factory = require("../services/factory.service");
const {
    recordNotFound,
} = require("../utils/response/errors");
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
    console.log("rate, comment, courseID: ", rate + "," + comment + "," + courseID);
    console.log("courseID ", courseID)
    const course = await Course.findById(courseID);
    if (!course) {
        return next(recordNotFound({ message: 'Course not found' }));
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
            course: courseID
        });

        await Course.findByIdAndUpdate(courseID, {
            $push: { ratings: review._id }
        });
    }

    // Calculate the average rating
    const allReviews = await Review.find({ course: courseID });
    const ratingsSum = allReviews.reduce((sum, review) => sum + review.rate, 0);
    const ratingsQuantity = allReviews.length;
    const ratingsAverage = ratingsQuantity > 0 ? Math.round(ratingsSum / ratingsQuantity) : 0;

    course.ratingsAverage = ratingsAverage;
    course.ratingsQuantity = ratingsQuantity;
    await course.save();
    // await Review.calcAverageRatingsAndQuantity()

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
        return next(recordNotFound({ message: 'Review not found' }));
    }

    const updatedReviewData = {}
    if (comment !== review.comment) {
        updatedReviewData.comment = comment;
    }
    if (rate !== review.rate) {
        updatedReviewData.rate = rate;
    }

    const updatedReview = await Review.findByIdAndUpdate(id, updatedReviewData, { new: true });

    // Calculate the average rating
    const allReviews = await Review.find({ course: review.course });
    const ratingsSum = allReviews.reduce((sum, review) => sum + review.rate, 0);
    const ratingsQuantity = allReviews.length;
    const ratingsAverage = ratingsQuantity > 0 ? Math.round(ratingsSum / ratingsQuantity) : 0;

    await Course.findByIdAndUpdate(review.course, {
        ratingsAverage,
        ratingsQuantity
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
        return next(recordNotFound({ message: 'Review not found' }));
    }

    const courseId = review.course;

    await Course.findByIdAndUpdate(courseId, {
        $pull: { ratings: review._id }
    });

    await review.deleteOne();

    // Calculate the average rating
    const allReviews = await Review.find({ course: courseId });
    const ratingsSum = allReviews.reduce((sum, review) => sum + review.rate, 0);
    const ratingsQuantity = allReviews.length;
    const ratingsAverage = ratingsQuantity > 0 ? ratingsSum / ratingsQuantity : 0;

    await Course.findByIdAndUpdate(courseId, {
        ratingsAverage,
        ratingsQuantity
    });

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
exports.getReview = factory.getOne(Review);