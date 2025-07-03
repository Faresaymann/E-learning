const { Router } = require("express");
const {
  createReview,
  getReviews,
  deleteReview,
  updateReview,
  getReview,
  getReviewsByCourse,
} = require("../controller/review.controller");

const {
  createReviewValidator,
  deleteReviewValidator,
  getReviewValidator,
  updateReviewValidator,
  getCourseReviewsValidator,
} = require("../utils/validations/review.validation");

const { protect } = require("../services/auth.service");

const router = Router();
// protected
router.use(protect);
router.route("/").post(createReviewValidator, createReview).get(getReviews);

// Get reviews by course ID - this route must be before the /:id route to avoid conflicts
router
  .route("/course/:courseId")
  .get(getCourseReviewsValidator, getReviewsByCourse);

router
  .route("/:id")
  .get(getReviewValidator, getReview)
  .put(updateReviewValidator, updateReview)
  .delete(deleteReviewValidator, deleteReview);

module.exports = router;
