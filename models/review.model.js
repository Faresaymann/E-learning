const mongoose = require("mongoose");
const Course = require("./Course.model");

const reviewSchema = new mongoose.Schema(
  {
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
  },
  {
    timestamps: true,
  }
);

reviewSchema.statics.calcAverageRatingsAndQuantity = async function (courseId) {
  // Convert courseId to ObjectId if it's not already
  const courseObjectId = mongoose.Types.ObjectId.isValid(courseId)
    ? new mongoose.Types.ObjectId(courseId)
    : courseId;

  console.log(`Calculating ratings for course: ${courseId}`);

  const result = await this.aggregate([
    { $match: { course: courseObjectId } },
    {
      $group: {
        _id: "$course",
        avgRatings: { $avg: "$rate" },
        ratingsQuantity: { $sum: 1 },
      },
    },
  ]);

  console.log(`Aggregation result:`, result);

  if (result.length > 0) {
    const avgRatings = Math.round(result[0].avgRatings * 10) / 10; // Round to one decimal place
    console.log(
      `Updating course ${courseId} with ratings: ${avgRatings}, quantity: ${result[0].ratingsQuantity}`
    );

    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      {
        ratingsAverage: avgRatings,
        ratingsQuantity: result[0].ratingsQuantity,
      },
      { new: true }
    );

    console.log(
      `Updated course ratings:`,
      updatedCourse ? updatedCourse.ratingsAverage : "Course not found"
    );
  } else {
    console.log(
      `No reviews found for course ${courseId}, resetting ratings to 0`
    );

    await Course.findByIdAndUpdate(
      courseId,
      {
        ratingsAverage: 0,
        ratingsQuantity: 0,
      },
      { new: true }
    );
  }
};

reviewSchema.post("save", function () {
  this.constructor.calcAverageRatingsAndQuantity(this.course);
});

reviewSchema.post("remove", function () {
  this.constructor.calcAverageRatingsAndQuantity(this.course);
});

// Add middleware for findOneAndDelete and deleteOne operations
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.clone().findOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  if (this.r) {
    await this.r.constructor.calcAverageRatingsAndQuantity(this.r.course);
  }
});

// Add middleware for deleteOne operation
reviewSchema.post("deleteOne", { document: true, query: false }, function () {
  if (this.course) {
    this.constructor.calcAverageRatingsAndQuantity(this.course);
  }
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;