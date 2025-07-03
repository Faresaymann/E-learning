const asyncHandler = require("express-async-handler");
const sharp = require("sharp");
const { v4: uuid } = require("uuid");
const mongoose = require("mongoose");
const ApiFeatures = require("../services/api-features.service");
const User = require("../models/user.model");
const UserCredential = require("../models/userCredential.model");
const {
  recordNotFound,
  validationError,
  unAuthorized,
} = require("../utils/response/errors");
const { success } = require("../utils/response/response");
const {
  generateAccessToken,
  generateRefreshToken,
  setRefreshTokenCookie,
} = require("../services/auth.service");

const {
  uploadSingle,
  uploadToCloudinary,
} = require("../services/file-upload.service");

const { getOne } = require("../services/factory.service");
const UserCredentials = require("../models/userCredential.model");

exports.uploadProfileImage = uploadSingle("profileImage");
//uploadMix([{ name: 'profileImage', maxCount: 1 }]);

exports.resizeProfileImage = asyncHandler(async (req, res, next) => {
  try {
    const filename = `user-${uuid()}-${Date.now()}.jpeg`;

    if (req.file) {
      if (
        !req.file.mimetype.startsWith("image") &&
        req.file.mimetype !== "application/octet-stream"
      ) {
        return next(
          validationError({ message: "Only image files are allowed" })
        );
      }

      const img = await sharp(req.file.buffer)
        .resize(600, 600)
        .toFormat("jpeg")
        .jpeg({ quality: 95 });

      const data = await uploadToCloudinary(
        await img.toBuffer(),
        filename,
        "users"
      );

      // Check if 'data' is defined before accessing 'secure_url'
      if (data && data.secure_url) {
        // Save image into our db
        req.body.profileImage = data.secure_url;
      } else {
        return next(
          validationError({
            message: "Error uploading profile image",
          })
        );
      }
    }

    next();
  } catch (err) {
    next(err);
  }
});

/**
 * @description create new user
 * @route POST /api/v1/users
 * @access private [admin]
 */
exports.createUser = asyncHandler(async (req, res) => {
  // 1- create new user
  const user = await User.create(req.body);

  // 2- create user credentials
  await UserCredential.create({
    password: req.body.password,
    provider: "email",
    providerId: req.body.email,
    user: user._id,
  });

  // 3- send response with all users data
  const { statusCode, body } = success({
    message: "new user created",
    data: user,
  });
  res.status(statusCode).json(body);
});

/**
 * @description get all users
 * @route GET /api/v1/users
 * @access private [admin]
 */
exports.getAllUsers = asyncHandler(async (req, res) => {
  // Build query
  const documentsCounts = await User.countDocuments(); // Assuming your model is named 'User'
  const apiFeatures = new ApiFeatures(User.find({}), req.query)
    .paginate(documentsCounts)
    .filter()
    // .search()
    // .limitFields()
    .sort();

  // Execute query
  const { mongooseQuery, paginationResult } = apiFeatures;
  let documents = await mongooseQuery;

  // Check if documents have a Cloudinary photo, if not, replace with default
  documents = documents.map((User) => {
    if (!User.profileImage) {
      User.profileImage =
        "https://res.cloudinary.com/dcjrolufm/image/upload/v1711983058/defaults/rrn916ctapttfi2tsrtj.png";
    }
    return User;
  });

  const { body, statusCode } = success({
    data: { results: documents, paginationResult },
  });
  res.status(statusCode).json(body);
});

exports.getUser = getOne(User);

/**
 * @description (update user by id) profile
 * @route PUT /api/v1/users/:id
 * @access private [admin]
 */
exports.updateUser = asyncHandler(async (req, res, next) => {
  //just checking
  console.log(req.body);
  try {
    // 1- Update userCredentials for provider id and return data after update (new one)
    if (req.body.email) {
      await UserCredentials.findOneAndUpdate(
        { user: req.params.id },
        { providerId: req.body.email },
        { new: true }
      );
    }
    const userId = req.params.id;
    // 2- Fetch the existing user data from the database
    const existingUser = await User.findById(userId);
    console.log("l2etoo");

    // 3- Check if the user exists
    if (!existingUser) {
      return next(
        recordNotFound({
          message: `User with id ${req.params.id} not found`,
        })
      );
    }
    console.log("user before update: " + existingUser);

    // 4- Construct an update object with only the allowed fields that have different values
    // console.log("body: " + req.body)
    const updateObject = {};
    if (req.body.name !== existingUser.name) {
      updateObject.name = req.body.name;
    }
    if (req.body.email !== existingUser.email) {
      updateObject.email = req.body.email;
    }
    if (req.body.bio !== existingUser.bio) {
      updateObject.bio = req.body.bio;
    }
    if (req.body.phone !== existingUser.phone) {
      updateObject.phone = req.body.phone;
    }
    if (req.body.gender !== existingUser.gender) {
      updateObject.gender = req.body.gender;
    }
    console.log(userId.profileImage);
    console.log(req.body.profileImage);
    if (req.body.profileImage !== existingUser.profileImage) {
      console.log("gowa");
      console.log(userId.profileImage);
      console.log(req.body.profileImage);
      updateObject.profileImage = req.body.profileImage;
    }
    if (
      req.body.jobTitle !== existingUser.jobTitle &&
      req.body.jobTitle !== null
    ) {
      updateObject.jobTitle = req.body.jobTitle;
      updateObject.roles = "Instructor";
    }
    if (
      req.body.jobDescription !== existingUser.jobDescription &&
      req.body.jobTitle !== null
    ) {
      updateObject.jobDescription = req.body.jobDescription;
    }
    if (
      req.body.facebookUrl !== existingUser.facebookUrl &&
      req.body.jobTitle !== null
    ) {
      updateObject.facebookUrl = req.body.facebookUrl;
    }
    if (
      req.body.linkedinUrl !== existingUser.linkedinUrl &&
      req.body.jobTitle !== null
    ) {
      updateObject.linkedinUrl = req.body.linkedinUrl;
    }
    if (
      req.body.instagramUrl !== existingUser.instagramUrl &&
      req.body.jobTitle !== null
    ) {
      updateObject.instagramUrl = req.body.instagramUrl;
    }
    console.log("object role: " + updateObject);
    // 5- Update user by id with the constructed update object
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateObject,
      {
        new: true,
      }
    );
    console.log("user after updating: " + updatedUser);
    // 6- Send response with the updated user profile
    const { statusCode, body } = success({ data: updatedUser });
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
});

/**
 * @description update user password
 * @route PUT /api/v1/users/changePassword/:id
 * @access private [admin]
 */
exports.updateUserPassword = asyncHandler(async (req, res, next) => {
  // 1- update user password and set password changed at to the current date
  const user = await UserCredential.findOneAndUpdate(
    { user: req.params.id },
    {
      password: req.body.password,
      passwordChangedAt: Date.now(),
      tokens: [],
    }
  );

  // 2- check if user exists
  if (!user)
    next(
      recordNotFound({
        message: `user with id ${req.params.id} not found`,
      })
    );

  // 3- send response back
  const { statusCode, body } = success({
    message: "password updated successfully",
  });
  res.status(statusCode).json(body);
});

/**
 * @description delete user by id
 * @route DELETE /api/v1/users/:id
 * @access private [admin]
 */
exports.deleteUser = asyncHandler(async (req, res, next) => {
  // 1- delete user by id
  const user = await User.findByIdAndDelete(req.params.id);

  // 2- check if user exists
  if (!user) {
    next(
      recordNotFound({
        message: `user with id ${req.params.id} not found`,
      })
    );
  }

  // 3- delete user credentials
  await UserCredential.findOneAndDelete({ user: req.params.id });
  // await User.findOneAndDelete({ _id: req.params.id });

  // 4- send response back
  const { statusCode, body } = success({
    message: "user deleted successfully",
  });
  res.status(statusCode).json(body);
});

/**
 * @description get logged user data
 * @route GET /api/v1/users/getMe
 * @access protected [user]
 */
exports.getLoggedUser = asyncHandler(async (req, res, next) => {
  // 1- set params.id to logged user id
  req.params.id = req.user._id;

  // 2- go to getUser
  next();
});

/**
 * @description update logged user data
 * @route PUT /api/v1/users/updateMe
 * @access protected [user]
 */
exports.updateLoggedUser = asyncHandler(async (req, res, next) => {
  // 1- set params.id to logged user id
  req.params.id = req.user._id;

  // 2- Filter request body to only allow name and gender updates
  const allowedFields = ["name", "gender"];
  const filteredBody = {};

  Object.keys(req.body).forEach((key) => {
    if (allowedFields.includes(key)) {
      filteredBody[key] = req.body[key];
    }
  });

  // 3- If there's a profile image in the request, keep it
  if (req.body.profileImage) {
    filteredBody.profileImage = req.body.profileImage;
  }

  // 4- Replace the request body with the filtered one
  req.body = filteredBody;

  // 5- go to updateUser
  next();
});

/**
 * @description update logged user password
 * @route GET /api/v1/users/changeMyPassword
 * @access protected [user]
 */
exports.updateLoggedUserPassword = asyncHandler(async (req, res, next) => {
  // 1- get logged user
  const user = await UserCredential.findOne({ user: req.user._id });

  // 2- check if old password is correct
  if (!(await user.comparePassword(req.body.oldPassword)))
    return next(unAuthorized({ message: "Incorrect password" }));
  console.log("old password: " + req.body.oldPassword + " is true");

  // 3- update user password and password changed at and empty all tokens
  user.password = req.body.newPassword;
  user.passwordChangedAt = Date.now();
  user.tokens = [];

  // 4- generate new access token and refresh token for the user
  const accessToken = generateAccessToken({ userId: req.user._id });
  const refreshToken = generateRefreshToken({ userId: req.user._id });

  // 5- save user with new refresh token
  user.tokens.push(refreshToken);
  await user.save();

  // 6- set refresh token as httpOnly cookie
  setRefreshTokenCookie(res, refreshToken);

  // 7- send access token as response
  const { statusCode, body } = success({
    message: "password updated successfully",
    data: { token: accessToken },
  });
  res.status(statusCode).json(body);
});

/**
 * @description delete logged user data
 * @route GET /api/v1/users/deleteMe
 * @access protected [user]
 */
exports.deleteLoggedUser = asyncHandler(async (req, res) => {
  // 1- set active state to false for user
  await UserCredential.findOneAndUpdate(
    { user: req.user._id },
    {
      active: false,
      tokens: [],
    }
  );

  // 3- send response back
  const { statusCode, body } = success({
    message: "account closed successfully",
  });
  res.status(statusCode).json(body);
});

/**
 * @description get all instructors
 * @route GET /api/v1/users/instructors
 * @access private [admin]
 */
exports.getInstructors = asyncHandler(async (req, res) => {
  // Build query to filter only instructors (assuming user.roles === "Instructor")
  const filter = { roles: "Instructor" };

  // Count the number of instructors for pagination purposes
  const documentsCounts = await User.countDocuments(filter);

  // Use your ApiFeatures service to support pagination, filtering, and sorting if needed.
  const apiFeatures = new ApiFeatures(User.find(filter), req.query)
    .paginate(documentsCounts)
    .filter()
    .sort();

  // Execute query
  const { mongooseQuery, paginationResult } = apiFeatures;
  let documents = await mongooseQuery;

  // Ensure each instructor has a profile image; if not, provide a default
  documents = documents.map((user) => {
    if (!user.profileImage) {
      user.profileImage =
        "https://res.cloudinary.com/dcjrolufm/image/upload/v1711983058/defaults/rrn916ctapttfi2tsrtj.png";
    }
    return user;
  });

  // Send response with instructors data and pagination result
  const { body, statusCode } = success({
    data: { results: documents, paginationResult },
  });
  res.status(statusCode).json(body);
});

/**
 * @description get top instructors by their course ratings
 * @route GET /api/v1/users/top-instructors
 * @access public
 */
exports.getTopInstructors = asyncHandler(async (req, res) => {
  // Get minimum rating from query params or default to 4.5
  const minRating = req.query.minRating ? parseFloat(req.query.minRating) : 4.5;

  // Aggregate to find instructors with their average course ratings
  const topInstructors = await User.aggregate([
    // Match only users with Instructor role
    { $match: { roles: "Instructor" } },

    // Lookup courses taught by each instructor
    {
      $lookup: {
        from: "courses",
        localField: "_id",
        foreignField: "instructor",
        as: "courses",
      },
    },

    // Filter out instructors with no courses or unpublished courses
    { $match: { courses: { $ne: [] } } },

    // Calculate average rating across all courses for each instructor
    {
      $addFields: {
        averageRating: { $avg: "$courses.ratingsAverage" },
        totalCourses: { $size: "$courses" },
        totalStudents: {
          $sum: { $size: { $ifNull: ["$courses.enrolledUsers", []] } },
        },
      },
    },

    // Filter instructors by minimum rating
    { $match: { averageRating: { $gte: minRating } } },

    // Sort by average rating (highest first)
    { $sort: { averageRating: -1 } },

    // Project only needed fields
    {
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        profileImage: 1,
        jobTitle: 1,
        jobDescription: 1,
        bio: 1,
        facebookUrl: 1,
        linkedinUrl: 1,
        instagramUrl: 1,
        averageRating: { $round: ["$averageRating", 1] },
        totalCourses: 1,
        totalStudents: 1,
      },
    },
  ]);

  // Ensure each instructor has a profile image
  const instructorsWithDefaultImage = topInstructors.map((instructor) => {
    if (!instructor.profileImage) {
      instructor.profileImage =
        "https://res.cloudinary.com/dcjrolufm/image/upload/v1711983058/defaults/rrn916ctapttfi2tsrtj.png";
    }
    return instructor;
  });

  // Send response with top instructors data
  const { body, statusCode } = success({
    data: { results: instructorsWithDefaultImage },
  });
  res.status(statusCode).json(body);
});

/**
 * @description get instructor profile with detailed information
 * @route GET /api/v1/users/instructor-profile/?instructorId=id
 * @access public
 */
exports.getInstructorProfile = asyncHandler(async (req, res, next) => {
  const instructorId = req.query.instructorId;

  // Check if instructor exists and has the Instructor role
  const instructor = await User.findOne({
    _id: instructorId,
    roles: "Instructor",
  });

  if (!instructor) {
    return next(
      recordNotFound({
        message: `Instructor with id ${instructorId} not found`,
      })
    );
  }

  // Aggregate to get instructor details with course and student information
  const instructorProfile = await User.aggregate([
    // Match the specific instructor by ID
    { $match: { _id: new mongoose.Types.ObjectId(instructorId) } },

    // Lookup courses taught by the instructor
    {
      $lookup: {
        from: "courses",
        localField: "_id",
        foreignField: "instructor",
        as: "courses",
      },
    },

    // Lookup reviews for all courses taught by the instructor
    {
      $lookup: {
        from: "reviews",
        let: { courseIds: "$courses._id" },
        pipeline: [
          { $match: { $expr: { $in: ["$course", "$$courseIds"] } } },
          {
            $lookup: {
              from: "users",
              localField: "user",
              foreignField: "_id",
              as: "userDetails",
            },
          },
          {
            $project: {
              _id: 1,
              comment: 1,
              rate: 1,
              course: 1,
              createdAt: 1,
              user: { $arrayElemAt: ["$userDetails", 0] },
            },
          },
          {
            $project: {
              _id: 1,
              comment: 1,
              rate: 1,
              course: 1,
              createdAt: 1,
              "user._id": 1,
              "user.name": 1,
              "user.profileImage": 1,
            },
          },
        ],
        as: "allReviews",
      },
    },

    // Calculate statistics across all courses
    {
      $addFields: {
        averageRating: { $avg: "$courses.ratingsAverage" },
        totalCourses: { $size: "$courses" },
        totalStudents: {
          $sum: {
            $map: {
              input: "$courses",
              as: "c",
              in: { $size: { $ifNull: ["$$c.enrolledUsers", []] } }
            }
          }
        },
        // Get course IDs for further lookups
        courseIds: {
          $map: { input: "$courses", as: "course", in: "$$course._id" },
        },
        // Calculate total reviews across all courses
        totalReviews: { $size: "$allReviews" },
      },
    },

    // Project instructor profile fields
    {
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        profileImage: 1,
        jobTitle: 1,
        jobDescription: 1,
        bio: 1,
        facebookUrl: 1,
        linkedinUrl: 1,
        instagramUrl: 1,
        averageRating: { $round: [{ $ifNull: ["$averageRating", 0] }, 1] },
        totalCourses: 1,
        totalStudents: 1,
        totalReviews: 1,
        courseIds: 1,
        courses: {
          $map: {
            input: "$courses",
            as: "course",
            in: {
              _id: "$$course._id",
              title: "$$course.title",
              thumbnail: "$$course.thumbnail",
              ratingsAverage: "$$course.ratingsAverage",
              ratingsQuantity: "$$course.ratingsQuantity",
              price: "$$course.price",
              enrolledCount: {
                $size: { $ifNull: ["$$course.enrolledUsers", []] },
              },
              level: "$$course.level",
            },
          },
        },
        reviews: "$allReviews",
      },
    },
  ]);

  // If no profile was found or the aggregation returned empty
  if (!instructorProfile || instructorProfile.length === 0) {
    return next(
      recordNotFound({
        message: `Could not retrieve profile for instructor with id ${instructorId}`,
      })
    );
  }

  // Get the instructor profile from the aggregation result
  const profile = instructorProfile[0];

  // Ensure instructor has a profile image
  if (!profile.profileImage) {
    profile.profileImage =
      "https://res.cloudinary.com/dcjrolufm/image/upload/v1711983058/defaults/rrn916ctapttfi2tsrtj.png";
  }

  // Send response with instructor profile data
  const { body, statusCode } = success({
    data: profile,
  });
  res.status(statusCode).json(body);
});
