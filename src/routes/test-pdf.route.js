const express = require("express");
const { generateTestPDF } = require("../controller/test-pdf.controller");

const router = express.Router();

// Test route for PDF generation and Cloudinary upload
router.route("/").post(generateTestPDF);

module.exports = router;