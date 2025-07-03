const express = require("express");

const {
  CertificateGeneration,
  viewCertificate,
  getAllCertificates,
  getOneCertificate,
  updateCertificate,
  deleteCertificate,
} = require("../controller/certificate.controller");

// const {
//   downloadCertificatePDF,
//   viewCertificatePDF,
// } = require("../controller/certificate-download.controller");

const { protect, allowedRoles } = require("../services/auth.service");

const router = express.Router();

// Public routes for viewing and downloading certificates
router.route("/view").get(viewCertificate);
router.route("/download/:id").get((req, res) => {
  req.query.id = req.params.id;
  req.query.download = "true";
  viewCertificate(req, res);
});

// // New PDF certificate endpoints
// router.route("/download-pdf/:id").get(downloadCertificatePDF);
// router.route("/view-pdf/:id").get(viewCertificatePDF);

// protected
router.use(protect);

router.route("/").post(CertificateGeneration);

//allowed roles
router.use(protect, allowedRoles("Admin"));

router.route("/").get(getAllCertificates);

router
  .route("/:id")
  .get(getOneCertificate)
  .put(updateCertificate)
  .delete(deleteCertificate);

module.exports = router;
