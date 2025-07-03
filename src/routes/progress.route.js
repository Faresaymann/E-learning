const { Router } = require("express");
const {
  updateProgress,
  getProgressByCourse
} = require("../controller/progress.controller");


const { protect } = require("../services/auth.service");

const router = Router();
// protected
router.use(protect);
router
.route("/")
.post(updateProgress)

router.get('/:courseId', getProgressByCourse);

module.exports = router;
