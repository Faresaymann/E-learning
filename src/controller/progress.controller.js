const Progress = require("../models/progress.model");
const Course = require("../models/Course.model");
const { Module } = require("../models/Module.model");
const asyncHandler = require("express-async-handler");
const { recordNotFound, validationError } = require("../utils/response/errors");
const { success } = require("../utils/response/response");

const updateProgress = asyncHandler(async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { courseId, moduleId } = req.body;

    const course = await Course.findById(courseId).populate(
      "instructor",
      "name"
    );
    if (!course) return next(recordNotFound({ message: "Course not found" }));
    const module = await Module.findById(moduleId);
    if (!module) return next(recordNotFound({ message: "Module not found" }));

    // 2) Durations → seconds
    const toSec = (d) => d.hours * 3600 + d.minutes * 60 + d.seconds;
    if (!module.duration || !course.duration) {
      throw new Error("Duration not properly defined");
    }
    const moduleSec = toSec(module.duration);
    const courseSec = toSec(course.duration);

    // Validate courseSec to prevent division by zero
    if (courseSec <= 0) {
      return next(
        validationError({
          message: "Course duration must be greater than zero",
        })
      );
    }

    // 3) Find or create progress
    let progress = await Progress.findOne({ user: userId, course: courseId });
    if (progress) {
      if (!progress.watchedModules.includes(moduleId)) {
        progress.watchedTime += moduleSec;
        // Ensure progress doesn't exceed 100%
        progress.progress = Math.min(
          100,
          Math.round((progress.watchedTime / courseSec) * 100)
        );
        progress.watchedModules.push(moduleId);
      }
    } else {
      progress = new Progress({
        user: userId,
        course: courseId,
        watchedTime: moduleSec,
        watchedModules: [moduleId],
        // Ensure progress doesn't exceed 100%
        progress: Math.min(100, Math.round((moduleSec / courseSec) * 100)),
      });
    }
    await progress.save();

    // 5) Return the progress JSON
    const { statusCode, body } = success({ data: progress });
    res.status(statusCode).json(body);
  } catch (err) {
    console.error("updateProgress error:", err);
    next(err);
  }
});

/**
 * @description Get user progress for a specific course
 * @route GET /api/v1/progress/:courseId
 * @access private [User]
 */
const getProgressByCourse = asyncHandler(async (req, res, next) => {
  try {
    const userId = req.user._id;
    const courseId = req.params.courseId;

    // Validate course exists
    const course = await Course.findById(courseId);
    if (!course) return next(recordNotFound({ message: "Course not found" }));

    // Find progress for this user and course
    const progress = await Progress.findOne({ user: userId, course: courseId })
      .populate("course", "title")
      .populate("watchedModules", "name");

    if (!progress) {
      // If no progress found, return 0% progress
      const emptyProgress = {
        user: userId,
        course: {
          _id: courseId,
          title: course.title,
        },
        watchedTime: 0,
        watchedModules: [],
        progress: 0,
      };
      const { statusCode, body } = success({ data: emptyProgress });
      return res.status(statusCode).json(body);
    }

    // Return the progress data
    const { statusCode, body } = success({ data: progress });
    res.status(statusCode).json(body);
  } catch (err) {
    console.error("getProgressByCourse error:", err);
    next(err);
  }
});

module.exports = { updateProgress, getProgressByCourse };
