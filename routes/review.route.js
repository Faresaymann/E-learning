const { Router } = require("express");
const {
  createReview,
  getReviews,
  deleteReview,
  updateReview,
  getReview
} = require("../controller/review.controller");

const {
  // createReviewValidator,
  deleteReviewValidator,
  getReviewValidator,
  updateReviewValidator,
} = require("../utils/validations/review.validation");

const { protect } = require("../services/auth.service");

const router = Router();
// protected
router.use(protect);
router
  .route("/")
  .post(
    // createReviewValidator ,
     createReview)
  .get(getReviews);

router
  .route("/:id")
  .get(getReviewValidator, getReview)
  .put( updateReviewValidator, updateReview)
  .delete(deleteReviewValidator, deleteReview);

module.exports = router;
