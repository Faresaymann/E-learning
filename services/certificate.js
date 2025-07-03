// const path = require("path");
// const Certificate = require("../models/certificate.model");
// const Course = require("../models/Course.model");
// const User = require("../models/user.model");
// const { v4: uuid } = require("uuid");
// const { recordNotFound, validationError } = require("../utils/response/errors");
// const { uploadCertificateToCloudinary } = require("./file-upload.service");
// const generateCertificateContent = require("../utils/pdfCertificate");
// const puppeteer = require("puppeteer");
// const sendEmail = require("./email.service");

// /**
//  * Generates a certificate for a user who completed a course and sends an email notification
//  * @param {Object} options - Certificate generation options
//  * @param {Object} options.user - User object
//  * @param {Object} options.course - Course object with populated instructor
//  * @param {string} options.completionDate - Formatted completion date
//  * @param {string} options.baseUrl - Base URL for the application
//  * @returns {Promise<Object>} - Certificate data
//  */
// exports.generateAndEmailCertificate = async ({
//   user,
//   course,
//   completionDate,
// }) => {
//   if (!user || !course) {
//     throw new Error("User and course are required for certificate generation");
//   }

//   // Create unique identifier
//   const cert_no = `cert-${uuid()}-${user._id}-${course._id}-${Date.now()}`;

//   // Round the course's duration
//   const duration = Math.round(course.duration.hours);

//   // Generate certificate content
//   const certificateContent = generateCertificateContent(
//     cert_no,
//     user.name,
//     course.title,
//     course.instructor.name,
//     duration
//   );

//   try {
//     // Generate certificate PDF
//     const browser = await puppeteer.launch();
//     const page = await browser.newPage();

//     await page.setContent(certificateContent);

//     const widthInInches = 3; // Adjusted width
//     const heightInInches = 2.5; // Adjusted height
//     const dpi = 300;

//     const widthInPixels = widthInInches * dpi;
//     const heightInPixels = heightInInches * dpi;

//     // Set viewport size
//     await page.setViewport({
//       width: widthInPixels,
//       height: heightInPixels,
//     });

//     const cert = await page.pdf({
//       format: "A4",
//       printBackground: true,
//       margin: 0,
//       omitBackground: false,
//       preferCSSPageSize: true,
//     });

//     await browser.close();

//     // Upload to Cloudinary
//     const certBuffer = Buffer.from(cert);
//     const result = await uploadCertificateToCloudinary(
//       certBuffer,
//       "certificate",
//       user._id,
//       course._id
//     );

//     if (!result || !result.secure_url) {
//       throw new Error("Error uploading certificate to Cloudinary");
//     }

//     const downloadLink = result.secure_url;

//     // Add certificate to user's list
//     await User.findByIdAndUpdate(
//       user._id,
//       { $push: { certificates: downloadLink } },
//       { new: true }
//     );

//     // Create certificate record
//     const certificate = await Certificate.create({
//       course: course._id,
//       user: user._id,
//       url: downloadLink,
//       score: 100, // Assuming 100% completion equals 100% score
//       serialNumber: cert_no,
//       issuer: "Techtonic",
//     });

//     // Send certificate email
//     try {
//       await sendEmail({
//         to: user.email,
//         subject: `Congratulations on Completing ${course.title}!`,
//         template: "\\views\\CertificateComplete.ejs",
//         data: {
//           courseName: course.title,
//           instructorName: course.instructor.name,
//           courseDuration: duration,
//           completionDate:
//             completionDate ||
//             new Date().toLocaleDateString("en-US", {
//               year: "numeric",
//               month: "long",
//               day: "numeric",
//             }),
//           certificateUrl: downloadLink,
//           cert_no: cert_no,
//           cert_id: certificate._id,
//           user: user,
//         },
//       });
//       console.log(
//         `Certificate email sent to ${user.email} for course ${course.title}`
//       );
//     } catch (emailError) {
//       console.error("Error sending certificate email:", emailError);
//       // Continue with the process even if email fails
//     }

//     return certificate;
//   } catch (error) {
//     console.error("Certificate generation error:", error);
//     throw error;
//   }
// };
