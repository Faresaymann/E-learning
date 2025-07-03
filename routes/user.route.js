/**
 * @route /api/v1/users
 */
const { Router } = require("express");
const {
  getAllUsers,
  createUser,
  getUser,
  updateUser,
  updateUserPassword,
  deleteUser,
  getLoggedUser,
  updateLoggedUser,
  updateLoggedUserPassword,
  deleteLoggedUser,
  uploadProfileImage,
  resizeProfileImage,
  getInstructors,
  getTopInstructors,
  getInstructorProfile,
} = require("../controller/user.controller");
const { protect, allowedRoles } = require("../services/auth.service");
const {
  createUserValidator,
  deleteUserValidator,
  getUserValidator,
  updateLoggedUserPasswordValidator,
  updateLoggedUserValidator,
  updateUserPasswordValidator,
  updateUserValidator,
} = require("../utils/validations/user.validation");

const router = Router();

// protected
router.use(protect);
// Route to get top instructors by course ratings
router.route("/top-instructors").get(getTopInstructors);


// Route to get instructor profile with detailed information
router.route("/instructor-profile").get(getInstructorProfile);
router.get("/getMe", getLoggedUser, getUser);
router.put(
  "/updateMe",
  uploadProfileImage,
  resizeProfileImage,
  updateLoggedUserValidator,
  updateLoggedUser,
  updateUser
);
router.put(
  "/changeMyPassword",
  updateLoggedUserPasswordValidator,
  updateLoggedUserPassword
);
router.delete("/deleteMe", deleteLoggedUser);

router
  .route("/:id")
  .put(uploadProfileImage, resizeProfileImage, updateUserValidator, updateUser)

// private [admin]
router.use(allowedRoles("Admin"));

router
  .route("/")
  .get(getAllUsers)
  .post(
    uploadProfileImage,
    resizeProfileImage,
    createUserValidator,
    createUser
  );

// Route to get only instructors
router.route("/instructors").get(protect, getInstructors);


router
  .route("/:id")
  .get(getUserValidator, getUser)
  .delete(deleteUserValidator, deleteUser);

router.put(
  "/changePassword/:id",
  updateUserPasswordValidator,
  updateUserPassword
);

module.exports = router;