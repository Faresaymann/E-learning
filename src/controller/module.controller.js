const asyncHandler = require("express-async-handler");
const ffmpeg = require("fluent-ffmpeg");
const { Readable } = require("stream");
const cloudinary = require("cloudinary").v2;
const { Module, calculateModuleDuration } = require("../models/Module.model");
const Section = require("../models/section.model");
const {
  uploadMix,
  uploadFilesToCloudinary,
} = require("../services/file-upload.service");
const factory = require("../services/factory.service");

const { recordNotFound } = require("../utils/response/errors");
const { success } = require("../utils/response/response");
const uploadModuleVideos = uploadMix([{ name: "file" }]);

/**
 * Helper function to normalize duration values (convert excess seconds to minutes, excess minutes to hours)
 */
const normalizeDuration = (hours, minutes, seconds) => {
  minutes += Math.floor(seconds / 60);
  seconds %= 60;
  hours += Math.floor(minutes / 60);
  minutes %= 60;
  return { hours, minutes, seconds };
};

/**
 * Helper function to add a module to a section and update the section's duration
 * @param {string} sectionId - The ID of the section to add the module to
 * @param {string} moduleId - The ID of the module to add
 * @returns {Promise<Object>} - The updated section
 */
const addModuleToSection = async (sectionId, moduleId) => {
  // Find the section by ID
  const section = await Section.findById(sectionId);

  // Check if section exists
  if (!section) {
    throw new Error(`Section with ID ${sectionId} not found`);
  }

  // Find the module by ID
  const module = await Module.findById(moduleId);

  // Check if module exists
  if (!module) {
    throw new Error(`Module with ID ${moduleId} not found`);
  }

  // Add the module to the section's modules array if it's not already there
  if (!section.modules.includes(moduleId)) {
    section.modules.push(moduleId);

    // Update section duration by adding the module's duration
    const totalHours = section.sectionDuration.hours + module.duration.hours;
    const totalMinutes =
      section.sectionDuration.minutes + module.duration.minutes;
    const totalSeconds =
      section.sectionDuration.seconds + module.duration.seconds;

    // Normalize the duration values
    const { hours, minutes, seconds } = normalizeDuration(
      totalHours,
      totalMinutes,
      totalSeconds
    );

    // Update the section's duration
    section.sectionDuration.hours = hours;
    section.sectionDuration.minutes = minutes;
    section.sectionDuration.seconds = seconds;

    // Save the updated section
    await section.save();
  }

  return section;
};

const createModule = async ({ file, name, isFree }) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.buffer) {
      return reject(new Error("File or file buffer is missing"));
    }

    const stream = new Readable();
    stream.push(file.buffer);
    stream.push(null);

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto", // handles both videos and images
        folder: "modules",
      },
      async (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return reject(error);
        }

        console.log("Cloudinary upload result:", result);
        try {
          // Create the module document in MongoDB
          const newModule = await Module.create({
            name,
            file: {
              filename: result.public_id,
              path: result.secure_url,
            },
            isFree,
          });

          // Check if resource is a video and if duration is available from Cloudinary
          if (result.resource_type === "video" && result.duration) {
            const duration = result.duration;
            const hours = Math.floor(duration / 3600);
            const minutes = Math.floor((duration % 3600) / 60);
            const seconds = Math.floor(duration % 60);
            newModule.duration = { hours, minutes, seconds };
          } else {
            // For images or if duration is missing, set duration to null (or handle accordingly)
            newModule.duration = null;
          }
          await newModule.save();

          resolve(newModule);
        } catch (dbError) {
          console.error("Error creating module in database:", dbError);
          reject(dbError);
        }
      }
    );

    stream.pipe(uploadStream);
  });
};

/**
 * Controller middleware to handle file uploads and associate modules with a section.
 * This function supports both single and multiple file uploads.
 *
 * Expectation:
 * - A sectionId is provided (e.g., in req.body.sectionId) to associate the module(s) with the proper section.
 * @route POST /api/v1/coursemodule
 * @access private [Instructor, Admin]
 */
const uploadVideosToCloud = asyncHandler(async (req, res, next) => {
  // Retrieve the sectionId from the request (body or params)
  const { sectionId } = req.body;
  if (!sectionId) {
    return next(
      new Error("sectionId is required to associate the module with a section.")
    );
  }

  // Check if the section exists
  const section = await Section.findById(sectionId);
  if (!section) {
    return next(
      recordNotFound({ message: `Section with id ${sectionId} not found` })
    );
  }

  // Single video/image upload
  if (req.file) {
    try {
      const newModule = await createModule({
        file: req.file,
        name: req.body.name || req.file.originalname, // Use file name if no name provided
        isFree: req.body.isFree === "true" || req.body.isFree === true,
      });

      // Associate the new module with the section
      await addModuleToSection(sectionId, newModule._id);

      const { statusCode, body } = success({
        message: "Module uploaded and associated with section successfully",
        data: newModule,
      });

      return res.status(statusCode).json(body);
    } catch (error) {
      console.error("Error uploading single module:", error);
      return next(error);
    }
  }

  // Multiple video/image uploads
  if (req.files && req.files.file && req.files.file.length > 0) {
    try {
      const uploadPromises = req.files.file.map((file) =>
        createModule({
          file: file,
          name: req.body.name || file.originalname, // Use file name if no name provided
          isFree: req.body.isFree === "true" || req.body.isFree === true,
        })
      );

      const modules = await Promise.all(uploadPromises);

      // Associate each new module with the section
      const sectionUpdatePromises = modules.map((mod) =>
        addModuleToSection(sectionId, mod._id)
      );

      await Promise.all(sectionUpdatePromises);

      const { statusCode, body } = success({
        message: `${modules.length} modules uploaded and associated with section successfully`,
        data: modules,
      });

      return res.status(statusCode).json(body);
    } catch (error) {
      console.error("Error uploading multiple modules:", error);
      return next(error);
    }
  }

  // If no files were provided
  return next(
    new Error("No files were uploaded. Please provide at least one file.")
  );
});

/**
 * @description get all coursesmodules
 * @route GET /api/v1/coursemodule
 * @access private [Instructor, Admin]
 */
const getAllModules = factory.getAll(Module);

/**
 * @description get module by id
 * @route GET /api/v1/coursemodule/:id
 * @access private [Instructor, Admin]
 */
const getModuleById = factory.getOne(Module);

/**
 * @description update module by id
 * @route PUT /api/v1/coursemodule/:id
 * @access private [Instructor, Admin]
 */
// factory.updateOne(Module);
const updateModule = asyncHandler(async (req, res, next) => {
  // get module id
  const moduleId = req.params.id;
  try {
    console.log(req.body.isFree);
    // get module by id
    const module = await Module.findById(moduleId);

    // Check if the module exists
    if (!module) {
      return next(
        recordNotFound({ message: `module with id ${req.params.id} not found` })
      );
    }

    const updatedModuleData = {};
    if (req.body.isFree !== moduleId.isFree) {
      updatedModuleData.isFree = req.body.isFree;
    }
    if (req.body.name !== moduleId.name) {
      updatedModuleData.name = req.body.name;
    }
    console.log(updatedModuleData);
    // update module data
    const update = await Module.findByIdAndUpdate(moduleId, updatedModuleData, {
      new: true,
    });

    // return response
    const { statusCode, body } = success({ data: update });
    res.status(statusCode).json(body);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

/**
 * @description delete module by id
 * @route DELETE /api/v1/coursemodule/:id
 * @access private [Instructor, Admin]
 */
const deleteModule = asyncHandler(async (req, res, next) => {
  try {
    const moduleId = req.params.id;

    // 1- Get module by id
    const module = await Module.findById(moduleId);

    // 2- Check if module exists
    if (!module) {
      return next(
        recordNotFound({ message: `Module with id ${moduleId} not found` })
      );
    }

    // Calculate the total duration of the module in seconds
    const totalModuleDurationInSeconds =
      module.duration.hours * 3600 +
      module.duration.minutes * 60 +
      module.duration.seconds;

    // 3- Find the section containing the module
    const section = await Section.findOne({ modules: moduleId });

    if (section) {
      // Remove the module from the section's array
      section.modules.pull(moduleId);

      // Convert current sectionDuration to seconds
      const currentSectionDurationInSeconds =
        section.sectionDuration.hours * 3600 +
        section.sectionDuration.minutes * 60 +
        section.sectionDuration.seconds;

      // Subtract the module duration from the section duration
      let newSectionDurationInSeconds =
        currentSectionDurationInSeconds - totalModuleDurationInSeconds;
      if (newSectionDurationInSeconds < 0) newSectionDurationInSeconds = 0;

      // Convert new duration back to hours, minutes, and seconds
      const newHours = Math.floor(newSectionDurationInSeconds / 3600);
      const newMinutes = Math.floor((newSectionDurationInSeconds % 3600) / 60);
      const newSeconds = newSectionDurationInSeconds % 60;

      section.sectionDuration.hours = newHours;
      section.sectionDuration.minutes = newMinutes;
      section.sectionDuration.seconds = newSeconds;

      await section.save();
    }

    // 4- Delete the module
    await Module.findByIdAndDelete(moduleId);

    const { statusCode, body } = success({
      message: `Module deleted successfully`,
    });
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
});

/**
 * @description calculate module duration
 * updating the duration of a specific module to be like hours:mintes:seconds
 * @route PUT /api/v1/coursemodule/calculate-duration/:id
 */
const CalcDuration = async (req, res, next) => {
  try {
    const moduleId = req.params.id;
    console.log(moduleId);
    // get module by id
    const module = await Module.findById(moduleId);
    // check if module exists
    if (!module) {
      return next(recordNotFound({ message: "Module not found" }));
    }

    console.log(module);
    // calculate duration in seconds
    const duration = await calculateModuleDuration(module.file.path);

    // convert duration to hours:minutes:seconds
    const hours = duration / 3600;
    const minutes = (duration % 3600) / 60;
    const seconds = duration % 60;
    console.log(
      "hours: " + hours + " ,minutes: " + minutes + " ,seconds: " + seconds
    );

    //Update the module's duration field
    module.duration.hours = hours;
    module.duration.minutes = minutes;
    module.duration.seconds = seconds;
    // save module
    await module.save();

    // Respond with the updated module
    res.json({
      message: "Module duration calculated and updated successfully",
      data: module.duration,
    });
  } catch (error) {
    console.error("Error calculating module duration:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * @description set module vedios to free, or not free
 * if vedio is free set it to not free, and if vedio is not free set it to free
 * @route PUT /api/v1/coursemodule/setFreeNotFree/:id
 */
const setFreeNotFree = async (req, res, next) => {
  try {
    const moduleId = req.params.id;
    //get module by id
    const module = await Module.findById(moduleId);
    //check if exists
    if (!module) {
      return next(recordNotFound({ message: "Module not found" }));
    }
    //check if module is free
    const isfree = module.isFree;
    //if the module is free make it not free
    if (isfree) {
      //make it not free
      module.isFree = false;
      //save changes
      module.save();
      //send response back
      const { statusCode, body } = success({
        message: "Module is set to not free",
        data: module,
      });
      res.status(statusCode).json(body);
    } else {
      //if not free make it free
      module.isFree = true;
      //save changes
      module.save();
      //send response back
      const { statusCode, body } = success({
        message: "Module is set to free",
        data: module,
      });
      res.status(statusCode).json(body);
    }
  } catch (err) {
    console.error(err);
  }
};

/**
 * @description get modules by section id
 * @route GET /api/v1/coursemodule/section/:sectionId
 * @access private [Instructor, Admin, Student]
 */
const getModulesBySectionId = asyncHandler(async (req, res, next) => {
  try {
    const sectionId = req.params.sectionId;

    // Check if section exists
    const section = await Section.findById(sectionId);
    if (!section) {
      return next(
        recordNotFound({ message: `Section with id ${sectionId} not found` })
      );
    }

    // Find the section and populate its modules
    const populatedSection = await Section.findById(sectionId).populate({
      path: "modules",
      select: "name file.path isFree duration",
    });

    if (!populatedSection.modules || populatedSection.modules.length === 0) {
      return next(
        recordNotFound({
          message: `No modules found for section with id ${sectionId}`,
        })
      );
    }

    const { statusCode, body } = success({
      message: "Modules retrieved successfully",
      data: populatedSection.modules,
    });

    res.status(statusCode).json(body);
  } catch (error) {
    console.error("Error getting modules by section ID:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = {
  createModule,
  getAllModules,
  getModuleById,
  updateModule,
  deleteModule,
  uploadModuleVideos,
  uploadVideosToCloud,
  CalcDuration,
  setFreeNotFree,
  addModuleToSection,
  normalizeDuration,
  getModulesBySectionId,
};