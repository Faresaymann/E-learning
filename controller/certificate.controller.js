const Certificate = require("../models/certificate.model");
const Course = require("../models/Course.model");
const User = require("../models/user.model");
const { v4: uuid } = require("uuid");
const asyncHandler = require("express-async-handler");
const {
    recordNotFound,
    validationError,
} = require("../utils/response/errors");
const { success } = require("../utils/response/response");
const {
    uploadCertificateToCloudinary
} = require("../services/file-upload.service");
const generateCertificateContent = require("../utils/certificate");
const puppeteer = require('puppeteer');
const ApiServerce = require('../services/factory.service');

/**
 * @description create certificate
 * @route POST /api/v1/certificate/
 * @access public 
 */
const CertificateGeneration = asyncHandler(async (req, res, next) => {
    const courseId = req.body.courseId;
    const userId = req.user._id;
    //get course by id
    const course = await Course.findById(courseId).populate('instructor', 'name');
    //get user by id
    const user = await User.findById(userId);//certificates

    // check if course and user exist
    if (!course) {
        return next(recordNotFound({ message: 'Course not found' }))
    }
    if (!user) {
        return next(recordNotFound({ message: 'User not found' }))
    }

    //retrieve score from frontend
    const score = req.body.score;

    //check if user passes
    if (score >= 70) {
        // create unique identifier with userid and courseid n
        const cert_no = `cert-${uuid()}-${userId}-${courseId}-${Date.now()}`;
        //round the course's duration
        const duration = Math.round(course.duration.hours);
        //pass user's certificate's no, user's name, course title, hours
        const certificateContent = generateCertificateContent(cert_no, user.name, course.title,
            course.instructor.name, duration);

        try {
            // generate certificate
            const browser = await puppeteer.launch();
            const page = await browser.newPage();

            await page.setContent(certificateContent);

            const widthInInches = 3; // Adjusted width
            const heightInInches = 2.5; // Adjusted height

            const dpi = 300;

            const widthInPixels = widthInInches * dpi;
            const heightInPixels = heightInInches * dpi;

            // Set viewport size
            await page.setViewport({
                width: widthInPixels,
                height: heightInPixels,
            });

            const cert = await page.pdf({
                path: 'CERTIFICATE.png',
                format: undefined,
                printBackground: true,
                margin: 0,
                omitBackground: true,
                width: widthInPixels,
                height: heightInPixels,
            });
            console.log(cert);
            // console.log("done");
            await browser.close();

            const certBuffer = Buffer.from(cert.buffer);
            const result = await uploadCertificateToCloudinary(certBuffer, "certificate", userId, courseId);
            let downloadLink = 'link';

            if (result && result.secure_url) {
                downloadLink = result.secure_url;
            } else {
                return next(validationError({ message: "Error uploading certificate" }));
            }

            // add this certificate to the user's list of certificate
            await User.findByIdAndUpdate(
                userId,
                { $push: { certificates: downloadLink } },
                { new: true }
            );
            // create certificate model with  courseid, user id, score,certificate's url
            const certificate = await Certificate.create({
                course: courseId,
                user: userId,
                url: downloadLink,
                score: score
            })

            const { statusCode, body } = success({
                message: 'CONGRATULATIONS!',
                data: certificate,
            });
            res.status(statusCode).json(body);
        } catch (error) {
            console.error(error);
        }
    } else {
        const { statusCode, body } = success({
            message: 'unfotunatly you failed. good luck next time!'
        });
        res.status(statusCode).json(body);
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

module.exports = {
    CertificateGeneration,
    getAllCertificates,
    getOneCertificate,
    updateCertificate,
    deleteCertificate
}