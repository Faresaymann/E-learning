/**
 * @route /api/v1/course
 */

const { Router } = require("express");
const {
    createCourse,
    getAllCourses,
    deleteCourse,
    updateCourse,
    getCourseById,
    uploadtBoth,
    resizethumbnailImg,
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

} = require("../controller/course.controller");

const { protect, allowedRoles } = require("../services/auth.service");

const {
    //createCourseValidator,
    deleteCourseValidator,
    getCourseValidator,
    //updateCourseValidator,
} = require("../utils/validations/course.validation");

const router = Router();



// protected
router.use(protect);

router.route("/clearCategCourses/:id")
    .get(clearCatogryCourses)

router.route("/categoriesId/:categoryId")
    .get(getCoursesInCategory)

router.route("/search/course")
    .get(searchCourse)

router.route("/search/catogery")
    .get(searchCatogery)

router.route("/getInstructorCourse")
    .get(getCoursesByInstructor);

// user & instructor & admin
router.route("/calculate-duration/:id")
    .put(coursDuration)

router.route("/setPublish")
    .put(setPublish)

router.route("/addCompiler")
    .put(addCompiler)

router.route("/wishlist")
    .put(addCourseToWishlist)
    .get(getLoggedUserWishlist);

router.route("/enrolledCourses")
    .get(getEnrolledCourses);

router.route("/")
    .get(getAllCourses)

router.route("/:id")
    .get(
        getCourseValidator,
        getCourseById)


// private [Instructor,Admin]
router.use(allowedRoles("Instructor", "Admin"));

router.route("/")
    .post(
        //uploadtBoth,
        //resizethumbnailImg,
        //createCourseValidator,
        createCourse);

router.route("/:id")
    .delete(
        deleteCourseValidator,
        deleteCourse
    )
    .put(
        (req , res ,next) =>{
            console.log("ay 7agaaa")
            next();  
        },
        uploadtBoth,
        (req , res ,next) =>{
            console.log("ay 7agaaa ")
            console.log(req.file , req.files)
            next();  
        },
        resizethumbnailImg,
        //updateCourseValidator,//error 
        updateCourse
    );

module.exports = router;