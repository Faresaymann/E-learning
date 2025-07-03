//import ApiFeatures from '../services/api-features.service';
const asyncHandler = require("express-async-handler");
//const mongoose = require('mongoose');
const sharp = require("sharp");
const { v4: uuid } = require("uuid");
//const factory = require("../services/factory.service")
const { recordNotFound, validationError } = require("../utils/response/errors");

const { success } = require("../utils/response/response");
const Course = require("../models/Course.model");
const Category = require("../models/Category.model");
const Section = require("../models/section.model");
const { Module } = require("../models/Module.model");
const User = require("../models/user.model");
const Progress = require("../models/progress.model");
const Review = require("../models/review.model");
const Transaction = require("../models/transaction.model");
const {
  uploadToCloudinary,
  uploadMix,
} = require("../services/file-upload.service");

//handles uploading thumbnail and vedioTrailer/
const uploadtBoth = uploadMix([
  { name: "thumbnail", maxCount: 1 },
  { name: "videoTrailer", maxCount: 1 },
]);

// Import necessary modules and dependencies
const resizethumbnailImg = asyncHandler(async (req, res, next) => {
  try {
    // Generate a unique filename using UUID and current timestamp
    const filename = `user-${uuid()}-${Date.now()}.jpeg`;

    // Check if a thumbnail file is provided in the request
    console.log(req.files, req.file);
    if (req.files) {
      if (req.files.thumbnail) {
        // Validate the mimetype of the thumbnail file
        if (
          !req.files.thumbnail[0].mimetype.startsWith("image") &&
          req.files.thumbnail[0].mimetype !== "application/octet-stream"
        ) {
          return next(
            validationError({ message: "Only image files are allowed" })
          );
        }

        // Resize and format the thumbnail image using sharp library
        const img = await sharp(req.files.thumbnail[0].buffer)
          .resize(600, 600)
          .toFormat("jpeg")
          .jpeg({ quality: 95 });

        // Upload the resized thumbnail image to Cloudinary
        const data = await uploadToCloudinary(
          await img.toBuffer(),
          filename,
          "course"
        );
        // Check if 'data' is defined before accessing 'secure_url'
        if (data && data.secure_url) {
          // Save the Cloudinary URL of the thumbnail image into the request body
          req.body.thumbnail = data.secure_url;
        } else {
          return next(
            validationError({ message: "Error uploading thumbnail image" })
          );
        }
      }
      // Check if a video trailer file is provided in the request
      if (req.files.videoTrailer) {
        // Upload the video trailer file to Cloudinary
        const data = await uploadToCloudinary(
          req.files.videoTrailer[0].buffer,
          filename,
          "course"
        );

        console.log("Uploaded video trailer data:", data);

        // Check if 'data' is defined before accessing 'secure_url'
        if (data && data.secure_url) {
          // Save the Cloudinary URL of the video trailer into the request body
          req.body.videoTrailer = data.secure_url;
        } else {
          return next(
            validationError({ message: "Error uploading video trailer" })
          );
        }
      }
    }
    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    // Pass any errors to the next middleware for error handling
    next(error);
  }
});

// Helper function to normalize duration
const normalizeDuration = (hours, minutes, seconds) => {
  minutes += Math.floor(seconds / 60);
  seconds %= 60;
  hours += Math.floor(minutes / 60);
  minutes %= 60;
  return { hours, minutes, seconds };
};

/**
 * @description create new course
 * @route POST /api/v1/course
 * @access private [Instructor, Admin]
 */
const createCourse = asyncHandler(async (req, res, next) => {
  try {
    // create new course with title, subTitle, category, language, level and instructor fields
    // 1- Extract required fields from the request body
    const { title, subTitle, category, language, level } = req.body;
    const { _id } = req.user; //instrucotr id
    console.log(_id);
    // 2- Create the course using the extracted fields
    const newCourse = await Course.create({
      title: title,
      subTitle,
      category,
      language,
      level,
      instructor: _id,
    });

    console.log(newCourse);
    // 3- Update the category with the new course
    await Category.findByIdAndUpdate(
      category,
      { $push: { courses: newCourse._id } },
      { new: true }
    );

    // 4- get the instructor by id
    const Instructor = await User.findById(_id);
    console.log(Instructor);
    // 5- get instructor courses
    const instructorCourses = Instructor.courses;

    // 6- push the new course id into instructor courses
    instructorCourses.push(newCourse._id);

    // 7- save the instructor
    Instructor.save();

    // 8- Send success response
    const { statusCode, body } = success({ data: newCourse });
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
});

/**
 * @description get all courses with selected fields
 * @route GET /api/v1/course
 * @access private [Instructor, Admin]
 */
const getAllCourses = asyncHandler(async (req, res) => {
  const courses = await Course.aggregate([
    {
      $match: { publish: true }, // Filter only published courses
    },
    {
      $lookup: {
        from: "users",
        localField: "instructor",
        foreignField: "_id",
        as: "instructorInfo",
      },
    },
    {
      $project: {
        _id: 1,
        title: 1,
        thumbnail: 1, 
        price: {
          amount: { $ifNull: ["$price.amount", 0] },
          currency: { $ifNull: ["$price.currency", "EGP"] },
        },
        ratingsAverage: { $ifNull: ["$ratingsAverage", 0] },
        instructorName: { $arrayElemAt: ["$instructorInfo.name", 0] },
        profits: { $ifNull: ["$profits", 0] },
        enrolledStudentsCount: { $size: { $ifNull: ["$enrolledUsers", []] } },
      },
    },
  ]);

  const { body, statusCode } = success({
    data: { results: courses },
  });
  res.status(statusCode).json(body);
});

/**
 * @description get course by id
 * @route GET /api/v1/course/:id
 * @access private [Instructor, Admin]
 */
const getCourseById = asyncHandler(async (req, res, next) => {
  try {
    const { _id } = req.user;
    const courseId = req.params.id;

    // Find the course by ID and populate the 'instructor', 'sections', 'ratings', and 'reviews' fields
    const course = await Course.findById(courseId)
      .populate("instructor")
      .populate({
        path: "sections",
        populate: {
          path: "modules",
          model: "Module",
          select: "name _id isFree",
        },
      })
      .populate({
        path: "ratings",
        populate: {
          path: "user",
          select: "name profileImage", // Include the profileImage field
        },
      });

    if (!course) {
      return next(
        recordNotFound({ message: `Course with id ${req.params.id} not found` })
      );
    }

    // // Check if the user is enrolled in this course
    // const isEnrolled = await Transaction.findOne({
    //   userId: _id,
    //   courseId,
    //   status: "Approved", // Only consider approved transactions
    // });

    // if (isEnrolled) {
    //   // User is enrolled, unlock modules for them
    //   course.sections.forEach(section => {
    //     section.modules.forEach(module => {
    //       module.isFree = true; // Set isFree to true for this user only
    //     });
    //   });
    // }

    // Populate reviews that have comments in ratings array
    const reviewsWithComments = await Review.find({
      course: courseId,
      comment: { $exists: true, $ne: "" }, // Check if comment exists and is not empty
    }).populate("user", "name profileImage");

    const { body, statusCode } = success({
      data: { results: course, reviewsWithComments },
    });
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
});

/**
 * @description update course by id
 * @route PUT /api/v1/course/:id
 * @access private [Instructor, Admin]
 */
const updateCourse = asyncHandler(async (req, res, next) => {
  //update course with thumbnails, trailer,courseDescription, whatWillBeTaught, targetAudience, requirements
  const courseId = req.params.id;
  console.log(req.params.id);
  try {
    // 1- Check if the course exists
    const couRse = await Course.findById(courseId);
    if (!couRse) {
      return next(
        recordNotFound({
          message: `course with id ${req.params.id} not found`,
        })
      );
    }
    console.log(req.body);
    //3- Update course by id with the constructed update object
    const updatedData = await Course.findByIdAndUpdate(courseId, req.body, {
      new: true,
    });

    if (!updatedData) console.log("msh mwgod");
    //4- send a response
    const { statusCode, body } = success({ data: updatedData });
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
});

/**
 * @description delete course by id
 * @route DELETE /api/v1/course/:id
 * @access private [Instructor, Admin]
 */
const deleteCourse = asyncHandler(async (req, res, next) => {
  try {
    // 1- get course id
    const courseId = req.params.id;

    // 2- Find the course by id
    const deletedCourse = await Course.findById(courseId);

    // 3- Check if course exists
    if (!deletedCourse) {
      return next(
        recordNotFound({
          message: `Course with id ${req.params.id} not found`,
        })
      );
    }

    // 4- Remove course from instructor's courses
    await User.updateMany(
      { courses: courseId },
      { $pull: { courses: courseId } }
    );

    // 5- Remove course from category's courses
    await Category.updateMany(
      { courses: courseId },
      { $pull: { courses: courseId } }
    );

    // 7- Delete sections associated with the course
    //const Sections = deletedCourse.sections;

    // 8 - iterate over all sections
    const sections = deletedCourse.sections;
    for (const sectionId of sections) {
      // 9- get section
      const sec = await Section.findById(sectionId);
      // 10- get section's modules

      if (sec) {
        console.log(sec);
        const secModules = sec.modules;
        // 11- iterate through modules and delete each
        for (const module of secModules) {
          const deletedModule = await Module.findByIdAndDelete(module);
          if (!deletedModule) {
            console.log(`Module with ID ${module} notfound.`);
          }
        }
        // 12- delete section
        await Section.findByIdAndDelete(sectionId);
      }
    }

    // 13- delete course
    await Course.findByIdAndDelete(courseId);

    // 14- Send response
    const { statusCode, body } = success({
      message: "Course, associated modules, and sections deleted successfully",
    });
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
});

/**
 * @description Add course to wishlist
 * @route PUT /api/v1/course/wishlist
 * @access protected User
 */
const addCourseToWishlist = asyncHandler(async (req, res, next) => {
  const { _id } = req.user;
  const { courseId } = req.body;

  // get course by id
  const course = await Course.findById(courseId).populate({
    path: "instructor",
    select: "-_id name",
  });

  // check if course exists
  if (!course) {
    return next(recordNotFound({ message: "Course not found" }));
  }
  // 1- get user by id
  const user = await User.findById(_id);
  // 2- check if the course is already in wishlist
  const alreadyAdded = user.wishlist.find((id) => id.toString() === courseId);

  if (alreadyAdded) {
    // remove the course from wishlist
    await User.findByIdAndUpdate(
      _id,
      { $pull: { wishlist: courseId } },
      { new: true }
    );
    // get response back
    const { statusCode, body } = success({
      message: "Course removed successfully from your wishlist.",
    });
    res.status(statusCode).json(body);
  } else {
    // add course to wishlist
    await User.findByIdAndUpdate(
      _id,
      { $push: { wishlist: courseId } },
      { new: true }
    );

    //get the allowd data
    const addedCourse = {};
    addedCourse.title = course.title;
    addedCourse.duration = course.duration;
    addedCourse.thumbnail = course.thumbnail;
    addedCourse.price = course.price;
    addedCourse.sections = course.sections.length;
    addedCourse.instructor = course.instructor.name;
    addedCourse.ratingsAverage = course.ratingsAverage;
    // get response back
    const { statusCode, body } = success({
      message: "Course added successfully to your wishlist.",
      data: addedCourse,
    });
    res.status(statusCode).json(body);
  }
});

/**
 * @description getuserwishlist
 * @route GET /api/v1/course/wishlist
 * @access protected User
 */
const getLoggedUserWishlist = asyncHandler(async (req, res) => {
  // 1- get user by id
  const user = await User.findById(req.user._id).populate("wishlist");
  // get wishlist courses
  const wishlistCourses = user.wishlist;

  const formattedCourses = [];
  //iterate through wishlist courses
  for (const course of wishlistCourses) {
    const cour = await Course.findById(course).populate(
      "instructor",
      "-_id name"
    );
    // check if exists
    if (cour) {
      //push into formatted courses
      formattedCourses.push({
        _id: cour._id,
        title: cour.title,
        duration: cour.duration,
        thumbnail: cour.thumbnail,
        price: cour.price,
        instructor: cour.instructor.name,
        sections: (cour.sections = course.sections.length),
        ratingsAverage: cour.ratingsAverage,
      });
    }
  }

  // 2- get response back
  const { statusCode, body } = success({
    message: "User Wishlist:",
    data: { resutls: formattedCourses },
  });
  res.status(statusCode).json(body);
});

/**
 * @description getuserwishlist
 * @route GET /api/v1/course/wishlist
 * @access protected User
 */
const getEnrolledCourses = asyncHandler(async (req, res) => {
  // 1- Get user by id
  const user = await User.findById(req.user._id).populate("enrolledCourses");
  const enrolledCourses = user.enrolledCourses;

  const formattedCourses = [];

  // Iterate through enrolled courses
  for (const course of enrolledCourses) {
    const cour = await Course.findById(course).populate(
      "instructor",
      "-_id name"
    );
    // Check if course exists
    if (cour) {
      // Get user progress for this course
      const progress = await Progress.findOne({
        user: req.user._id,
        course: cour._id,
      });

      // Push into formatted courses
      formattedCourses.push({
        _id: cour._id,
        title: cour.title,
        thumbnail: cour.thumbnail,
        instructor: cour.instructor.name,
        progress: progress ? progress.progress : 0,
      });
    }
  }

  // 2- Get response back
  const { statusCode, body } = success({
    message: "Enrolled courses with progress",
    data: { results: formattedCourses },
  });
  res.status(statusCode).json(body);
});

/**
 * @description get all courses to specific category
 * @route GET /api/v1/course/categoriesId/:categoryId
 * @access protected User
 */
const getCoursesInCategory = asyncHandler(async (req, res, next) => {
  try {
    // 1- get category by id
    const categoryWithCourses = await Category.findById(req.params.categoryId);
    // 2- check if the category exists
    if (
      !categoryWithCourses ||
      !categoryWithCourses.courses ||
      categoryWithCourses.courses.length === 0
    ) {
      return next(
        recordNotFound({ message: `Courses not found for this category` })
      );
    }
    const courses = categoryWithCourses.courses;
    const formattedCourses = [];

    for (const courseId of courses) {
      // get course by id
      const course = await Course.findById(courseId).populate(
        "instructor",
        "name"
      ); // Populate instructor's name only

      if (course) {
        if (course.publish == true) {
          formattedCourses.push({
            _id: course._id,
            title: course.title,
            thumbnail: course.thumbnail,
            price: course.price,
            ratingsAverage: course.ratingsAverage || 0,
            instructorName: course.instructor.name, // Include instructor's name in the output
            profits: course.profits || 0,
            language: course.language,
            enrolledStudentsCount: course.enrolledUsers
              ? course.enrolledUsers.length
              : 0,
          });
        }
      }
    }

    // 5- return response
    const { statusCode, body } = success({
      message: "Category Courses",
      data: { results: formattedCourses },
    });
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
});

/**
 * @description get courses by specific instructor with selected fields
 * @route GET /api/v1/course/getinstructorcourse
 * @access protected User
 */
const getCoursesByInstructor = asyncHandler(async (req, res, next) => {
  try {
    // get instructor id
    const { _id } = req.user;
    // 1- get instructor by id
    const instructor = await User.findById(_id);

    // 2- check if the instructor exists
    if (!instructor || !instructor.courses || instructor.courses.length === 0) {
      return next(
        recordNotFound({ message: `Courses not found for this instructor` })
      );
    }

    // 3- get the instructor courses
    const Courses = instructor.courses; // Array of courses for the instructor
    console.log(Courses);

    // 5- map through each course and get the id, title, thumbnail, price, ratingsAvaerage, and instructorName
    const formattedCourses = [];
    for (const courseId of Courses) {
      // get course by id
      const course = await Course.findById(courseId).populate(
        "instructor",
        "name"
      ); // Populate instructor's name only
      //check if exists
      if (course) {
        //if (course.publish == true) {
        formattedCourses.push({
          _id: course._id,
          title: course.title,
          thumbnail: course.thumbnail,
          price: course.price,
          ratingsAverage: course.ratingsAverage || 0,
          instructorName: course.instructor.name,
          profits: course.profits || 0,
          enrolledStudentsCount: course.enrolledUsers
            ? course.enrolledUsers.length
            : 0,
        });
        //}
      }
    }
    // 6- return response
    const { statusCode, body } = success({
      message: "Instructor courses",
      data: { results: formattedCourses },
    });
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
});

const clearCatogryCourses = asyncHandler(async (req, res, next) => {
  try {
    const catogory = await Category.findById(req.params.id);

    const courses = catogory.courses;
    console.log(courses);

    if (!courses) {
      return next(recordNotFound({ message: "Courses not found" }));
    }

    for (const coursesId of courses) {
      await Category.updateMany(
        { courses: coursesId },
        { $pull: { courses: coursesId } }
      );
    }
    const { statusCode, body } = success({
      message: "catogery courses pulled successfully",
    });
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
});

/**
 * @description get search for course
 * @route get /api/v1/course/search/course
 * @access protected User
 */
const searchCourse = asyncHandler(async (req, res, next) => {
  try {
    let mongooseQuery = Course.find().populate({
      path: "instructor",
      select: "name -_id",
    });
    // Search by keyword if provided
    const { keyword } = req.query; //keyword
    if (keyword) {
      let query = {};
      query.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { subTitle: { $regex: keyword, $options: "i" } },
        // { courseDescription: { $regex: keyword, $options: "i" } },
      ];
      console.log("Search query:", query);
      mongooseQuery = mongooseQuery.find(query);
    }
    // Execute the MongoDB query
    const courses = await mongooseQuery;

    if (courses.length === 0) {
      return next(recordNotFound({ message: "No courses found" }));
    }
    //
    const formattedCourses = [];
    for (const courseId of courses) {
      // get course by id
      const course = await Course.findById(courseId).populate(
        "instructor",
        "name"
      ); // Populate instructor's name only

      if (course) {
        if (course.publish == true) {
          formattedCourses.push({
            _id: course._id,
            title: course.title,
            thumbnail: course.thumbnail,
            price: course.price,
            ratingsAverage: course.ratingsAverage || 0,
            instructorName: course.instructor.name, // Include instructor's name in the output
            profits: course.profits || 0,
          });
        }
      }
    }
    // send response back
    const { statusCode, body } = success({
      message: "Searched courses",
      data: { results: formattedCourses },
    });
    res.status(statusCode).json(body);
  } catch (err) {
    next(err);
  }
});

/**
 * @description get search for course and instructor
 * @route get /api/v1/course/search/instructor
 * @access protected User
 */
// const searchCourse = asyncHandler(async (req, res, next) => {
//   try {
//     const { keyword, searchType } = req.query;

//     let formattedCourses = [];

//     if (searchType === "instructor" && keyword) {
//       // Search for instructors by name
//       const instructors = await User.find({ name: { $regex: keyword, $options: "i" } }).populate('courses');

//       if (!instructors || instructors.length === 0) {
//         return next(recordNotFound({ message: "No instructor found" }));
//       }

//       // Extract and format courses for each instructor
//       for (const instructor of instructors) {
//         for (const courseId of instructor.courses) {
//           // Get course by id and populate instructor's name
//           const course = await Course.findById(courseId).populate('instructor', 'name');

//           // Check if course exists
//           if (course) {
//             formattedCourses.push({
//               _id: course._id,
//               title: course.title,
//               thumbnail: course.thumbnail,
//               price: course.price,
//               ratingsAverage: course.ratingsAverage || 0,
//               instructorName: course.instructor.name, // Include instructor's name in the output
//             });
//           }
//         }
//       }
//     } else if (searchType === "course" && keyword) {
//       // Search for courses by title, subtitle, or description
//       const query = {
//         $or: [
//           { title: { $regex: keyword, $options: "i" } },
//           { subTitle: { $regex: keyword, $options: "i" } },
//           { courseDescription: { $regex: keyword, $options: "i" } }
//         ]
//       };

//       const courses = await Course.find(query).populate('instructor', 'name');

//       if (courses.length === 0) {
//         return next(recordNotFound({ message: "No courses found" }));
//       }

//       // Format the courses
//       for (const course of courses) {
//         formattedCourses.push({
//           _id: course._id,
//           title: course.title,
//           thumbnail: course.thumbnail,
//           price: course.price,
//           ratingsAverage: course.ratingsAverage || 0,
//           instructorName: course.instructor.name, // Include instructor's name in the output
//           profits: course.profits || 0
//         });
//       }
//     } else {
//       return next(recordNotFound({ message: "Invalid search type or keyword not provided" }));
//     }

//     // Send response back
//     const { statusCode, body } = success({
//       message: 'Search results',
//       data: { results: formattedCourses }
//     });
//     res.status(statusCode).json(body);
//   } catch (err) {
//     next(err);
//   }
// });
/**
 * @description get search for course
 * @route get /api/v1/course/search/category
 * @access protected User
 */
const searchCatogery = asyncHandler(async (req, res, next) => {
  try {
    let mongooseQuery = Category.find();

    // Search by keyword if provided
    const { keyword } = req.query; //keyword
    console.log(keyword);
    if (keyword) {
      console.log("in");
      let query = {};
      query.$or = [{ name: { $regex: keyword, $options: "i" } }];

      console.log("Search query:", query);
      mongooseQuery = mongooseQuery.find(query);
    }

    // Execute the MongoDB query
    const category = await mongooseQuery;
    console.log(category);
    //check if the exist an instructor
    if (!category || category.length === 0) {
      return next(recordNotFound({ message: "No category found" }));
    }
    // extract courses
    const Courses = category[0].courses; //for empty search it return 1st course
    //check if threre course exists
    if (!Courses) {
      return next(
        recordNotFound({ message: "there is no courses for this category" })
      );
    }
    // iterate over the courses
    const formattedCourses = [];
    for (const courseId of Courses) {
      // get course by id
      const course = await Course.findById(courseId).populate(
        "instructor",
        "name"
      ); // Populate instructor's name only
      //check if exists
      if (course) {
        formattedCourses.push({
          _id: course._id,
          title: course.title,
          thumbnail: course.thumbnail,
          price: course.price,
          ratingsAverage: course.ratingsAverage || 0,
          instructorName: course.instructor.name, // Include instructor's name in the output
        });
      }
    }
    // send response back
    const { statusCode, body } = success({
      message: "category courses",
      data: { results: formattedCourses },
    });
    res.status(statusCode).json(body);
  } catch (err) {
    next(err);
  }
});

/**
 * @description calculate duration
 * @route  /api/v1/course/calculate-duration/:id
 * @access protected Instructor
 */
const coursDuration = asyncHandler(async (req, res, next) => {
  try {
    // Get course by id
    const course = await Course.findById(req.params.id);
    console.log(course);

    // Check if course exists
    if (!course) {
      return next(recordNotFound({ message: "course not found" }));
    }

    // Check if there are sections in this course
    if (course.sections) {
      // Get course sections
      const sectionsId = course.sections;
      console.log(sectionsId);

      // Initiate course duration
      let hours = 0,
        minutes = 0,
        seconds = 0;

      // Iterate through each section
      for (const section of sectionsId) {
        // Get section by id
        console.log(section);
        const sec = await Section.findById(section);

        if (sec) {
          // Extract section duration
          hours += sec.sectionDuration.hours;
          minutes += sec.sectionDuration.minutes;
          seconds += sec.sectionDuration.seconds;
        }
      }

      // Normalize course duration
      const normalizedDuration = normalizeDuration(hours, minutes, seconds);
      course.duration.hours = normalizedDuration.hours;
      course.duration.minutes = normalizedDuration.minutes;
      course.duration.seconds = normalizedDuration.seconds;

      // Save course
      await course.save();

      // Return response
      const { statusCode, body } = success({
        message: "Course duration calculated successfully",
        data: course.duration,
      });
      res.status(statusCode).json(body);
    }
  } catch (err) {
    next(err);
  }
});

/**
 * @description set publish to true or false
 * @route PUT /api/v1/course/setPublish
 * @access protected Instructor
 */
const setPublish = asyncHandler(async (req, res, next) => {
  const courseID = req.body.courseId;
  console.log(courseID);
  const course = await Course.findByIdAndUpdate(
    courseID,
    {
      publish: true,
    },
    { new: true }
  );
  if (!course) {
    return next(recordNotFound({ message: "Course not found" }));
  }
  const { statusCode, body } = success({
    message: "Course Published successfully",
    data: course,
  });
  res.status(statusCode).json(body);
});

/**
 * @description add an online complier to this course
 * @route PUT /api/v1/course/addCompiler
 * @access protected Instructor
 */
const addCompiler = asyncHandler(async (req, res, next) => {
  const courseID = req.body.courseId;
  console.log(courseID);
  const course = await Course.findByIdAndUpdate(
    courseID,
    {
      compiler: req.body.compiler,
    },
    { new: true }
  );
  if (!course) {
    return next(recordNotFound({ message: "Course not found" }));
  }
  const { statusCode, body } = success({
    message: "compiler for this course added successfully",
    data: course,
  });
  res.status(statusCode).json(body);
});

module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  resizethumbnailImg,
  uploadtBoth,
  addCourseToWishlist,
  getLoggedUserWishlist,
  getCoursesInCategory,
  getCoursesByInstructor,
  searchCourse,
  searchCatogery,
  clearCatogryCourses,
  coursDuration,
  setPublish,
  addCompiler,
  getEnrolledCourses,
};
