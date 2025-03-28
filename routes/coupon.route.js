const { Router } = require("express");
const {
  createCoupon,
  deleteCoupon,
  getCoupon,
  getCoupons,
  updateCoupon,
} = require("../controller/coupon.controller");
const {
  // createCouponValidator,
  deleteCouponValidator,
  getCouponValidator,
  getCouponsValidator,
  updateCouponValidator,
} = require("../utils/validations/coupon.validation");
const { protect, allowedRoles } = require("../services/auth.service");

const router = Router();

router.use(protect);
router.use(allowedRoles("Admin", "Instructor"));

router
  .route("/")
  .post(
    // createCouponValidator,
    createCoupon)
  .get(getCouponsValidator, getCoupons);

router
  .route("/:id")
  .get(getCouponValidator, getCoupon)
  .put(updateCouponValidator, updateCoupon)
  .delete(deleteCouponValidator, deleteCoupon);

module.exports = router;