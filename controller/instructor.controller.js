const asyncHandler = require("express-async-handler");
const factory = require("../services/factory.service");
const { recordNotFound, badRequest } = require("../utils/response/errors");
const { success } = require("../utils/response/response");

const Instructor = require("../models/instructor.model");
const User = require("../models/user.model");

/**
 * @description get instructor data
 * @route GET /api/v1/instructor/getInstructor
 * @access protected [instructor,admin]
 */
exports.getInstructor = factory.getOne(Instructor);

/**
 * @description get all instructor data
 * @route GET /api/v1/instructor/getAllInstructors
 * @access protected [instructor,admin]
 */
exports.getAllInstructors = factory.getAll(Instructor);

/**
 * @description beome instructor
 * @route GET /api/v1/instructor/becomeInstracotr
 * @access publie
 */
exports.becomeInstracotr = asyncHandler(async (req, res, next) => {
  // 1- check if user exists
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(
      recordNotFound({ message: `user with id ${req.user.id} not found` })
    );
  }

  // 2- Check if an instructor already exists for the user
  let instructor = await Instructor.findOne({ user: user._id });

  if (instructor) {
    console.log(instructor);
    return next(badRequest({ message: "Instructor already exists" }));
  } else {
    // 3- Create instructor and link it to the user
    const instructorData = { ...req.body, user: user._id };
    instructor = await Instructor.create(instructorData);
  }

  // 6- send response back
  const { statusCode, body } = success({ data: instructor });
  res.status(statusCode).json(body);
});


/**
 * @description update instructor data
 * @route GET /api/v1/instructor/updateInstructor
 * @access protected [instructor,admin]
 */
exports.updateInstructor = factory.updateOne(Instructor);

/**
 * @description delete instructor
 * @route GET /api/v1/instructor/deleteInstructor
 * @access protected [instructor,admin]
 */
exports.deleteInstructor = factory.deleteOne(Instructor);
