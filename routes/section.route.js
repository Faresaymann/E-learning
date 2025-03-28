const { Router } = require("express");
const {
    createSection,
    getAllSections,
    getSectionByid,
    updateSection,
    deleteSection,
    uploadModuleVideos,
    uploadVideosToCloud,
    secDuration
} = require("../controller/section.controller");

const { protect, allowedRoles } = require("../services/auth.service");

//validators
const {
    createSectionValidator,
    getSectionValidator,
    updateSectionValidator,
    deleteSectionValidator
} = require("../utils/validations/section.validation")


const router = Router();

// protected
router.use(protect);

// private [Instructor]
router.use(allowedRoles("Instructor", "Admin"));

router.route("/")
    .get(getAllSections)
    .post(
        createSectionValidator,
        createSection)

router.route("/:id")
    .get(
        getSectionValidator,
        getSectionByid
    )
    .put(
        uploadModuleVideos,
        updateSectionValidator,
        updateSection
    )
    .delete(
        deleteSectionValidator,
        deleteSection
    );

router.route("/calculate-duration/:id")
    .put(secDuration)

module.exports = router;