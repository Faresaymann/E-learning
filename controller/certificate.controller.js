const path = require("path");
//const pdf = require('html-pdf');   
const pdf = require('html-pdf-node');
const Certificate = require("../models/certificate.model");
const Course = require("../models/Course.model");
const User = require("../models/user.model");
const { v4: uuid } = require("uuid");
const asyncHandler = require("express-async-handler");
const { recordNotFound, validationError } = require("../utils/response/errors");
const { success } = require("../utils/response/response");
const {
  uploadCertificateToCloudinary,
} = require("../services/file-upload.service");
const generateCertificateContent = require("../utils/pdfCertificate");
//const puppeteer = require("puppeteer");
const ApiServerce = require("../services/factory.service");
const sendEmail = require("../services/email.service");

/**
 * @description create certificate
 * @route POST /api/v1/certificate/
 * @access public
 */
const CertificateGeneration = asyncHandler(async (req, res, next) => {
  const courseId = req.body.courseId;
  const userId = req.user._id;

// // check if certificate already exists for this user and course
//   const existingCert = await Certificate.findOne({ course: courseId, user: userId });
//   if (existingCert) {
//     // If already generated, return the existing certificate
//     const { statusCode, body } = success({
//       message: "Certificate already generated",
//       data: existingCert,
//     });
//     return res.status(statusCode).json(body);
//   }

  //get course by id
  const course = await Course.findById(courseId).populate("instructor", "name");
  //get user by id
  const user = await User.findById(userId); //certificates

  // check if course and user exist
  if (!course) {
    return next(recordNotFound({ message: "Course not found" }));
  }
  if (!user) {
    return next(recordNotFound({ message: "User not found" }));
  }

  //retrieve score from frontend
  const score = req.body.score;

  // 3. Pass/fail check
  if (score < 70) {
    const { statusCode, body } = success({ message: "You must continue the Course First!" });
    return res.status(statusCode).json(body);
  }

  // 4. Build serial + duration
  const certNo   = `cert-${uuid()}-${userId}-${courseId}-${Date.now()}`;
  const duration = Math.round(course.duration.hours);//const duration = Math.round(course.duration.hours * 60);

  // 5. Render HTML with your template
  const html = generateCertificateContent(
    certNo,
    user.name,
    course.title,
    course.instructor.name,
    duration,
    'Techtonic'
  );

  try {
    // 6. Convert HTML → PDF via html-pdf-node
    const file   = { content: html };
    const options = {
      format: 'A4',
      margin: { top: '0', bottom: '0' },
      printBackground: true   // ← include CSS backgrounds in the PDF
    };
    const buffer = await pdf.generatePdf(file, options);

    console.log(`Generated PDF, size=${buffer.length} bytes`);

    // 7. Upload to Cloudinary
    const result = await uploadCertificateToCloudinary(
      buffer,
      'certificate',
      userId,
      courseId
    );
    if (!result?.secure_url) {
      console.error('Cloudinary upload returned:', result);
      return next(validationError({ message: 'Error uploading certificate' }));
    }
    const downloadLink = result.secure_url;

    // 8. Persist link on user & in Certificate model
    await User.findByIdAndUpdate(userId, { $push: { certificates: downloadLink } });
    const certificate = await Certificate.create({
      course: courseId,
      user: userId,
      url: downloadLink,
      score,
      serialNumber: certNo,
      issuer: 'Techtonic',
    });
 // 9. Send certificate email
    const completionDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    try {
      const certRecord = await Certificate.findOne({ course: courseId, user: userId });
      await sendEmail({
        to: user.email,
        subject: `Congratulations on Completing ${course.title}!`,
        template: "\\views\\CertificateComplete.ejs",
        data: {
          courseName: course.title,
          instructorName: course.instructor.name,
          courseDuration: duration,
          completionDate,
          certificateUrl: downloadLink,
          cert_no: certNo,
          cert_id: certRecord?._id || null,
          user,
        },
      });
      console.log(`Certificate email sent to ${user.email} for course ${course.title}`);
    } catch (emailError) {
      console.error("Error sending certificate email:", emailError);
    }

    // 10. Final response
    const { statusCode, body } = success({
      message: 'CONGRATULATIONS!',
      data: certificate,
    });
    return res.status(statusCode).json(body);

  } catch (err) {
    console.error('PDF-generation/upload error:', err);
    return next(validationError({ message: 'Certificate generation failed' }));
  }
});

/**
 * @description get all certificates
 * @route GET /api/v1/certificate/
 * @access public
 */
const getAllCertificates = ApiServerce.getAll(Certificate);

/**
 * @description get certficate by id
 * @route GET /api/v1/certificate/:certificateId
 * @access public
 */
const getOneCertificate = ApiServerce.getOne(Certificate);

/**
 * @description update certificate by id
 * @route PUT /api/v1/certificate/:certificateId
 * @access public
 */
const updateCertificate = ApiServerce.getAll(Certificate);

/**
 * @description delete certificate by id
 * @route DELETE /api/v1/certificate/:certificateId
 * @access public
 */
const deleteCertificate = ApiServerce.deleteOne(Certificate);

/**
 * @description View certificate
 * @route GET /api/v1/certificate/view
 * @access public
 */
const viewCertificate = asyncHandler(async (req, res, next) => {
  // Check if certificate ID is provided
  const { id } = req.query;

  if (id) {
    // If ID is provided, fetch certificate from database
    const certificate = await Certificate.findById(id)
      .populate("course", "title duration")
      .populate("user", "name");

    if (!certificate) {
      return next(recordNotFound({ message: "Certificate not found" }));
    }

    // Get course and instructor information
    const course = await Course.findById(certificate.course._id).populate(
      "instructor",
      "name"
    );

    // Calculate duration in hours
    const duration =
      course && course.duration ? Math.round(course.duration.hours) : 0;

    // Extract certificate number from URL or use stored serial number
    let certNo;
    if (certificate.serialNumber) {
      certNo = certificate.serialNumber;
    } else {
      const urlParts = certificate.url.split("/");
      const certFileName = urlParts[urlParts.length - 1];
      certNo = certFileName.split(".")[0]; // Remove file extension
    }

    // If this is a direct download request, serve the PDF directly
    if (req.query.download === "true") {
      // Redirect to the Cloudinary URL for direct download
      return res.redirect(certificate.url);
    }

    // Send the certificate view HTML file with query parameters
    return res.sendFile(path.join(__dirname, "../views/certificate-view.html"));
  } else {
    // If no ID, just send the empty certificate view HTML file
    return res.sendFile(path.join(__dirname, "../views/certificate-view.html"));
  }
});

module.exports = {
  CertificateGeneration,
  viewCertificate,
  getAllCertificates,
  getOneCertificate,
  updateCertificate,
  deleteCertificate,
};
