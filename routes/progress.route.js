const { Router } = require("express");
const {
    updateProgress
} = require("../controller/progress.controller");


const { protect } = require("../services/auth.service");

const router = Router();
// protected
router.use(protect);
router
  .route("/")
  .post(updateProgress)

module.exports = router;
