const express = require('express');

const {
    CertificateGeneration,
    getAllCertificates,
    getOneCertificate,
    updateCertificate,
    deleteCertificate
} = require('../controller/certificate.controller');
const { protect, allowedRoles } = require("../services/auth.service");

const router = express.Router();

// protected
router.use(protect);

router.route('/')
    .post(CertificateGeneration)

//allowed roles
router.use(protect, allowedRoles('Admin'));

router.route('/')
    .get(getAllCertificates)

router.route('/:id')
    .get(getOneCertificate)
    .put(updateCertificate)
    .delete(deleteCertificate)


module.exports = router;
