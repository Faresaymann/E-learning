const asyncHandler = require("express-async-handler");
const { recordNotFound } = require("../utils/response/errors");
const { success } = require("../utils/response/response");

//import createModule from module controller
const { createModule } = require("./module.controller");
const Section = require("../models/section.model");
//const Modules = require("../models/Module.model");

const { Module } = require("../models/Module.model");
const {
  uploadMix,
  uploadFilesToCloudinary,
} = require("../services/file-upload.service");
const Course = require("../models/Course.model");
const uploadModuleVideos = uploadMix([{ name: "file" }]);

const uploadVideosToCloud = asyncHandler(async (req, res, next) => {
  if (req.files.file) {
    req.body.file = [];
    const veds = req.files.file;
    const uploadPromises = veds.map((v) => {
      return uploadFilesToCloudinary(v.buffer, "modules").then((result) => {
        req.body.file.push({
          path: result.secure_url,
          filename: result.public_id,
        });
      });
    });
    await Promise.all(uploadPromises);
  }
  next();
});

const normalizeDuration = (hours, minutes, seconds) => {
  minutes += Math.floor(seconds / 60);
  seconds %= 60;
  hours += Math.floor(minutes / 60);
  minutes %= 60;
  return { hours, minutes, seconds };
};

const createSection = asyncHandler(async (req, res) => {
  const CourseId = req.body.courseId;
  const newSection = await Section.create({ courseId: CourseId });
  const updatedCourse = await Course.findById(req.body.courseId);

  updatedCourse.sections.push(newSection._id);
  updatedCourse.save();
  const { statusCode, body } = success({
    message: "New Section created without files",
    data: newSection,
  });

  res.status(statusCode).json(body);
});

const getAllSections = asyncHandler(async (req, res, next) => {
  const sections = await Section.find().populate("modules", "name");
  if (!sections) {
    return next(recordNotFound({ message: `no section is found` }));
  }
  const { statusCode, body } = success({
    message: "get all sections",
    data: sections,
  });
  res.status(statusCode).json(body);
});

const getSectionByid = asyncHandler(async (req, res) => {
  const sectionId = req.params.id;
  const section = await Section.findById(sectionId).populate({
    path: "modules",
    select: "name file.path isFree",
  });

  const { body, statusCode } = success({
    data: { results: section },
  });
  res.status(statusCode).json(body);
});

const updateCourseDuration = async (courseId) => {
  const course = await Course.findById(courseId).populate({
    path: "sections",
    populate: {
      path: "modules",
    },
  });

  let totalHours = 0,
    totalMinutes = 0,
    totalSeconds = 0;

  course.sections.forEach((section) => {
    section.modules.forEach((module) => {
      totalHours += module.duration.hours;
      totalMinutes += module.duration.minutes;
      totalSeconds += module.duration.seconds;
    });
  });

  const { hours, minutes, seconds } = normalizeDuration(
    totalHours,
    totalMinutes,
    totalSeconds
  );

  course.duration = { hours, minutes, seconds };
  await course.save();
};

const updateSection = asyncHandler(async (req, res, next) => {
  try {
    const sectionId = req.params.id;

    if (!req.files || !req.files.file || req.files.file.length === 0) {
      const updatedSection = await Section.findByIdAndUpdate(
        sectionId,
        { title: req.body.title },
        { new: true }
      ).populate("modules", " -id name");

      const { statusCode, body } = success({
        message: "Section updated successfully without files",
        data: updatedSection,
      });
      return res.status(statusCode).json(body);
    }

    const uploadedFiles = req.files.file;
    const sec = await Section.findById(sectionId);

    if (!sec) {
      return next(
        recordNotFound({ message: `No section with id ${sectionId}` })
      );
    }

    const moduleIds = sec.modules;
    let totalHours = sec.sectionDuration.hours;
    let totalMinutes = sec.sectionDuration.minutes;
    let totalSeconds = sec.sectionDuration.seconds;

    for (const file of uploadedFiles) {
      const Name = file.originalname;
      const isFree = req.body.isFree;
      const module = await createModule({ file, Name, isFree });

      if (module) {
        moduleIds.push(module._id);
        totalHours += module.duration.hours;
        totalMinutes += module.duration.minutes;
        totalSeconds += module.duration.seconds;
      } else {
        console.error(`Failed to create module for file: ${file.originalname}`);
        return res.status(500).json({
          message: `Failed to create module for file: ${file.originalname}`,
        });
      }
    }

    const { hours, minutes, seconds } = normalizeDuration(
      totalHours,
      totalMinutes,
      totalSeconds
    );

    const updatedSection = await Section.findByIdAndUpdate(
      sectionId,
      {
        modules: moduleIds,
        sectionDuration: { hours, minutes, seconds },
      },
      { new: true }
    ).populate("modules", "name");

    // Update course duration
    await updateCourseDuration(updatedSection.courseId);

    const { statusCode, body } = success({
      message: "Section updated successfully with files",
      data: updatedSection,
    });

    res.status(statusCode).json(body);
  } catch (error) {
    console.error("Error updating section:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
/**
 * @description delete section
 * @route DELETE /api/v1/section
 * @access private [Instructor, Admin]
 */
const deleteSection = asyncHandler(async (req, res, next) => {
  try {
    // 1- Get section by id
    const sectionId = req.params.id;
    const section = await Section.findById(sectionId);
    // 2- check if section exists
    if (!section) {
      console.log(section);
      return next(
        recordNotFound({ message: `section with id ${sectionId} is not found` })
      );
    }

    // 3- Get associated module IDs
    const moduleIds = section.modules;

    // 4- Delete each module
    for (const moduleId of moduleIds) {
      const deletedModule = await Module.findByIdAndDelete(moduleId);
      if (!deletedModule) {
        console.log(`Module with ID ${moduleId} not found.`);
      }
    }

    // 5- delete/pull this section from course
    await Course.updateMany(
      { sections: sectionId },
      { $pull: { sections: sectionId } }
    );

    // 6- Delete the section itself
    await Section.findByIdAndDelete(sectionId);

    // 7- Send response back
    const { statusCode, body } = success({
      message: "Section and associated modules deleted successfully",
    });
    res.status(statusCode).json(body);
  } catch (error) {
    console.error("Error deleting section:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

/**
 * @description update sectionDuration
 * @route PUT /api/v1/section/calculate-duration/:id
 */
const secDuration = asyncHandler(async (req, res, next) => {
  try {
    console.log("helllloooooo");
    const secID = req.params.id;
    console.log("secID: " + secID);

    // get section by id
    const section = await Section.findById(secID).populate("modules");
    console.log(section);

    // extract module's id
    const modulesId = section.modules;
    console.log(modulesId);

    let hours = 0,
      minutes = 0,
      seconds = 0;

    // Iterate through each module in the section
    for (const module of section.modules) {
      if (module) {
        // extract module hours, minutes, and seconds
        const {
          hours: modHours,
          minutes: modMinutes,
          seconds: modSeconds,
        } = module.duration;
        // sum duration
        hours += modHours;
        minutes += modMinutes;
        seconds += modSeconds;
      }
    }

    // Normalize the total duration
    const normalizedDuration = normalizeDuration(hours, minutes, seconds);

    // Set the sectionDuration to the calculated totalDuration
    section.sectionDuration = normalizedDuration;

    // save section
    await section.save();

    // Send response back
    const { statusCode, body } = success({
      message: "Section duration calculated successfully",
      data: section.sectionDuration,
    });
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
});

/**
 * @description get sections by course id
 * @route GET /api/v1/section/course/:courseId
 * @access private [Instructor, Admin, Student]
 */
const getSectionsByCourseId = asyncHandler(async (req, res, next) => {
  try {
    // Get courseId from either params, query parameters, or body
    // Prioritize query parameter for the format /v1/section/course?courseId=xxx
    const courseId =
      req.query.courseId || req.params.courseId || req.body.courseId;

    if (!courseId) {
      return next(
        recordNotFound({
          message: `Course ID is required`,
        })
      );
    }

    // Find sections by courseId and populate modules
    const sections = await Section.find({ courseId }).populate({
      path: "modules",
      select: "name file.path isFree duration",
    });

    if (!sections || sections.length === 0) {
      return next(
        recordNotFound({
          message: `No sections found for course with id ${courseId}`,
        })
      );
    }

    const { statusCode, body } = success({
      message: "Sections retrieved successfully",
      data: sections,
    });

    res.status(statusCode).json(body);
  } catch (error) {
    console.error("Error getting sections by course ID:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = {
  createSection,
  getAllSections,
  getSectionByid,
  updateSection,
  deleteSection,
  uploadModuleVideos,
  uploadVideosToCloud,
  secDuration,
  getSectionsByCourseId,
};