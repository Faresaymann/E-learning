// const mongoose = require('mongoose');
const sharp = require("sharp");
const asyncHandler = require("express-async-handler");
// const {getOne, getAll} = require("../services/factory.service");
const {
  recordNotFound,
  validationError,
  failure,
} = require("../utils/response/errors");
const factory = require("../services/factory.service");
const { success } = require("../utils/response/response");
const { v4: uuid } = require("uuid");

const User = require("../models/user.model");
const Course = require("../models/Course.model");
// const Section = require("../models/section.model");
const Transaction = require("../models/transaction.model");
// const Module = mongoose.model("Module");
const Coupon = require("../models/coupon.model");
const {
  uploadToCloudinary,
  uploadSingle,
} = require("../services/file-upload.service");
const sendEmail = require("../services/email.service");

//handles uploading paymentReceiptImage
const uploadpaymentReceiptImage = uploadSingle("paymentReceiptImage");

// Import necessary modules and dependencies
const resizepaymentReceiptImage = asyncHandler(async (req, res, next) => {
  try {
    const filename = `transaction-${uuid()}-${Date.now()}.jpeg`;

    if (req.file) {
      if (
        !req.file.mimetype.startsWith("image") &&
        req.file.mimetype !== "application/octet-stream"
      ) {
        return next(
          validationError({ message: "Only image files are allowed" })
        );
      }
      console.log("File uploaded:", req.file.originalname);
      const img = await sharp(req.file.buffer)
        .resize(600, 600)
        .toFormat("jpeg")
        .jpeg({ quality: 95 });

      const data = await uploadToCloudinary(
        await img.toBuffer(),
        filename,
        "transaction"
      );

      // Check if 'data' is defined before accessing 'secure_url'
      if (data && data.secure_url) {
        console.log("Image uploaded successfully:", data.secure_url);
        // Save image into our db
        req.body.paymentReceiptImage = data.secure_url;
      } else {
        console.log("No file uploaded");
        return next(
          validationError({
            message: "payment Receipt Image",
          })
        );
      }
    }
    next();
  } catch (err) {
    next(err);
  }
});
//convert USD to EGP
const conversionRates = {
  USD: 50.54, // Example conversion rate
  EGP: 1,
};
const convertToEGP = (amount, currency) => {
  return amount * (conversionRates[currency] || 1);
};

/**
 * @description create a new paymentReceipt transaction
 * @route POST /api/v1/transaction
 * @access private [User]
 */
const createTransaction = asyncHandler(async (req, res, next) => {
  try {
    const { phoneNumber, paymentReceiptImage, courseId, couponCode } = req.body;
    const userId = req.user._id;

    // Check for existing approved transactions
    const existingTransaction = await Transaction.findOne({
      userId,
      courseId,
      status: "Approved",
    });

    if (existingTransaction) {
      return next(
        validationError({ message: "You are already enrolled in this course." })
      );
    }

    // Check for existing pending transactions
    const existingPendingTransaction = await Transaction.findOne({
      userId,
      courseId,
      status: "Pending",
    });

    if (existingPendingTransaction) {
      return next(
        validationError({
          message: "You already have a pending transaction for this course.",
        })
      );
    }

    // Find the course by ID
    const course = await Course.findById(courseId);
    if (!course) {
      return next(recordNotFound({ message: "Course not found" }));
    }

    // Initialize transaction price
    let transactionPrice = {
      amount: course.price.amount,
      currency: course.price.currency,
    };
    let discountAmount = 0;
    let coupon = null;

    // If a coupon code is provided, validate and apply it
    if (couponCode) {
      coupon = await Coupon.findOne({ code: couponCode });
      if (!coupon) {
        return next(validationError({ message: "Invalid coupon code." }));
      }

      // Check coupon expiration and usage
      if (new Date(coupon.expire) < new Date()) {
        return next(validationError({ message: "Coupon has expired." }));
      }
      if (coupon.maximumUses !== null && coupon.uses >= coupon.maximumUses) {
        return next(
          validationError({
            message: "Coupon has reached its maximum number of uses.",
          })
        );
      }

      // Check if the coupon is valid for the specified course
      if (!coupon.course.equals(course.id)) {
        return next(
          validationError({ message: "Coupon is not valid for this course." })
        );
      }

      // Apply the discount to the transaction price
      discountAmount = transactionPrice.amount * (coupon.discount / 100);
      transactionPrice.amount -= discountAmount;
    }

    // Convert transaction price and discount amount to EGP
    let transactionPriceInEGP = convertToEGP(
      transactionPrice.amount,
      transactionPrice.currency
    );
    let discountAmountInEGP = convertToEGP(
      discountAmount,
      transactionPrice.currency
    );

    // Round the transaction price and discount amount
    transactionPriceInEGP = Math.round(transactionPriceInEGP);
    discountAmountInEGP = Math.round(discountAmountInEGP);

    // Create the transaction
    const transaction = await Transaction.create({
      phoneNumber,
      transactionPrice: { amount: transactionPriceInEGP, currency: "EGP" },
      coursePrice: course.price,
      courseId,
      paymentReceiptImage: paymentReceiptImage,
      userId,
      coupon: coupon ? coupon._id : null,
      discountAmount: discountAmountInEGP,
    });

    // Update the User and Course models
    await User.findByIdAndUpdate(userId, {
      $push: { transactions: transaction._id },
    });
    await Course.findByIdAndUpdate(courseId, {
      $push: { transactions: transaction._id },
    });

    // Send success response
    const { statusCode, body } = success({
      data: transaction,
      message: "Transaction created successfully. Pending approval.",
    });
    res.status(statusCode).json(body);
  } catch (error) {
    return next(
      failure({ message: "Error creating transaction: " + error.message })
    );
  }
});

/**
 * @description getall paymentReceipt transactions
 * @route get /api/v1/transaction
 * @access private [Admin]
 */
const getAllTransactions = asyncHandler(async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ status: "Pending" }); // Retrieve all transactions

    const formattedTransactions = transactions.map((transaction) => ({
      _id: transaction._id,
      userId: transaction.userId,
      courseId: transaction.courseId,
      coursePrice: transaction.transactionPrice,
      paymentReceiptImage: transaction.paymentReceiptImage || "", // Include image URL if available
    }));

    console.log(`paymentReceiptImage`, formattedTransactions);

    // Send success response with formatted data
    const { statusCode, body } = success({ data: formattedTransactions });
    res.status(statusCode).json(body);
  } catch (error) {
    next(failure({ message: "Error retrieving transactions" }));
  }
});

/**
 * @description getone paymentReceipt transaction
 * @route get /api/v1/transaction/:id
 * @access private [Admin]
 */
const getOneTransaction = asyncHandler(async (req, res, next) => {
  try {
    const transactionId = req.params.id;
    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      return next(recordNotFound({ message: "Transaction not found" }));
    }

    const formattedTransaction = {
      _id: transaction._id, // Include _id for reference
      userId: transaction.userId,
      courseId: transaction.courseId,
      coursePrice: transaction.CoursePrice,
      paymentReceiptImage: transaction.paymentReceiptImage,
    };

    // Send success response with formatted data
    const { statusCode, body } = success({ data: formattedTransaction });
    res.status(statusCode).json(body);
  } catch (error) {
    next(failure({ message: "Error retrieving transaction" }));
  }
});

/**
 * @description approve a new paymentReceipt transaction
 * @route POST /api/v1/transaction/approve
 * @access private [Admin]
 */

const approveTransaction = asyncHandler(async (req, res, next) => {
  try {
    const transactionId = req.params.id;

    // Find transaction by ID and update status to "Approved"
    const transaction = await Transaction.findByIdAndUpdate(
      transactionId,
      { status: "Approved", enrolled: true },
      { new: true }
    );

    if (!transaction) {
      return next(recordNotFound({ message: "Transaction not found" }));
    }

    // Extract user and course IDs
    const { userId, courseId } = transaction;

    // Update the Course and User models
    const course = await Course.findById(courseId).populate(
      "instructor",
      "name"
    );
    if (!course) {
      return next(recordNotFound({ message: "Course not found" }));
    }

    // Add user to enrolled users
    course.enrolledUsers.push(userId);
    await course.save();

    // Update user's enrolled courses
    await User.findByIdAndUpdate(userId, {
      $push: { enrolledCourses: courseId },
    });

    // Get user information for email
    const user = await User.findById(userId);
    if (!user) {
      return next(recordNotFound({ message: "User not found" }));
    }

    // Calculate course profits in EGP
    const coursePriceInEGP = convertToEGP(
      course.price.amount,
      course.price.currency
    );
    const taxes = Math.round(coursePriceInEGP * 0.05);
    course.profits += Math.round(coursePriceInEGP - taxes);

    // Get the total number of enrolled students
    const enrolledStudentsCount = course.enrolledUsers.length;

    // Save the updated course
    await course.save();

    // Update instructor's profits in EGP
    const instructor = await User.findById(course.instructor);
    instructor.profits += Math.round(
      coursePriceInEGP - coursePriceInEGP * instructor.platformFee - taxes
    );
    await instructor.save();

    // Update coupon usage if a coupon was used
    if (transaction.coupon) {
      const coupon = await Coupon.findById(transaction.coupon);
      coupon.uses += 1;
      await coupon.save();
    }

    // Send email notification to the user
    try {
      await sendEmail({
        to: user.email,
        subject: "Course Enrollment Confirmation",
        template: "/views/TransactionComplete.ejs",
        data: {
          courseName: course.title,
          instructorName: instructor.name,
          transactionPrice: transaction.transactionPrice,
        },
      });
      console.log(`Enrollment confirmation email sent to ${user.email}`);
    } catch (emailError) {
      console.error("Error sending enrollment confirmation email:", emailError);
      // Continue with the process even if email fails
    }

    // Send success response
    const { statusCode, body } = success({
      message: "You've successfully enrolled in this course",
      data: {
        transaction,
        enrolledStudentsCount,
      },
    });
    res.status(statusCode).json(body);
  } catch (error) {
    return next(
      failure({ message: "Error approving transaction: " + error.message })
    );
  }
});

/**
 * @description calculate instructor profits
 * @route Put /api/v1/transaction/calculate profits/:id
 * @access private [Admin]
 */
const calculateProfits = asyncHandler(async (req, res, next) => {
  try {
    const instrucotrId = req.params.id;
    // get instructor by id
    const instructor = await User.findById(instrucotrId);
    //check if exists
    if (!instructor) {
      return next(recordNotFound({ message: "No instructor found" }));
    }
    //get instructor courses
    const instCourses = instructor.courses;
    // define instructor's profits
    let instProfit = 0;

    //loop through each course and calculate course's profits and instructor's profit
    for (const cour of instCourses) {
      //get course by id
      const course = await Course.findById(cour);
      //check if course exists and puplished
      if (course && course.publish) {
        //get user enrolled in this course
        const students = course.enrolledUsers;
        //get student number
        const studentNumber = students.length;

        //get price of this course, and calculate profit of this course. And then calculate instrucotr's profit
        if (studentNumber > 0) {
          //get course price
          const courseprice = course.price.amount;
          //define taxes
          const taxes = courseprice * 0.05;
          //calculate profits of course
          course.profits = (courseprice - taxes) * studentNumber;
          //save changes
          course.save();

          //calculate profit of instrucotor
          instProfit +=
            (courseprice - courseprice * instructor.platformFee - taxes) *
            studentNumber;
        }
      }
    }
    //update instructor profit
    instructor.profits = instProfit;
    //save changes
    instructor.save();

    const profits = {
      instructorCourses: instCourses,
      proft: instructor.profits,
    };
    //send response back
    const { statusCode, body } = success({
      message:
        "Profits for instructor and each of it's courses has been updated",
      data: profits,
    });
    res.status(statusCode).json(body);
  } catch (error) {
    console.error(error);
  }
});

/**
 * @description reject a new paymentReceipt transaction
 * @route POST /api/v1/transaction/reject/:id
 * @access private [Admin]
 */
// Function to reject a transaction
const rejectTransaction = asyncHandler(async (req, res, next) => {
  try {
    const transactionId = req.params.id;
    const { rejectionReason } = req.body; // Optional rejection reason

    const transaction = await Transaction.findByIdAndUpdate(
      transactionId,
      {
        status: "Rejected",
        rejectionReason, // Add rejection reason if provided
      },
      { new: true }
    );

    if (!transaction) {
      return next(recordNotFound({ message: "Transaction not found" }));
    }

    // Send success response
    const { statusCode, body } = success({ data: transaction });
    res.status(statusCode).json(body);
  } catch (error) {
    return next(failure({ message: "Error rejecting transaction" }));
  }
});

/**
 * @description delete a transaction
 * @route POST /api/v1/transaction/delete/:id
 * @access private [Admin]
 */
const deleteTransaction = factory.deleteOne(Transaction);

module.exports = {
  resizepaymentReceiptImage,
  uploadpaymentReceiptImage,
  createTransaction,
  approveTransaction,
  rejectTransaction,
  getAllTransactions,
  getOneTransaction,
  calculateProfits,
  deleteTransaction,
};
