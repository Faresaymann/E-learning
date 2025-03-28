const mongoose = require("mongoose");
const Course = require("./Course.model");

const reviewSchema = new mongoose.Schema({
  comment: {
    type: String,
  },
  rate: {
    type: Number,
    min: [1, "Min ratings value is 1.0"],
    max: [5, "Max ratings value is 5.0"],
    required: [true, "review ratings required"],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "Review must belong to user"],
  },
  course: {
    type: mongoose.Schema.ObjectId,
    ref: "Course",
    required: [true, "Review must belong to course"],
  },
}, {
  timestamps: true,
});

reviewSchema.statics.calcAverageRatingsAndQuantity = async function (courseId) {
  const result = await this.aggregate([
    { $match: { course: courseId } },
    {
      $group: {
        _id: "$course",
        avgRatings: { $avg: "$rate" },
        ratingsQuantity: { $sum: 1 },
      },
    },
  ]);

  if (result.length > 0) {
    const avgRatings = Math.round(result[0].avgRatings * 10) / 10; // Round to one decimal place
    await Course.findByIdAndUpdate(courseId, {
      ratingsAverage: avgRatings,
      ratingsQuantity: result[0].ratingsQuantity,
    });
  } else {
    await Course.findByIdAndUpdate(courseId, {
      ratingsAverage: 0,
      ratingsQuantity: 0,
    });
  }
};

reviewSchema.post("save", function () {
  this.constructor.calcAverageRatingsAndQuantity(this.course);
});

reviewSchema.post("remove", function () {
  this.constructor.calcAverageRatingsAndQuantity(this.course);
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;