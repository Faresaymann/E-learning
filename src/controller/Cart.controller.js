const asyncHandler = require("express-async-handler");
const { failure, recordNotFound } = require("../utils/response/errors");
const { success } = require("../utils/response/response");
const Course = require("../models/Course.model");
// const Coupon = require("../models/coupon.model");
const Cart = require("../models/Cart.model");

/**
 * @description Calculate total price from cart items
 * @param {Object} cart - The cart document
 * @returns {Number} totalPrice
 */
const calcTotalCartPrice = (cart) => {
  let totalPrice = 0;
  cart.cartItems.forEach((item) => {
    // Expecting price to be an object: { currency: 'USD', amount: 49.99 }
    if (item.price && item.price.amount != null) {
      const numericAmount = parseFloat(item.price.amount);
      if (!isNaN(numericAmount)) {
        totalPrice += numericAmount;
      } else {
        console.error("Invalid numeric amount in cart item:", item.price);
      }
    } else {
      console.error("No valid price object found for cart item:", item);
    }
  });
  return totalPrice;
};

/**
 * @description Add course to cart
 * @route POST /api/v1/cart
 * @access private [User, Admin]
 */
const addCourseToCart = asyncHandler(async (req, res) => {
  const courseId = req.body.courseId && req.body.courseId.trim();

  console.log("Request body:", req.body);
  // 1) Find the course
  const course = await Course.findById(courseId);
  if (!course) {
    const { body, statusCode } = failure({ message: "Course not found" });
    return res.status(statusCode).json(body);
  }

  // 2) Find (or create) the user's cart
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    // Create a new cart with the entire price object
    cart = await Cart.create({
      user: req.user._id,
      cartItems: [
        {
          course: courseId,
          price: course.price, // e.g. { currency: "USD", amount: "49.99" }
        },
      ],
    });
  } else {
    // Check if the course is already in the cart
    const existingCartItemIndex = cart.cartItems.findIndex((item) =>
      item.course.equals(courseId)
    );
    if (existingCartItemIndex !== -1) {
      // Already in the cart
      const { body, statusCode } = failure({
        message: "Course already in the cart",
      });
      return res.status(statusCode).json(body);
    }

    // Not in cart, so add it
    cart.cartItems.push({
      course: courseId,
      price: course.price, // store the entire price object
    });
  }

  // 3) Calculate total cart price and update the cart document
  cart.totalCartPrice = calcTotalCartPrice(cart);

  // 4) Save the cart
  await cart.save();

  // 5) Populate course details before sending response
  await cart.populate({
    path: "cartItems.course",
    select: "title thumbnail subTitle level duration price ratingsAverage",
  });

  // 6) Send the response
  const { body, statusCode } = success({
    message: "Course added successfully",
    totalCartPrice: cart.totalCartPrice,
    data: {
      cart,
      numOfCartItems: cart.cartItems.length,
    },
  });
  res.status(statusCode).json(body);
});

/**
 * @desc    Get logged user cart
 * @route   GET /api/v1/cart
 * @access  Private/User
 */
const getLoggedUserCart = asyncHandler(async (req, res, next) => {
  // Find cart and populate course details
  const cart = await Cart.findOne({ user: req.user._id }).populate({
    path: "cartItems.course",
    select: "title thumbnail subTitle level price ratingsAverage",
  });

  if (!cart) {
    return next(
      recordNotFound({
        message: `There is no cart for this user id : ${req.user._id}`,
      })
    );
  }

  // Calculate total cart price
  cart.totalCartPrice = calcTotalCartPrice(cart);
  await cart.save();

  const { statusCode, body } = success({
    numOfCartItems: cart.cartItems.length,
    totalCartPrice: cart.totalCartPrice,
    data: {
      cart,
      numOfCartItems: cart.cartItems.length,
    },
  });

  // Then send the standard Express response:
  res.status(statusCode).json(body);
});

/**
 * @desc    Remove specific cart item
 * @route   DELETE /api/v1/cart/:itemId
 * @access  Private/User
 */
const removeSpecificCartItem = asyncHandler(async (req, res) => {
  console.log("Removing cart item with _id:", req.params.itemId);
  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id },
    {
      $pull: { cartItems: { _id: req.params.itemId } },
    },
    { new: true }
  ).populate({
    path: "cartItems.course",
    select: "title thumbnail subTitle level duration price ratingsAverage",
  });

  cart.totalCartPrice = calcTotalCartPrice(cart);
  await cart.save();

  const { statusCode, body } = success({
    message: "course removed successfully",
    numOfCartItems: cart.cartItems.length,
    totalCartPrice: cart.totalCartPrice,
    data: cart,
  });
  res.status(statusCode).json(body);
});

// // @desc    Apply coupon on logged user cart
// // @route   PUT /api/v1/cart/applyCoupon
// // @access  Private/User
// const applyCoupon = asyncHandler(async (req, res, next) => {
//   try {
//     // 1) Get coupon based on coupon name
//     const coupon = await Coupon.findOne({
//       name: req.body.coupon,
//       expire: { $gt: Date.now() },
//     });

//     if (!coupon) {
//       return next(new recordNotFound(`Coupon is invalid or expired`));
//     }

//     // 2) Get logged user cart to get total cart price
//     const cart = await Cart.findOne({ user: req.user._id }).populate(
//       "cartItems.course"
//     );

//     // 3) Check if the coupon applies to all courses or a specific course
//     let totalPrice = 0;
//     if (coupon.appliesToAll) {
//       // If coupon applies to all courses, calculate the total price of all courses in the cart
//       totalPrice = cart.cartItems.reduce(
//         (acc, item) => acc + item.course.price * item.quantity,
//         0
//       );
//     } else {
//       // If coupon applies to a specific course, find the course in the cart and calculate its price
//       const courseItem = cart.cartItems.find(
//         (item) => item.course._id.toString() === req.body.courseId
//       );
//       if (!courseItem) {
//         return next(new recordNotFound(`Course not found in the cart`));
//       }
//       totalPrice = courseItem.course.price;
//     }

//     // 4) Calculate price after discount
//     const totalPriceAfterDiscount = (
//       totalPrice -
//       (totalPrice * coupon.discount) / 100
//     ).toFixed(2);

//     cart.totalPriceAfterDiscount = totalPriceAfterDiscount;
//     await cart.save();

//     res.status(200).json({
//       status: "success",
//       numOfCartItems: cart.cartItems.length,
//       data: cart,
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// @desc    claer logged user cart
// @route   Delete /api/v1/cart
// @access  Private/User
const clearCart = asyncHandler(async (req, res) => {
  await Cart.findOneAndDelete({ user: req.user._id });
  res.status(204).send();
});

module.exports = {
  //applyCoupon,
  clearCart,
  removeSpecificCartItem,
  getLoggedUserCart,
  addCourseToCart,
};
