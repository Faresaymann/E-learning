const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema(
  {
    cartItems: [
      {
        course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
        price: {
          currency: { type: String },
          amount: { type: Number }
        }
      }
    ],
    totalCartPrice: Number,
    totalPriceAfterDiscount: Number,
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model('Cart', cartSchema);
