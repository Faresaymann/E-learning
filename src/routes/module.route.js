/**
 * @route /api/v1/coursemodule
 */
const { Router } = require("express");
const {
  createModule,
  deleteModule,
  getAllModules,
  getModuleById,
  updateModule,
  uploadModuleVideos,
  uploadVideosToCloud,
  CalcDuration,
  setFreeNotFree,
  calculateModuleDuration,
  getModulesBySectionId,
} = require("../controller/module.controller");

const { protect, allowedRoles } = require("../services/auth.service");

const {
  createModuleValidator,
  deleteModuleValidator,
  getModuleValidator,
  updateModuleValidator,
  getModulesBySectionIdValidator,
} = require("../utils/validations/module.validation");

const router = Router();

// protected
router.use(protect);

router.route("/:id").get(getModuleValidator, getModuleById);

// private [Instructor,Admin]
router.use(allowedRoles("Instructor", "Admin"));

router
  .route("/")
  .get(getAllModules)
  .post(
    uploadModuleVideos,
    uploadVideosToCloud,
    /*createModuleValidator,*/ createModule
  );

router.route("/calculate-duration/:id").put(CalcDuration);

router.route("/setFreeNotFree/:id").put(setFreeNotFree);

router
  .route("/:id")
  .delete(deleteModuleValidator, deleteModule)
  .put(updateModuleValidator, updateModule);

// Route to get modules by section ID
router
  .route("/section/:sectionId")
  .get(getModulesBySectionIdValidator, getModulesBySectionId);

router.post("/api/v1/coursemodule", uploadVideosToCloud);
module.exports = router;