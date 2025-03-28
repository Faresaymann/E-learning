const express = require('express');

const {
  // applyCoupon,
  clearCart,
  removeSpecificCartItem,
  getLoggedUserCart,
  addCourseToCart,
} = require('../controller/Cart.controller');
const { protect, allowedRoles } = require("../services/auth.service");

const router = express.Router();

router.use(protect, allowedRoles('User', 'Instructor'));
router
  .route('/')
  .post(addCourseToCart)
  .get(getLoggedUserCart)
  .delete(clearCart);

//router.put('/applyCoupon', /*applyCoupon*/);

router
  .route('/:itemId')
  .delete(removeSpecificCartItem);

module.exports = router;
