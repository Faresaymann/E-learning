const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      minLength: 3,
      required: true,
    },
    roles: {
      type: String,
      enum: ["Instructor", "User", "Admin"],
      default: "User",
    },
    profits: {
      // ارباحه
      type: Number,
      default: 0,
    },
    Benefits: {
      // commission rate  مستحقاته
      type: Number,
      default: 0,
    },
    platformFee: {
      type: Number,
      default: 0.15,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    bio: String,
    phone: String,
    profileImage: {
      type: String,
      default:
        "https://res.cloudinary.com/dcjrolufm/image/upload/v1711983058/defaults/rrn916ctapttfi2tsrtj.png", // Default link
    },
    jobTitle: String,
    jobDescription: String,
    facebookUrl: String,
    linkedinUrl: String,
    instagramUrl: String,
    gender: {
      type: String,
      enum: ["Male", "Female"],
    },
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    // Add a reference to the Course model
    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    enrolledCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    certificates: [
      {
        type: String,
      },
    ],
    progress: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Progress",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
