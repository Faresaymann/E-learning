const Progress = require("../models/progress.model");
const Course = require("../models/Course.model");
const { Module } = require("../models/Module.model");
const asyncHandler = require("express-async-handler");
const { recordNotFound } = require("../utils/response/errors");
const { success } = require("../utils/response/response");

/**
 * @description create / update progress
 * @route PUT /api/v1/progress/
 * @access protected 
 */
const updateProgress = asyncHandler(async (req, res, next) => {
    try {
        const { _id: userId } = req.user;
        const { courseId, moduleId } = req.body;

        //console.log("UserId:", userId);
        //console.log("CourseId:", courseId);
        //console.log("ModuleId:", moduleId);

        // Get course by id
        const course = await Course.findById(courseId);
        if (!course) {
            return next(recordNotFound({ message: 'Course not found' }));
        }
        //console.log("Course found:", course);

        // Get module by id
        const module = await Module.findById(moduleId);
        if (!module) {
            return next(recordNotFound({ message: 'Module not found' }));
        }
        //console.log("Module found:", module);

        // Validate duration fields
        if (!module.duration || typeof module.duration.hours !== 'number' || 
            typeof module.duration.minutes !== 'number' || 
            typeof module.duration.seconds !== 'number') {
            return next(new Error("Module duration is not properly defined"));
        }
        if (!course.duration || typeof course.duration.hours !== 'number' || 
            typeof course.duration.minutes !== 'number' || 
            typeof course.duration.seconds !== 'number') {
            return next(new Error("Course duration is not properly defined"));
        }

        // Calculate module duration in seconds
        const moduleDurationInSeconds = 
            module.duration.hours * 3600 + 
            module.duration.minutes * 60 + 
            module.duration.seconds;
        console.log("Module duration in seconds:", moduleDurationInSeconds);

        // Calculate total course duration in seconds
        const totalCourseDurationInSeconds = 
            course.duration.hours * 3600 + 
            course.duration.minutes * 60 + 
            course.duration.seconds;
        console.log("Total course duration in seconds:", totalCourseDurationInSeconds);

        // Find existing progress or create new
        let progress = await Progress.findOne({ user: userId, course: courseId });
        console.log("Existing progress:", progress);

        if (progress) {
            // Check if module has already been watched
            if (!progress.watchedModules.includes(moduleId)) {
                // Update existing progress
                progress.watchedTime += moduleDurationInSeconds;
                progress.progress = Math.round((progress.watchedTime / totalCourseDurationInSeconds) * 100);
                // Add module to watchedModules array
                progress.watchedModules.push(moduleId);
            }
        } else {
            // Create new progress
            const progressPercentage = Math.round((moduleDurationInSeconds / totalCourseDurationInSeconds) * 100);
            progress = new Progress({
                progress: progressPercentage,
                user: userId,
                course: courseId,
                watchedTime: moduleDurationInSeconds,
                watchedModules: [moduleId],
            });
        }

        await progress.save();
        console.log("Updated progress:", progress);

        // Send response back
        const { statusCode, body } = success({ data: progress });
        res.status(statusCode).json(body);
    } catch (error) {
        console.error("Error updating progress:", error);
        next(error);
    }
});

module.exports = {
    updateProgress,
};
