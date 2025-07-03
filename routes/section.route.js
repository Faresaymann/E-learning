const { Router } = require("express");
const {
  createSection,
  getAllSections,
  getSectionByid,
  updateSection,
  deleteSection,
  uploadModuleVideos,
  uploadVideosToCloud,
  secDuration,
  getSectionsByCourseId,
} = require("../controller/section.controller");

const { protect, allowedRoles } = require("../services/auth.service");

//validators
const {
  createSectionValidator,
  getSectionValidator,
  updateSectionValidator,
  deleteSectionValidator,
  getSectionsByCourseIdValidator,
} = require("../utils/validations/section.validation");

const router = Router();

// protected
router.use(protect);

// Routes to get sections by course ID
// Support both formats:
// 1. /course/:courseId (path parameter)
// 2. /course (with query parameter)
// 3. /course/:id (alternative path parameter format)
router
  .route("/course/:courseId")
  .get(getSectionsByCourseIdValidator, getSectionsByCourseId);

router
  .route("/course/:id")
  .get(getSectionsByCourseIdValidator, (req, res, next) => {
    // Map the :id parameter to :courseId for consistency
    req.params.courseId = req.params.id;
    getSectionsByCourseId(req, res, next);
  });

// private [Instructor]
router.use(allowedRoles("Instructor", "Admin"));

router
  .route("/")
  .get(getAllSections)
  .post(createSectionValidator, createSection);

router
  .route("/:id")
  .get(getSectionValidator, getSectionByid)
  .put(uploadModuleVideos, updateSectionValidator, updateSection)
  .delete(deleteSectionValidator, deleteSection);

router.route("/calculate-duration/:id").put(secDuration);

router
  .route("/course")
  .get(getSectionsByCourseIdValidator, getSectionsByCourseId);

module.exports = router;
