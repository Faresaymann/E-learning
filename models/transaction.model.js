const mongoose = require("mongoose");

const purchaseRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the user model
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course", // Reference to the course model
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    enrolled: {
      type: Boolean,
      default: false,
    },
    coursePrice: {
      amount: {
        type: Number,
      },
      currency: {
        type: String,
        enum: ["EGP", "USD"],
      },
    },
    transactionPrice: {
      amount: {
        type: Number,
      },
      currency: {
        type: String,
        enum: ["EGP", "USD"],
      },
    },
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
    },
    discountAmount: {
      type: Number,
    },
    paymentReceiptImage:
    {
      type: String,
      default: "https://res.cloudinary.com/djcwvsuw1/image/upload/v1716994219/transaction/transaction-4bd47935-e7bf-42db-a4ea-cc82b6730a40-1716994217786.jpeg.jpg"
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    rejectionReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("PurchaseRequest", purchaseRequestSchema);
